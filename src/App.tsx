import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useLicense } from '@/hooks/useLicense'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ClientForm from '@/pages/ClientForm'
import Settings from '@/pages/Settings'
import LicenseManagement from '@/pages/LicenseManagement'
import Routines from '@/pages/Routines'
import NutritionPlanTemplates from '@/pages/NutritionPlanTemplates'
import NewNutritionPlan from '@/pages/NewNutritionPlan'
import ViewNutritionPlan from '@/pages/ViewNutritionPlan'
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
  usePushNotifications()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/license-expired" element={<LicenseExpired />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/edit/:id" element={<ClientForm />} />
        <Route path="routines" element={<Routines />} />
        <Route path="nutrition-plans" element={<NutritionPlanTemplates />} />
        <Route path="nutrition-plans/new" element={<NewNutritionPlan />} />
        <Route path="nutrition-plans/:planId" element={<ViewNutritionPlan />} />
        <Route path="nutrition-plans/:planId/edit" element={<NewNutritionPlan />} />
        <Route path="settings" element={<Settings />} />
        <Route path="license-management" element={<LicenseManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
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