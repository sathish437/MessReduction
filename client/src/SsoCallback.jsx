import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiHash, FiPhone } from "react-icons/fi";
import apiClient from "./api/apiClient";
import { exchangeStudentSsoCode } from "./services/authService";
import AuthShell, { AuthCardHeader } from "./components/AuthShell";

function SsoCallback({ onNavigate }) {
  const [searchParams] = useSearchParams();
  const hasExchangedRef = useRef(false);

  const [status, setStatus] = useState("loading"); // loading | onboarding | error
  const [error, setError] = useState("");

  // First-time onboarding modal state (if backend returns onboardingRequired: true)
  const [modalRollNo, setModalRollNo] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const goTo = useCallback(
    (path) => {
      if (onNavigate) {
        onNavigate(path);
      } else {
        window.location.replace(path);
      }
    },
    [onNavigate]
  );

  useEffect(() => {
    if (hasExchangedRef.current) return;
    hasExchangedRef.current = true;

    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setError("Missing SSO authorization code. Please sign in again.");
      return;
    }

    const runExchange = async () => {
      try {
        const data = await exchangeStudentSsoCode(code);
        if (data.onboardingRequired) {
          setStatus("onboarding");
        } else {
          goTo("/student-dashboard");
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "SSO sign-in failed or expired. Please sign in manually.";
        setStatus("error");
        setError(msg);
      }
    };

    runExchange();
  }, [searchParams, goTo]);

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setModalError("");

    const cleanRollNo = modalRollNo.trim().toUpperCase();
    if (!/^[A-Za-z0-9._-]{1,20}$/.test(cleanRollNo)) {
      setModalError("Please enter a valid Roll Number (1–20 alphanumeric characters).");
      return;
    }

    const cleanPhone = modalPhone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setModalError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setModalLoading(true);
    try {
      await apiClient.post("/api/student/complete-profile", {
        rollNo: cleanRollNo,
        phoneNo: cleanPhone,
      });
      goTo("/student-dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to complete profile setup. Please try again.";
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <AuthShell
      onNavigate={onNavigate}
      backTo="/student-login"
      backLabel="Student Sign In"
      maxWidth="430px"
      footerNote="Hostel SSO"
    >
      <div className="panel p-6 sm:p-7">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="mb-4 h-8 w-8 animate-spin rounded-full border-2"
              style={{
                borderColor: "var(--theme-border-strong)",
                borderTopColor: "var(--color-accent)",
              }}
            />
            <h2 className="text-base font-semibold text-[var(--theme-text-primary)]">
              Signing you in…
            </h2>
            <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
              Verifying your GCES Hostel session and loading your dashboard.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-4">
            <AuthCardHeader
              eyebrow="Hostel SSO"
              title="Sign-in could not be completed"
              subtitle="Your single sign-on session was invalid or has expired."
              icon={<FiAlertCircle size={18} />}
            />
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-xs font-medium"
              style={{
                background: "var(--color-danger-soft)",
                border: "1px solid var(--color-danger-border)",
                color: "var(--color-danger)",
              }}
            >
              <FiAlertCircle className="mt-[1px] shrink-0" size={14} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => goTo("/student-login")}
              className="btn btn-primary w-full"
            >
              Go to Student Sign In
              <FiArrowRight size={15} />
            </button>
          </div>
        )}

        {status === "onboarding" && (
          <div>
            <div className="mb-5">
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]"
                style={{
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent)",
                }}
              >
                <FiCheckCircle size={20} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--theme-text-primary)]">
                Complete First-Time Setup
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                Welcome to the Mess Reduction Portal! Please provide your Roll Number and 10-digit
                Phone Number to complete your profile before proceeding to your dashboard.
              </p>
            </div>

            <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">

              <div className="flex w-full flex-col gap-1.5 text-left">
                <label htmlFor="sso-rollno-input" className="field-label">
                  Roll Number
                </label>
                <div
                  className="field-shell"
                  style={
                    modalError && !/^[A-Za-z0-9._-]{1,20}$/.test(modalRollNo.trim())
                      ? { borderColor: "var(--color-danger-border)" }
                      : undefined
                  }
                >
                  <span
                    className="shrink-0"
                    style={{
                      color: modalError
                        ? "var(--color-danger)"
                        : "var(--theme-text-faint)",
                    }}
                  >
                    <FiHash size={16} />
                  </span>
                  <input
                    id="sso-rollno-input"
                    type="text"
                    maxLength={20}
                    placeholder="e.g. 23CS032"
                    value={modalRollNo}
                    onChange={(e) => setModalRollNo(e.target.value.toUpperCase())}
                    required
                    className="w-full flex-1 bg-transparent font-medium tracking-wide focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex w-full flex-col gap-1.5 text-left">
                <label htmlFor="sso-phone-input" className="field-label">
                  Mobile Phone Number (10 digits)
                </label>
                <div
                  className="field-shell"
                  style={
                    modalError && !/^\d{10}$/.test(modalPhone.trim())
                      ? { borderColor: "var(--color-danger-border)" }
                      : undefined
                  }
                >
                  <span
                    className="shrink-0"
                    style={{
                      color: modalError
                        ? "var(--color-danger)"
                        : "var(--theme-text-faint)",
                    }}
                  >
                    <FiPhone size={16} />
                  </span>
                  <input
                    id="sso-phone-input"
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={modalPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setModalPhone(val);
                    }}
                    required
                    className="w-full flex-1 bg-transparent font-medium tracking-wide focus:outline-none"
                  />
                </div>
              </div>

              {modalError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                  style={{
                    background: "var(--color-danger-soft)",
                    border: "1px solid var(--color-danger-border)",
                    color: "var(--color-danger)",
                  }}
                >
                  <FiAlertCircle className="mt-[1px] shrink-0" size={14} />
                  <span>{modalError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={modalLoading}
                className="btn btn-primary mt-2 w-full"
              >
                {modalLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving Profile…
                  </>
                ) : (
                  <>
                    Complete Setup & Continue
                    <FiArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default SsoCallback;
