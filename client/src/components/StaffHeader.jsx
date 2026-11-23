import React from 'react';
import { FiSun, FiMoon, FiLogOut } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { getCookie } from '../utils/cookieUtils';
import logo from '../assets/1000088399.png';

/**
 * Shared navy enterprise application header for staff dashboards
 * (Warden, Deputy Warden, Hostel Office).
 */
export default function StaffHeader({
  roleLabel,
  title,
  nav = [],
  active,
  onChange,
  onLogout,
  userName,
  className = '',
  children
}) {
  const { isDark, toggleTheme } = useTheme();

  const resolvedUser = React.useMemo(() => {
    if (userName) return userName;
    try {
      const raw = localStorage.getItem('staff_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.username) return parsed.username;
      }
    } catch {
      /* ignore malformed cache */
    }
    return getCookie('staffUsername') || '';
  }, [userName]);

  const initials = resolvedUser
    ? resolvedUser.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || resolvedUser.slice(0, 2).toUpperCase()
    : 'ST';

  const NavButtons = ({ compact = false }) => (
    <>
      {nav.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-[12.5px] font-semibold transition-all duration-150 ${
              compact ? 'flex-1 whitespace-nowrap px-3 py-2' : 'h-9 px-3.5'
            } ${isActive ? 'text-white bg-white/14 shadow-sm' : 'text-white/65 hover:text-white hover:bg-white/8'}`}
          >
            {Icon && <Icon size={15} className={isActive ? 'text-white' : 'text-white/70'} />}
            <span>{item.label}</span>
            {isActive && (
              <span className="sr-only">(current tab)</span>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md ${className}`}
      style={{ background: 'var(--theme-header)', borderColor: 'rgba(255,255,255,0.09)' }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-white/15 bg-white/[0.08] shadow-sm">
            <img src={logo} alt="GCES emblem" className="h-7 w-7 object-contain" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
              {roleLabel}
            </p>
            <p className="truncate text-[15px] font-bold tracking-tight text-white">{title}</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        {nav.length > 0 && (
          <nav className="hidden items-center gap-1.5 rounded-[var(--radius-lg)] border border-white/10 bg-black/20 p-1 md:flex" aria-label="Dashboard sections">
            <NavButtons />
          </nav>
        )}

        {/* Right utility actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {/* Active session pill */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
              Session active
            </span>
          </div>

          {resolvedUser && (
            <div className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-white/12 bg-white/[0.06] py-1 pl-1 pr-3 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/15 text-[10px] font-bold text-white shadow-xs">
                {initials}
              </span>
              <span className="max-w-[120px] truncate text-[12px] font-semibold text-white/90">
                {resolvedUser}
              </span>
            </div>
          )}

          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          {children}

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-white/15 bg-white/5 px-3 text-[12px] font-semibold text-white/80 transition-all hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-200"
          >
            <FiLogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      {nav.length > 0 && (
        <nav
          className="flex gap-1 overflow-x-auto border-t border-white/[0.08] bg-black/15 px-3 py-1.5 md:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Dashboard sections"
        >
          <NavButtons compact />
        </nav>
      )}
    </header>
  );
}
