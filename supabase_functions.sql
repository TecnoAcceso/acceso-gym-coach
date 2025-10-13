-- =========================================
-- FUNCIONES PARA GESTIÓN DE USUARIOS
-- Ejecuta este script en el SQL Editor de Supabase
-- =========================================

-- 1. Función para obtener usuarios con emails
-- Esta función obtiene los perfiles de usuario junto con sus emails de auth.users
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  username text,
  full_name text,
  role text,
  phone text,
  email text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.auth_user_id,
    up.username,
    up.full_name,
    up.role,
    CAST(up.phone AS text),
    au.email,
    up.created_at
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.auth_user_id
  ORDER BY up.created_at DESC;
END;
$$;

-- 2. Función para eliminar usuario de forma segura
-- Esta función elimina el usuario de auth.users (se eliminará en cascada de user_profiles)
CREATE OR REPLACE FUNCTION delete_user_safe(user_auth_id uuid)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar que no sea un superusuario el que se intenta eliminar
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = user_auth_id AND role = 'superuser'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No se puede eliminar un superusuario'
    );
  END IF;

  -- Eliminar usuario de auth.users (cascada a user_profiles)
  DELETE FROM auth.users WHERE id = user_auth_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Usuario eliminado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 3. Agregar columna phone a user_profiles si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN phone text;
  END IF;
END $$;

-- 4. Actualizar función create_user_with_profile para incluir teléfono
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email text,
  user_password text,
  user_username text,
  user_full_name text,
  user_role text,
  user_phone text DEFAULT NULL
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Crear perfil de usuario
  INSERT INTO user_profiles (auth_user_id, username, full_name, role, phone)
  VALUES (new_user_id, user_username, user_full_name, user_role, user_phone);

  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'Usuario creado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 5. Función para actualizar usuario con teléfono y contraseña opcional
CREATE OR REPLACE FUNCTION update_user_profile(
  profile_id uuid,
  new_username text,
  new_full_name text,
  new_role text,
  new_phone text DEFAULT NULL,
  new_password text DEFAULT NULL
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_auth_id uuid;
BEGIN
  -- Obtener el auth_user_id del perfil
  SELECT auth_user_id INTO user_auth_id
  FROM user_profiles
  WHERE id = profile_id;

  -- Actualizar perfil
  UPDATE user_profiles
  SET
    username = new_username,
    full_name = new_full_name,
    role = new_role,
    phone = new_phone
  WHERE id = profile_id;

  -- Si se proporciona nueva contraseña, actualizarla en auth.users
  IF new_password IS NOT NULL AND new_password != '' THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = user_auth_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Perfil actualizado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 6. Función para resetear contraseña por username
CREATE OR REPLACE FUNCTION reset_password_by_username(
  user_username text
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_auth_id uuid;
  user_phone_number text;
  user_full_name_var text;
  temp_password text;
BEGIN
  -- Generar contraseña temporal aleatoria (8 caracteres)
  temp_password := substring(md5(random()::text) from 1 for 8);

  -- Buscar el usuario por username
  SELECT auth_user_id, phone, full_name INTO user_auth_id, user_phone_number, user_full_name_var
  FROM user_profiles
  WHERE username = user_username;

  -- Verificar que el usuario existe
  IF user_auth_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;

  -- Verificar que el usuario tiene teléfono registrado
  IF user_phone_number IS NULL OR user_phone_number = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este usuario no tiene un número de teléfono registrado'
    );
  END IF;

  -- Actualizar contraseña en auth.users
  UPDATE auth.users
  SET
    encrypted_password = crypt(temp_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_auth_id;

  -- Retornar éxito con la contraseña temporal y teléfono
  RETURN json_build_object(
    'success', true,
    'temp_password', temp_password,
    'phone', user_phone_number,
    'full_name', user_full_name_var,
    'message', 'Contraseña temporal generada exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- =========================================
-- INSTRUCCIONES:
-- 1. Abre el SQL Editor en tu panel de Supabase
-- 2. Copia y pega todo este código
-- 3. Ejecuta el script
-- 4. Verifica que no haya errores
-- =========================================
