import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiActivity
} from "react-icons/fi";
import { LogOut } from "lucide-react";
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
  onMobileDrawerChange = null,
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    if (onMobileDrawerChange) {
      onMobileDrawerChange(mobileOpen);
    }
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, onMobileDrawerChange]);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

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

  const sidebarWidth = isMobile ? 300 : collapsed ? 80 : 280;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <motion.aside
        initial={false}
        animate={
          isMobile
            ? { x: mobileOpen ? 0 : -360 }
            : { x: 0, width: collapsed ? 80 : 280 }
        }
        transition={{ type: "tween", duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-y-0 left-0 z-50 flex h-screen h-dvh min-h-screen flex-col shadow-2xl border-r border-white/[0.08] ${
          isMobile ? "w-[85vw] max-w-[340px]" : ""
        }`}
        style={{ backgroundColor: "#0F2A4A" }}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
          {/* Logo & Branding Area - Clickable toggle on Desktop */}
          <button
            type="button"
            onClick={!isMobile ? toggleCollapsed : undefined}
            disabled={isMobile}
            className={`flex min-w-0 items-center gap-3.5 text-left focus:outline-none transition-opacity ${
              !isMobile ? "cursor-pointer hover:opacity-90 active:scale-[0.98]" : "cursor-default"
            }`}
            aria-label={
              !isMobile
                ? collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
                : "Portal brand"
            }
            title={!isMobile ? (collapsed ? "Expand sidebar (280px)" : "Collapse sidebar (80px)") : undefined}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] shadow-sm">
              <img src={logo} alt="GCES Emblem" className="h-7 w-7 object-contain pointer-events-none" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] font-bold uppercase tracking-[0.14em] text-blue-300/80">
                  {roleTag}
                </span>
                <span className="block truncate text-[15px] font-bold text-white tracking-tight">
                  Mess Reduction
                </span>
              </div>
            )}
          </button>

          {/* Toggle Button: Mobile Close or Desktop Chevron */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <FiX size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar (280px)" : "Collapse sidebar (80px)"}
            >
              {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
          {(!collapsed || isMobile) && navItems.length > 0 && (
            <div className="px-3.5 pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400/80">
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
                className={`relative flex w-full items-center rounded-xl px-3.5 py-3 text-left text-[14.5px] font-medium transition-all ${
                  isActive
                    ? "bg-[#1D4ED8] text-white shadow-md font-semibold"
                    : "text-[#CBD5E1] hover:bg-[#17375E] hover:text-white"
                } ${collapsed && !isMobile ? "justify-center px-0" : "gap-3.5"}`}
              >
                {/* 3.5px royal blue left accent bar for active item */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 h-6 w-[4px] -translate-y-1/2 rounded-r-full bg-white shadow-sm"
                  />
                )}

                {Icon && (
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-white" : "text-[#CBD5E1]"
                    }`}
                  >
                    <Icon size={21} />
                  </span>
                )}

                {(!collapsed || isMobile) && (
                  <span className="truncate flex-1 text-[14px] font-medium">{item.label}</span>
                )}

                {(!collapsed || isMobile) && item.badge != null && item.badge !== "" && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
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
        <div className="mt-auto shrink-0 border-t border-white/[0.08] p-3.5 pb-safe bg-black/20 flex flex-col">
          <div
            className={`flex items-center gap-3 ${
              collapsed && !isMobile ? "justify-center" : "justify-between"
            }`}
          >
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-200 border border-blue-400/30 font-bold text-sm shadow-sm">
                {initials}
              </div>

              {(!collapsed || isMobile) && (
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[13px] font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-[11.5px] text-slate-400 mt-0.5">
                    {displayRole}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Inline Logout Button with LogOut icon & label */}
            {onLogout && (!collapsed || isMobile) && (
              <button
                type="button"
                onClick={() => {
                  if (isMobile) setMobileOpen(false);
                  onLogout();
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 active:scale-95 transition-all text-[12.5px] font-semibold cursor-pointer shadow-sm"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={15} className="text-rose-400 shrink-0" />
                <span className="leading-none">Logout</span>
              </button>
            )}
          </div>

          {/* Icon-only sign out when sidebar is collapsed on desktop */}
          {collapsed && !isMobile && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 flex w-full items-center justify-center p-2.5 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div
        className="flex flex-1 flex-col min-w-0 min-h-screen min-h-[100dvh] transition-[padding] duration-200"
        style={{
          paddingLeft: isMobile ? 0 : collapsed ? 80 : 280
        }}
      >
        {/* Sticky Top Bar (70px) */}
        <header className="sticky top-0 z-30 flex h-[70px] shrink-0 items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-card)]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile hamburger or desktop collapse toggle + breadcrumb & title */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg)] transition-colors lg:hidden shrink-0"
                aria-label="Open navigation drawer"
              >
                <FiMenu size={20} />
              </button>
            )}

            <div className="min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-[var(--theme-text-faint)]">
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
              <h1 className="truncate text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Quick action, extra filters/search, notifications, live indicator, theme, profile */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Quick Action (e.g. New Request) */}
            {quickAction && <div className="hidden sm:block">{quickAction}</div>}

            {/* Custom header components if provided */}
            {headerExtras}

            {/* Active Session Indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span>Active Session</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg)] transition-colors"
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun size={19} /> : <FiMoon size={19} />}
            </button>
          </div>
        </header>

        {/* Page Workspace Body */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
