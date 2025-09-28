import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useLicense } from '@/hooks/useLicense'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ClientForm from '@/pages/ClientForm'
import Settings from '@/pages/Settings'
import LicenseManagement from '@/pages/LicenseManagement'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import LicenseExpired from '@/components/LicenseExpired'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { license, loading: licenseLoading } = useLicense()

  if (authLoading || licenseLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Superusuarios pueden acceder sin licencia
  if (user.role === 'superuser') {
    return <>{children}</>
  }

  // Usuarios regulares necesitan licencia activa
  if (!license) {
    return <LicenseExpired />
  }

  // Verificar que la licencia no esté vencida
  const today = new Date()
  const expiryDate = new Date(license.expiry_date)

  if (expiryDate < today || license.status === 'expired') {
    return <LicenseExpired />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/license-expired"
        element={<LicenseExpired />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/edit/:id" element={<ClientForm />} />
        <Route path="settings" element={<Settings />} />
        <Route path="license-management" element={<LicenseManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App