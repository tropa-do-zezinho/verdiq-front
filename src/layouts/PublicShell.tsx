import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import styles from './shell.module.css'

export function PublicShell() {
  const { user, logout, hasRole } = useAuth()

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand}>
            Verdiq
          </Link>
          <nav className={styles.nav}>
            <NavLink to="/produtos" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Produtos
            </NavLink>
            <NavLink to="/safra" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Safra agora
            </NavLink>
            <NavLink to="/ofertas" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Ofertas
            </NavLink>
            <NavLink to="/planos" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Planos
            </NavLink>
            {hasRole('COMERCIANTE', 'ADMIN') && (
              <NavLink to="/comerciante" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                ERP
              </NavLink>
            )}
            {hasRole('CLIENTE') && (
              <NavLink to="/conta" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Conta
              </NavLink>
            )}
            {hasRole('ADMIN') && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className={styles.actions}>
            {user ? (
              <>
                <span className={styles.user}>
                  {user.nome.split(' ')[0]} · {user.papel}
                </span>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/entrar" className="btn btn-ghost">
                  Entrar
                </Link>
                <Link to="/cadastro" className="btn btn-primary">
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className="container">
          Preço de Ceasa é referência de atacado, não preço de loja (RN-02). Fontes: seed, SIDRA/IBGE, upload admin.
        </div>
      </footer>
    </>
  )
}
