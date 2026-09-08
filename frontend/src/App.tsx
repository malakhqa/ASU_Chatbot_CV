import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { AuthProvider } from '@/context/AuthProvider'
import AnalyzeCV from '@/pages/AnalyzeCV'
import CreateCV from '@/pages/CreateCV'
import Dashboard from '@/pages/Dashboard'
import EditCV from '@/pages/EditCV'
import Login from '@/pages/Login'
import MyCVs from '@/pages/MyCVs'
import NotFound from '@/pages/NotFound'
import Profile from '@/pages/Profile'
import Register from '@/pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="cvs" element={<MyCVs />} />
              <Route path="cvs/new" element={<CreateCV />} />
              <Route path="cvs/:id" element={<EditCV />} />
              <Route path="cvs/:id/analyze" element={<AnalyzeCV />} />
            </Route>
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
