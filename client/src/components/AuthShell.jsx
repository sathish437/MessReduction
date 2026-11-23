import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiArrowLeft } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import image from '../assets/1000088399.png';

/**
 * Shared chrome for the public authentication screens
 * (student, staff and administrator sign-in).
 */
export default function AuthShell({
  children,
  onNavigate,
  backTo = '/',
  backLabel = 'Portal home',
  maxWidth = '420px',
  footerNote = 'Hostel Administration · Mess Reduction Portal'
}) {
  const { isDark, toggleTheme } = useTheme();

  const goBack = () => {
    if (onNavigate) onNavigate(backTo);
    else window.location.href = backTo;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
      <header
        className="sticky top-0 z-50 w-full border-b"
        style={{ background: 'var(--theme-header)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Return to portal home"
          >
            <img src={image} alt="GCES emblem" className="h-10 w-10 shrink-0 object-contain" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
                Government College of Engineering
              </span>
              <span className="block truncate text-[15px] font-semibold tracking-tight text-white">
                Srirangam
              </span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            <button
              type="button"
              onClick={goBack}
              className="hidden items-center gap-1.5 rounded-[var(--radius-md)] border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <FiArrowLeft size={13} />
              {backLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
          style={{ maxWidth }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="px-4 pb-6">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--theme-text-faint)]">
          © {new Date().getFullYear()} GCES · {footerNote}
        </p>
      </footer>
    </div>
  );
}

/**
 * Standard heading block used at the top of every auth card.
 */
export function AuthCardHeader({ eyebrow, title, subtitle, icon }) {
  return (
    <div className="mb-6">
      {icon && (
        <div
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
        >
          {icon}
        </div>
      )}
      {eyebrow && (
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[var(--theme-text-primary)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * Inline form field with leading icon, matching the shared design system.
 */
export function FieldShell({ icon, error, focused, children, disabled }) {
  return (
    <div
      className="field-shell"
      style={{
        borderColor: error ? 'var(--color-danger-border)' : undefined,
        background: disabled ? 'var(--theme-card-muted)' : 'var(--theme-card)'
      }}
    >
      {icon && (
        <span
          className="shrink-0"
          style={{ color: error ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
        >
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}
