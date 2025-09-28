# AccesoGym Coach

Sistema de gestión de membresías para entrenadores personales - Progressive Web App (PWA)

## 🎯 Características

- **PWA Completa**: Instalable en dispositivos móviles
- **Diseño Lujoso**: Interfaz moderna con efectos 3D y glassmorphism
- **Gestión de Clientes**: Registro completo con cédula venezolana/extranjera
- **Control de Membresías**: Seguimiento automático de fechas de vencimiento
- **Notificaciones WhatsApp**: Enlace directo para notificar clientes vencidos
- **Sistema de Licencias**: Control de acceso con claves de licencia
- **100% Responsive**: Optimizado para dispositivos móviles

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Framer Motion
- **Backend**: Supabase (BaaS)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (nivel gratuito)
- **PWA**: Vite PWA Plugin

## 🎨 Diseño

### Paleta de Colores
- **Fondo Principal**: `#0B1426` (Azul oscuro profundo)
- **Fondo Secundario**: `#1A2332` (Azul oscuro medio)
- **Fondo Tarjetas**: `#243447` (Azul oscuro para tarjetas)
- **Acento Principal**: `#00D4FF` (Cian eléctrico)
- **Acento Secundario**: `#0EA5E9` (Azul claro)

### Efectos Visuales
- Glassmorphism con `backdrop-blur`
- Sombras multicapa para profundidad 3D
- Animaciones fluidas con Framer Motion
- Transiciones suaves de 200-300ms

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone [repository-url]
cd AccesoGymCoach
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Configuración de Base de Datos

### Tabla `clients`
```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('V', 'E')) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expiring', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trainer_id UUID REFERENCES auth.users(id) NOT NULL,

  UNIQUE(cedula, document_type, trainer_id)
);
```

### Tabla `licenses`
```sql
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired')) DEFAULT 'active',
  trainer_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(trainer_id)
);
```

### Políticas RLS (Row Level Security)
```sql
-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can insert own license" ON licenses
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Users can update own license" ON licenses
  FOR UPDATE USING (auth.uid() = trainer_id);
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar con GitHub**
   - Importar proyecto desde GitHub en Vercel
   - Configurar variables de entorno en Vercel

2. **Variables de entorno en Vercel**
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

3. **Deploy automático**
   - Cada push a `main` despliega automáticamente

## 📱 Funcionalidades

### Gestión de Clientes
- Registro con cédula (V/E) y validación
- Campos: Nombre completo, teléfono, fecha inicio, duración
- Cálculo automático de fecha de fin
- Estados: Activo, Por Vencer (3 días), Vencido

### Dashboard
- Estadísticas en tiempo real
- Filtros por estado
- Búsqueda por nombre, cédula o teléfono
- Tarjetas con información detallada

### Notificaciones WhatsApp
- Botón directo en clientes vencidos/por vencer
- Mensaje predefinido profesional
- Apertura nativa de WhatsApp

### Sistema de Licencias
- Control de acceso por clave de licencia
- Validación de fechas de expiración
- Gestión desde configuración

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construcción para producción
npm run preview      # Vista previa de producción
npm run lint         # Linter ESLint
```

## 📄 Licencia

Desarrollado por **TecnoAcceso** - Todos los derechos reservados.

## 🆘 Soporte

Para soporte técnico o consultas sobre licencias, contactar a TecnoAcceso.