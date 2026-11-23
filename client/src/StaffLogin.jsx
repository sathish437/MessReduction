import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiArrowRight, FiShield, FiAlertCircle } from "react-icons/fi"
import apiClient from "./api/apiClient"
import { setStaffAuth, getStaffDashboardRoute } from "./services/authService"
import PasswordInput from "./PasswordInput"
import CustomSelect from "./CustomSelect"
import AuthShell, { AuthCardHeader } from "./components/AuthShell"

function StaffLogin({ onNavigate }) {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!role) {
      setError("Please select a staff role");
      setLoading(false);
      return;
    }

    try {
      let sanitizedUserName = userName.trim();
      if (role === 'Warden' && sanitizedUserName.toLowerCase() === 'warden') {
        sanitizedUserName = 'warden';
      } else if (role === 'Office' && sanitizedUserName.toLowerCase() === 'office') {
        sanitizedUserName = 'office';
      } else if (role === 'DeputyWarden') {
        const deputyMatch = sanitizedUserName.match(/^deputywarden([1-8])$/i);
        if (deputyMatch) {
          sanitizedUserName = `deputyWarden${deputyMatch[1]}`;
        }
      }

      const requestBody = {
        userName: sanitizedUserName,
        password: password,
        role: role
      };

      const response = await apiClient.post('/api/staff/login', requestBody);
      const data = response.data;

      if (data.token) {
        setStaffAuth(data.token, data.username, data.role);
        const redirectRoute = getStaffDashboardRoute(data.role, data.username);

        if (redirectRoute && onNavigate) {
          onNavigate(redirectRoute);
        } else {
          setError(`Unknown role/username combination. Please contact administrator.`);
          setLoading(false);
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell onNavigate={onNavigate} backTo="/" backLabel="Portal home" maxWidth="410px" footerNote="Staff Portal · Authorised Access">
      <div className="panel p-6 sm:p-7">
        <AuthCardHeader
          eyebrow="Staff Portal"
          title="Staff sign in"
          subtitle="Wardens, deputy wardens and hostel office staff only."
          icon={<FiShield size={18} />}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CustomSelect
            label="Staff Role"
            icon={<FiShield size={15} />}
            name="role"
            id="staff-role-select"
            value={role}
            onChange={(e) => { setRole(e.target.value); setUserName(""); }}
            required
            placeholder="Select staff role"
            options={[
              { value: "Warden", label: "Warden" },
              { value: "DeputyWarden", label: "Deputy Warden" },
              { value: "Office", label: "Hostel Office" }
            ]}
            error={error && !role ? error : null}
          />

          <div className="flex w-full flex-col gap-1.5 text-left">
            <label htmlFor="username-input" className="field-label">
              Username
            </label>
            <div
              className="field-shell"
              style={{
                borderColor: error && !userName ? 'var(--color-danger-border)' : undefined,
                background: !role ? 'var(--theme-card-muted)' : 'var(--theme-card)'
              }}
            >
              <span
                className="shrink-0"
                style={{ color: error && !userName ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
              >
                <FiUser size={16} />
              </span>
              <input
                id="username-input"
                type="text"
                placeholder={
                  !role
                    ? "Select a role first"
                    : role === "Warden"
                      ? "e.g. warden"
                      : role === "Office"
                        ? "e.g. office"
                        : "e.g. deputyWarden1"
                }
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="username"
                required
                disabled={!role}
                className="w-full flex-1 bg-transparent font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 text-left">
            <label htmlFor="staff-password" className="field-label">
              Password
            </label>
            <PasswordInput
              id="staff-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={!!error}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-xs font-medium"
              style={{
                background: 'var(--color-danger-soft)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger)'
              }}
            >
              <FiAlertCircle className="mt-[1px] shrink-0" size={14} />
              <span>{error}</span>
            </div>
          )}

          <motion.button
            whileTap={loading ? {} : { scale: 0.995 }}
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-1 w-full"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <FiArrowRight size={15} />
              </>
            )}
          </motion.button>
        </form>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--theme-text-faint)]">
        Staff accounts are issued by the hostel administration. Contact the administrator if you
        cannot access your account.
      </p>
    </AuthShell>
  )
}

export default StaffLogin
