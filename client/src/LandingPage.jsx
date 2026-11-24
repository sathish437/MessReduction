import React from 'react';
import { useTheme } from './context/ThemeContext';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiUser, FiShield, FiArrowRight, FiLock, FiInfo } from 'react-icons/fi';
import image from './assets/1000088399.png';

function LandingPage({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();

  const navigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
      <header
        className="sticky top-0 z-50 w-full border-b"
        style={{ background: 'var(--theme-header)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={image} alt="GCES emblem" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
                Government College of Engineering
              </p>
              <p className="truncate text-[15px] font-semibold tracking-tight text-white">
                Srirangam
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-1 text-[11px] font-medium text-[var(--theme-text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-success)' }} />
            Hostel Administration · Mess Billing
          </span>

          <h1 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--theme-text-primary)] sm:text-[36px]">
            Mess Reduction Portal
          </h1>
          <p className="mx-auto mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-[var(--theme-text-secondary)] sm:text-sm">
            Submit and track mess reduction requests for the hostel mess at Government College of
            Engineering, Srirangam.
          </p>
        </motion.div>

        <div className="mt-9 grid w-full max-w-4xl grid-cols-1 gap-4 sm:mt-11 sm:grid-cols-2 sm:gap-5">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="panel flex flex-col p-6 sm:p-7"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
            >
              <FiUser size={20} />
            </div>

            <h2 className="mt-4 text-[17px] font-semibold tracking-tight text-[var(--theme-text-primary)]">
              Student access
            </h2>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
              Log in directly using your official Hostel App credentials (Register Number and Password) to submit mess reduction requests and monitor their status.
            </p>

            <div
              className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] p-2.5 text-xs text-[var(--theme-text-secondary)]"
              style={{ background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' }}
            >
              <FiInfo className="shrink-0 text-[var(--color-accent)]" size={14} />
              <span>Use your official GCES Hostel App account credentials to sign in.</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student-login')}
              className="btn btn-primary mt-5 w-full"
            >
              Continue as student
              <FiArrowRight size={15} />
            </button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="panel flex flex-col p-6 sm:p-7"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]"
              style={{ background: 'var(--theme-bg-soft)', color: 'var(--theme-text-secondary)' }}
            >
              <FiShield size={20} />
            </div>

            <h2 className="mt-4 text-[17px] font-semibold tracking-tight text-[var(--theme-text-primary)]">
              Staff access
            </h2>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
              For wardens, deputy wardens and hostel office staff. Review, approve or reject student
              requests from your assigned dashboard.
            </p>

            <button
              type="button"
              onClick={() => navigate('/staff-login')}
              className="btn btn-secondary mt-6 w-full"
            >
              Staff sign in
              <FiArrowRight size={15} />
            </button>

            <p className="mt-3 text-center text-xs text-[var(--theme-text-secondary)]">
              Access is restricted to authorised personnel.
            </p>
          </motion.section>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin-login')}
          className="mt-7 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-text-faint)] transition-colors hover:text-[var(--theme-text-secondary)]"
        >
          <FiLock size={12} />
          Administrator sign in
        </button>
      </main>

      <footer className="border-t border-[var(--theme-border)] px-4 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] font-medium text-[var(--theme-text-secondary)]">
            © {new Date().getFullYear()} Government College of Engineering, Srirangam
          </p>
          <p className="text-[11px] text-[var(--theme-text-faint)]">
            Mess Reduction Portal · Hostel Administration
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
