# 🔐 Actualización: Sistema de Recuperación de Contraseña

## ⚠️ IMPORTANTE - Ejecuta esto en Supabase

Necesitas ejecutar 2 funciones nuevas en el SQL Editor de Supabase:

---

## 📋 Paso 1: Abrir SQL Editor

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **AccesoGymCoach**
3. Click en **SQL Editor** en el menú lateral
4. Click en **New query**

---

## 📋 Paso 2: Ejecutar estas 2 funciones

### Función 1: Actualizar update_user_profile (con contraseña opcional)

```sql
-- Función actualizada para permitir cambio de contraseña opcional
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
```

### Función 2: Resetear contraseña por username

```sql
-- Nueva función para recuperación de contraseña
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
```

---

## 📋 Paso 3: Ejecutar

1. Copia **TODO** el código de arriba (ambas funciones)
2. Pégalo en el SQL Editor
3. Click en **Run** o presiona `Ctrl + Enter`

---

## ✅ ¿Qué hace cada función?

### update_user_profile
- **Ahora**: Permite actualizar perfil con contraseña opcional
- Si el campo `new_password` está vacío, NO cambia la contraseña
- Si tiene valor, actualiza la contraseña
- ✅ Soluciona: "Al editar usuario sin contraseña, mantiene la actual"

### reset_password_by_username
- Busca un usuario por su username
- Genera una contraseña temporal aleatoria de 8 caracteres
- Verifica que el usuario tenga teléfono registrado
- Actualiza la contraseña en la base de datos
- Retorna la contraseña temporal para enviar por WhatsApp
- ✅ Nueva funcionalidad: "Olvidé mi contraseña" en el login

---

## 🎯 Nuevas Funcionalidades

### 1. Editar Usuario sin Cambiar Contraseña
- Al editar un usuario, si dejas el campo de contraseña vacío, se mantiene la contraseña actual
- Solo si escribes algo, se cambiará

### 2. Recuperación de Contraseña
- En el login hay un botón "¿Olvidaste tu contraseña?"
- El usuario ingresa su username
- Se genera una contraseña temporal
- Se envía automáticamente por WhatsApp
- El usuario puede iniciar sesión y cambiarla después

---

## 🚨 Requisitos para Recuperación

Para que un usuario pueda recuperar su contraseña:
- ✅ Debe tener un número de teléfono registrado en su perfil
- ✅ El teléfono debe estar en formato internacional (+584123456789)

---

## 📱 Flujo de Recuperación

1. Usuario hace click en "¿Olvidaste tu contraseña?"
2. Ingresa su username
3. Sistema genera contraseña temporal
4. Se abre WhatsApp con mensaje pre-escrito
5. Usuario recibe la contraseña temporal
6. Inicia sesión con la temporal
7. Puede cambiarla en su perfil

---

**Fecha de actualización**: 2025-10-12
**Versión**: 1.2.0
