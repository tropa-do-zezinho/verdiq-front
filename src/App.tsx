import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { PublicShell } from './layouts/PublicShell'
import { HomePage } from './pages/Home'
import { ProductsPage } from './pages/Products'
import { ProductDetailPage } from './pages/ProductDetail'
import { SeasonsPage } from './pages/Seasons'
import { OffersPage } from './pages/Offers'
import { PlansPage } from './pages/Plans'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { AccountPage } from './pages/Account'
import { AdminPage } from './pages/Admin'
import { MerchantDashboard } from './pages/merchant/MerchantDashboard'
import { MerchantRecords } from './pages/merchant/MerchantRecords'
import { MerchantOffers } from './pages/merchant/MerchantOffers'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicShell />}>
            <Route index element={<HomePage />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="produtos/:id" element={<ProductDetailPage />} />
            <Route path="safra" element={<SeasonsPage />} />
            <Route path="ofertas" element={<OffersPage />} />
            <Route path="planos" element={<PlansPage />} />
            <Route path="entrar" element={<LoginPage />} />
            <Route path="cadastro" element={<RegisterPage />} />
            <Route
              path="conta"
              element={
                <RequireAuth roles={['CLIENTE', 'COMERCIANTE', 'ADMIN']}>
                  <AccountPage />
                </RequireAuth>
              }
            />
            <Route
              path="comerciante"
              element={
                <RequireAuth roles={['COMERCIANTE', 'ADMIN']}>
                  <MerchantDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="comerciante/registros"
              element={
                <RequireAuth roles={['COMERCIANTE', 'ADMIN']}>
                  <MerchantRecords />
                </RequireAuth>
              }
            />
            <Route
              path="comerciante/ofertas"
              element={
                <RequireAuth roles={['COMERCIANTE']}>
                  <MerchantOffers />
                </RequireAuth>
              }
            />
            <Route
              path="admin"
              element={
                <RequireAuth roles={['ADMIN']}>
                  <AdminPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
