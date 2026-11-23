import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiActivity
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "../NotificationBell";
import logo from "../assets/1000088399.png";

/**
 * Enterprise Application Layout (AppLayout)
 * Adheres strictly to the Phase 2 & 3 specification:
 * - Left Sidebar (fixed, 260px expanded, 72px collapsed, slide-out drawer on <1024px)
 *   Color: #0F2A4A, Hover: #17375E, Active: #1D4ED8 with 3px left accent bar
 * - Top Bar (sticky 64px) with breadcrumbs, active session pulse, notifications, theme toggle, profile
 * - Main workspace (max-w-[1440px], padding 24px desktop / 16px mobile)
 */
export default function AppLayout({
  roleTag = "HOSTEL PORTAL",
  pageTitle = "Dashboard",
  breadcrumbs = ["GCES", "Hostel", "Dashboard"],
  navItems = [],
  activeNav,
  onNavChange,
  userInfo = null,
  onLogout,
  quickAction = null,
  headerExtras = null,
  children,
}) {
  const { isDark, toggleTheme } = useTheme();

  // Desktop sidebar collapsed state (saved in localStorage if desired)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("gces_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Mobile drawer open state (<1024px)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gces_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const handleNavClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (onNavChange) {
      onNavChange(item.key);
    }
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Derive user display info
  const displayName = userInfo?.name || userInfo?.userName || "Authorized User";
  const displayRole = userInfo?.role || userInfo?.subtext || roleTag;
  const initials =
    userInfo?.initials ||
    displayName
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase() ||
    "AU";

  const sidebarWidth = isMobile ? 270 : collapsed ? 76 : 260;

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <motion.aside
        initial={false}
        animate={
          isMobile
            ? { x: mobileOpen ? 0 : -280, width: 270 }
            : { x: 0, width: collapsed ? 76 : 260 }
        }
        transition={{ type: "tween", duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 bottom-0 left-0 z-40 flex h-screen h-[100dvh] min-h-screen flex-col shadow-xl border-r border-white/[0.08]"
        style={{ backgroundColor: "#0F2A4A" }}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] px-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] shadow-sm">
              <img src={logo} alt="GCES Emblem" className="h-6 w-6 object-contain" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300/80">
                  {roleTag}
                </span>
                <span className="block truncate text-sm font-bold text-white tracking-tight">
                  Mess Reduction
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <FiX size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar (260px)" : "Collapse sidebar (76px)"}
            >
              {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {(!collapsed || isMobile) && navItems.length > 0 && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item)}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                className={`relative flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#1D4ED8] text-white shadow-sm font-semibold"
                    : "text-[#CBD5E1] hover:bg-[#17375E] hover:text-white"
                } ${collapsed && !isMobile ? "justify-center px-0" : "gap-3"}`}
              >
                {/* 3px royal blue left accent bar for active item */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 h-5 w-[3.5px] -translate-y-1/2 rounded-r-full bg-white shadow-sm"
                  />
                )}

                {Icon && (
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-white" : "text-[#CBD5E1]"
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                )}

                {(!collapsed || isMobile) && (
                  <span className="truncate flex-1 text-[13px]">{item.label}</span>
                )}

                {(!collapsed || isMobile) && item.badge != null && item.badge !== "" && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-white/10 text-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile Block & Sign Out */}
        <div className="mt-auto shrink-0 border-t border-white/[0.08] p-3 bg-black/20 flex flex-col">
          <div
            className={`flex items-center gap-3 ${
              collapsed && !isMobile ? "justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-200 border border-blue-400/30 font-bold text-xs">
              {initials}
            </div>

            {(!collapsed || isMobile) && (
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-semibold text-white">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {displayRole}
                </p>
              </div>
            )}

            {onLogout && (!collapsed || isMobile) && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <FiLogOut size={16} />
              </button>
            )}
          </div>

          {/* Icon-only sign out when collapsed */}
          {collapsed && !isMobile && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 flex w-full items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <FiLogOut size={16} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div
        className="flex flex-1 flex-col min-w-0 min-h-screen min-h-[100dvh] transition-[padding] duration-200"
        style={{
          paddingLeft: isMobile ? 0 : collapsed ? 76 : 260
        }}
      >
        {/* Sticky Top Bar (64px) */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-card)]/90 backdrop-blur-md px-4 sm:px-6">
          {/* Left: Mobile hamburger or desktop collapse toggle + breadcrumb & title */}
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg)] transition-colors lg:hidden"
                aria-label="Open navigation drawer"
              >
                <FiMenu size={18} />
              </button>
            )}

            <div className="min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[var(--theme-text-faint)]">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="opacity-50">/</span>}
                      <span
                        className={
                          idx === breadcrumbs.length - 1
                            ? "text-[var(--theme-text-primary)] font-semibold"
                            : ""
                        }
                      >
                        {crumb}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
              <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Quick action, extra filters/search, notifications, live indicator, theme, profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Action (e.g. New Request) */}
            {quickAction && <div className="hidden sm:block">{quickAction}</div>}

            {/* Custom header components if provided */}
            {headerExtras}

            {/* Active Session Indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Active Session</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg)] transition-colors"
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
            </button>
          </div>
        </header>

        {/* Page Workspace Body */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
