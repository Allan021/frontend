import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Dashboard from './Dashboard';
import Appointments from './Appointments';
import RegisterService from './RegisterService';
import ServicesManager from './ServicesManager';
import Settings from './Settings';
import { adminApi, API_URL } from '../../lib/api';

export const API = API_URL;

// ─── React Query Client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30, refetchOnWindowFocus: false },
  },
});

// ─── Auth Context ─────────────────────────────────────────────────────────────
interface AuthContextType {
  token: string | null;
  user: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ token: null, user: null, login: async () => { }, logout: () => { } });
export const useAuth = () => useContext(AuthContext);

// ─── Login Page ───────────────────────────────────────────────────────────────
function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try { await login(email, password); }
    catch (err: any) { setError(err.message || 'Error al iniciar sesión'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <img src="/logo.svg" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-white">THE </span>
            <span className="text-gold">RICKY</span>
          </h1>
          <p className="text-gray-500 mt-1 font-bold text-sm uppercase tracking-[0.2em]">Panel Administrativo</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-3xl p-8 space-y-5 shadow-barber-lg">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-black text-gold tracking-widest uppercase">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-dark-surface border border-dark-border rounded-2xl text-white focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all placeholder:text-gray-600"
              placeholder="admin@rickyvip.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gold tracking-widest uppercase">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-dark-surface border border-dark-border rounded-2xl text-white focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold text-black font-black text-lg rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-barber-gold uppercase tracking-widest mt-2">
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ isMobileOpen, closeMobile }: { isMobileOpen: boolean; closeMobile: () => void }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: '/panel', label: 'Dashboard', emoji: '📊', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true },
    { to: '/panel/appointments', label: 'Citas', emoji: '📅', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/panel/register', label: 'Registrar', emoji: '➕', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
    { to: '/panel/services', label: 'Servicios', emoji: '💈', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/panel/settings', label: 'Ajustes', emoji: '⚙️', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <aside className={`
      fixed md:static inset-y-0 left-0 z-50 
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 
      ${collapsed ? 'w-[72px]' : 'w-64'} 
      bg-dark-card border-r border-dark-border h-screen flex flex-col transition-all duration-300 shrink-0
    `}>
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center gap-3 h-[72px]">
        <img src="/logo.svg" alt="Logo" className="w-9 h-9 shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-black text-sm leading-tight whitespace-nowrap">
              <span className="text-white">THE </span>
              <span className="text-gold">RICKY</span>
            </div>
            <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest truncate">{user ? user.email : 'Admin Panel'}</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden md:block text-gray-600 hover:text-white transition p-1 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'} />
          </svg>
        </button>
        <button onClick={closeMobile} className="ml-auto md:hidden text-gray-600 hover:text-white transition p-1 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-1">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-bold ${isActive
                ? 'bg-gold/10 text-gold border border-gold/20 shadow-barber-neon'
                : 'text-gray-500 hover:text-white hover:bg-dark-surface'
              }`
            }>
            <span className="text-base shrink-0">{link.emoji}</span>
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer - Not pushed to the very bottom anymore */}
      <div className="p-3 space-y-1 mt-2">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-dark-surface transition text-sm font-bold w-full">
          <span className="text-base shrink-0">🌐</span>
          {!collapsed && <span>Ver Sitio</span>}
        </button>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition text-sm font-bold w-full">
          <span className="text-base shrink-0">🚪</span>
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Panel Layout ─────────────────────────────────────────────────────────────
function PanelLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-dark overflow-hidden relative">
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden absolute top-4 right-4 z-40 p-2 bg-dark-surface border border-dark-border rounded-xl text-gold" 
        onClick={() => setIsMobileOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      <Sidebar isMobileOpen={isMobileOpen} closeMobile={() => setIsMobileOpen(false)} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="md:hidden h-12" /> {/* Spacer for mobile hamburger button */}
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="register" element={<RegisterService />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PanelApp() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ricky_token');
    return null;
  });
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  async function login(email: string, password: string) {
    const res = await adminApi.post('/auth/login', { email, password });
    localStorage.setItem('ricky_token', res.data.token);
    localStorage.setItem('ricky_refresh_token', res.data.refreshToken);
    setToken(res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem('ricky_token');
    localStorage.removeItem('ricky_refresh_token');
    setToken(null);
    setUser(null);
    queryClient.clear();
  }

  useEffect(() => {
    if (!token) return;
    adminApi.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => logout());
  }, [token]);

  useEffect(() => {
    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ token, user, login, logout }}>
        <BrowserRouter>
          <Routes>
            <Route path="/panel/*" element={token ? <PanelLayout /> : <Login />} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
