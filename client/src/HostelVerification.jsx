import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"

function HostelVerification({ onNavigate }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (onNavigate) {
      onNavigate("/student-login")
    } else {
      navigate("/student-login", { replace: true })
    }
  }, [navigate, onNavigate])

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2"
          style={{ borderColor: 'var(--theme-border-strong)', borderTopColor: 'var(--theme-btn-primary)' }}
        />
        <span className="text-xs text-[var(--theme-text-secondary)]">
          Redirecting to Student Login...
        </span>
      </div>
    </div>
  )
}

export default HostelVerification
