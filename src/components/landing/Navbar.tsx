import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { X, LogIn, Eye, EyeOff, LayoutDashboard, Scissors } from 'lucide-react';
import { fetchPublicSettings, queryKeys, adminApi } from '../../lib/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1, refetchOnWindowFocus: false } },
});

// ─── Login Modal ────────────────────────────────────────────────────────────── 
function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.post('/auth/login', { email, password });
      localStorage.setItem('ricky_token', res.data.token);
      // Redirect to admin panel
      window.location.href = '/panel';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Glow */}
        <div className="absolute -inset-4 bg-gold/10 rounded-3xl blur-3xl pointer-events-none" />

        <div className="relative bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-barber-lg">
          {/* Top gold line */}
          <div className="h-1 w-full bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                  <span className="font-black text-white">THE <span className="text-gold">RICKY</span></span>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Acceso Administrativo</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-dark-surface transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gold tracking-widest uppercase">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-dark-surface border border-dark-border rounded-2xl text-white text-sm focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all placeholder:text-gray-700"
                  placeholder="admin@rickyvip.com" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gold tracking-widest uppercase">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-surface border border-dark-border rounded-2xl text-white text-sm focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all pr-12"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold text-black font-black text-sm rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest shadow-barber-gold flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /><span>INGRESANDO...</span></>
                ) : (
                  <><LayoutDashboard className="w-4 h-4" /><span>ACCEDER AL PANEL</span></>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Navbar Core ──────────────────────────────────────────────────────────────
function NavbarCore() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const { data: settings } = useQuery({
    queryKey: queryKeys.publicSettings,
    queryFn: fetchPublicSettings,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      // Track active section
      const sections = ['home', 'horarios', 'servicios', 'booking'];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Inicio', id: 'home' },
    { href: '#horarios', label: 'Horarios', id: 'horarios' },
    { href: '#servicios', label: 'Servicios', id: 'servicios' },
    { href: '#booking', label: 'Reservar', id: 'booking' },
  ];

  return (
    <>
      {/* ── Barber Pole top line ── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[100] bg-gradient-to-r from-barber-red via-white via-50% to-barber-blue" />

      {/* ── Main Navbar ── */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 25 }}
        className={`fixed top-[3px] left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? 'bg-[#070707]/90 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-b from-black/60 to-transparent backdrop-blur-md border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/#home" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <img src="/logo.svg" alt="Logo" className="w-10 h-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 drop-shadow-lg" />
            </div>
            <div>
              <div className="font-black text-[15px] leading-none tracking-tight drop-shadow-md">
                <span className="text-white">THE </span>
                <span className="text-gold">RICKY</span>
              </div>
              <span className="text-[9px] text-gold/50 tracking-[0.3em] font-bold uppercase hidden sm:block">Estudio VIP</span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <a key={link.id} href={link.href}
                className={`relative px-4 py-2 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeSection === link.id
                    ? 'text-gold'
                    : 'text-white/80 hover:text-white hover:bg-white/8'
                }`}>
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-gold rounded-full"
                  />
                )}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            {settings && (
              <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                settings.is_open
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/15 border-red-500/30 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${settings.is_open ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {settings.is_open ? 'Abierto' : 'Cerrado'}
              </div>
            )}

            {/* Admin button */}
            <button onClick={() => setLoginOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all text-[11px] font-black uppercase tracking-wider border border-transparent hover:border-white/10">
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Admin</span>
            </button>

            {/* CTA */}
            <a href="#booking" className="btn-gold-shimmer px-4 sm:px-5 py-2.5 text-[11px] rounded-xl font-black uppercase tracking-widest flex items-center gap-1.5 shadow-barber-gold">
              <Scissors className="w-3.5 h-3.5" />
              <span>Reservar</span>
            </a>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-[5px] p-2.5 rounded-xl hover:bg-white/8 transition-all">
              <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 8 : 0 }} className="w-6 h-0.5 bg-white block transition-all origin-center" />
              <motion.span animate={{ opacity: mobileOpen ? 0 : 1 }} className="w-6 h-0.5 bg-white block" />
              <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -8 : 0 }} className="w-6 h-0.5 bg-white block transition-all origin-center" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden border-t border-dark-border/30 bg-dark/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(link => (
                  <a key={link.id} href={link.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                      activeSection === link.id
                        ? 'bg-gold/10 text-gold border border-gold/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    {link.label}
                    {activeSection === link.id && <span className="ml-auto w-2 h-2 bg-gold rounded-full animate-pulse" />}
                  </a>
                ))}

                {/* Mobile status + admin */}
                <div className="pt-3 mt-3 border-t border-dark-border/30 flex flex-col gap-2">
                  {settings && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border ${
                      settings.is_open
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${settings.is_open ? 'bg-emerald-400' : 'bg-red-500'}`} />
                      <span>{settings.is_open ? 'Estamos ABIERTOS ✓' : 'Estamos CERRADOS ✗'}</span>
                    </div>
                  )}
                  <button onClick={() => { setMobileOpen(false); setLoginOpen(true); }}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-black text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                    <LogIn className="w-4 h-4" />
                    <span>Acceso Admin</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Login Modal ── */}
      <AnimatePresence>
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Root with QueryClient ─────────────────────────────────────────────────────
export default function Navbar() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavbarCore />
    </QueryClientProvider>
  );
}
