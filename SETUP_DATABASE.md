# 🗄️ Configuración de Base de Datos - AccesoGym Coach

## 📋 Pasos para configurar Supabase

### 1. 🚀 Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Regístrate con GitHub o email
4. Crea un nuevo proyecto:
   - **Nombre**: `accesogym-coach`
   - **Región**: Selecciona la más cercana (ej: South America)
   - **Database Password**: Genera una contraseña segura y **guárdala**

### 2. 🔧 Configurar variables de entorno

1. En tu proyecto de Supabase, ve a **Settings > API**
2. Copia la información:
   - **Project URL**
   - **anon/public key**

3. Crea el archivo `.env` en la raíz del proyecto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 3. 📊 Ejecutar scripts SQL

1. Ve a **SQL Editor** en Supabase
2. Ejecuta este script para crear las tablas:

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de usuarios personalizados (para login con username)
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'trainer' CHECK (role IN ('trainer', 'admin', 'superuser')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT username_length CHECK (LENGTH(username) >= 3)
);

-- Crear tabla de clientes
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cedula TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('V', 'E')) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0 AND duration_months <= 12),
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expiring', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trainer_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Constraints
  UNIQUE(cedula, document_type, trainer_id),
  CHECK (LENGTH(cedula) >= 7 AND LENGTH(cedula) <= 8),
  CHECK (LENGTH(phone) >= 10)
);

-- Crear tabla de licencias
CREATE TABLE licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  expiry_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired')) DEFAULT 'active',
  trainer_id UUID REFERENCES auth.users(id) NOT NULL,
  client_name TEXT,
  client_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(trainer_id)
);

-- Habilitar Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Políticas para clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = trainer_id);

-- Políticas para licenses
CREATE POLICY "Users can view own license" ON licenses
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "SuperUsers can view all licenses" ON licenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.email IN ('admin@tecnoacceso.com', 'superuser@tecnoacceso.com')
    )
  );

CREATE POLICY "SuperUsers can insert licenses" ON licenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.email IN ('admin@tecnoacceso.com', 'superuser@tecnoacceso.com')
    )
  );

CREATE POLICY "SuperUsers can update licenses" ON licenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.email IN ('admin@tecnoacceso.com', 'superuser@tecnoacceso.com')
    )
  );

-- Crear índices para mejor rendimiento
CREATE INDEX idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_end_date ON clients(end_date);
CREATE INDEX idx_clients_cedula ON clients(cedula, document_type);
CREATE INDEX idx_licenses_trainer_id ON licenses(trainer_id);
CREATE INDEX idx_licenses_status ON licenses(status);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para clients
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar estado de cliente automáticamente
CREATE OR REPLACE FUNCTION update_client_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular estado basado en end_date
    IF NEW.end_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSIF NEW.end_date <= CURRENT_DATE + INTERVAL '3 days' THEN
        NEW.status = 'expiring';
    ELSE
        NEW.status = 'active';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para auto-actualizar estado de cliente
CREATE TRIGGER auto_update_client_status
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_status();

-- Función para actualizar estado de licencia automáticamente
CREATE OR REPLACE FUNCTION update_license_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular estado basado en expiry_date
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSE
        NEW.status = 'active';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para auto-actualizar estado de licencia
CREATE TRIGGER auto_update_license_status
    BEFORE INSERT OR UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_status();

-- Función para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Función para crear usuarios desde la aplicación
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_username TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'trainer'
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role
  ) VALUES (
    gen_random_uuid(),
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated'
  ) RETURNING id INTO new_user_id;

  -- Crear perfil personalizado
  INSERT INTO user_profiles (
    auth_user_id,
    username,
    full_name,
    role
  ) VALUES (
    new_user_id,
    user_username,
    user_full_name,
    user_role
  );

  RETURN json_build_object('user_id', new_user_id, 'success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'success', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. 👤 Configurar usuarios

1. Ve a **Authentication > Users**
2. Crea usuarios de prueba:
   - **Email**: `admin@tecnoacceso.com` (Superusuario)
     - **Username**: `admin`
     - **Full Name**: `Administrador`
   - **Email**: `trainer1@gym.com` (Entrenador normal)
     - **Username**: `trainer1`
     - **Full Name**: `Entrenador 1`

3. **IMPORTANTE**: Al crear usuarios manualmente en Supabase, debes:
   - Ir a **SQL Editor** y ejecutar estos comandos para cada usuario:

```sql
-- Para el administrador
INSERT INTO user_profiles (auth_user_id, username, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@tecnoacceso.com'),
  'admin',
  'Administrador',
  'superuser'
);

-- Para el entrenador
INSERT INTO user_profiles (auth_user_id, username, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'trainer1@gym.com'),
  'trainer1',
  'Entrenador 1',
  'trainer'
);
```

### 5. 🔄 Cambiar a la versión real

1. Reemplaza las importaciones en tu app:

```typescript
// ANTES (demo):
import { useAuth } from '@/contexts/AuthContext.demo'
import { useClients } from '@/hooks/useClients.demo'
import { useLicense } from '@/hooks/useLicense.demo'

// DESPUÉS (real):
import { useAuth } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { useLicense } from '@/hooks/useLicense'
```

2. **IMPORTANTE - Archivos que debes actualizar**:
   - `src/pages/Login.tsx` ✅ (ya actualizado)
   - `src/pages/Dashboard.tsx`
   - `src/pages/Settings.tsx`
   - `src/pages/LicenseManagement.tsx`
   - `src/components/ClientCard.tsx`
   - `src/components/RenewModal.tsx`

### 6. ✅ Verificar conexión

1. Reinicia el servidor: `npm run dev`
2. Haz login con un usuario creado usando **username** (no email):
   - Usuario: `admin` / Contraseña: [la que asignaste]
   - Usuario: `trainer1` / Contraseña: [la que asignaste]
3. Prueba crear un cliente
4. Verifica que aparezca en la base de datos

### 7. 🔐 Autenticación con Username

El sistema ahora usa **username** para login en lugar de email:

- **Login**: Los usuarios ingresan su `username` y `password`
- **Interno**: El sistema busca el email asociado y hace login con Supabase
- **Perfil**: Se cargan automáticamente datos como `full_name`, `role`, etc.

**Flujo de autenticación**:
1. Usuario ingresa `username` y `password`
2. Sistema busca `auth_user_id` en `user_profiles` donde `username` = input
3. Sistema obtiene `email` de `auth.users` usando el `auth_user_id`
4. Sistema hace login con Supabase usando `email` y `password`
5. Sistema carga perfil completo del usuario

## 🛡️ Funcionalidades de seguridad incluidas:

- **RLS (Row Level Security)**: Cada usuario solo ve sus datos
- **Políticas de SuperUsuario**: Solo emails específicos pueden gestionar licencias
- **Validaciones**: Constraints en base de datos
- **Triggers automáticos**: Actualización de estados
- **Índices**: Para mejor rendimiento

## 🚨 Importante:

- **Guarda la contraseña** de la base de datos
- **No subas el archivo .env** a GitHub
- **Cambia los emails** de superusuario por los reales
- **Haz backup** antes de cambios importantes

## 📞 Soporte:

Si tienes problemas, contacta a TecnoAcceso con:
- **URL del proyecto Supabase**
- **Descripción del error**
- **Screenshots** si es necesario