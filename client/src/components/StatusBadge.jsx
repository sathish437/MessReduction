import React from "react";

/**
 * Reusable StatusBadge adhering strictly to the Phase 2 ERP design tokens.
 * Badge = soft background + dark accessible text + small dot + clear label.
 */
export default function StatusBadge({ status, label, className = "", size = "normal" }) {
  const raw = (status || label || "").toString().trim();
  const normalized = raw.toLowerCase();

  // Status mapping using CSS design tokens for dynamic theme adaptation
  let bg = "var(--color-neutral-soft)";
  let text = "var(--color-neutral)";
  let dot = "var(--theme-text-faint)";
  let border = "var(--color-neutral-border)";
  let displayLabel = label || raw || "Unknown";

  if (
    normalized.includes("approved") ||
    normalized === "active" ||
    normalized === "completed" ||
    normalized === "verified" ||
    normalized === "refunded"
  ) {
    bg = "var(--color-success-soft)";
    text = "var(--color-success)";
    dot = "var(--color-success-dot, var(--color-success))";
    border = "var(--color-success-border)";
  } else if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("submitted") ||
    normalized.includes("waiting")
  ) {
    bg = "var(--color-warning-soft)";
    text = "var(--color-warning)";
    dot = "var(--color-warning-dot, var(--color-warning))";
    border = "var(--color-warning-border)";
  } else if (
    normalized.includes("reject") ||
    normalized.includes("denied") ||
    normalized.includes("inactive") ||
    normalized.includes("failed") ||
    normalized.includes("cancelled")
  ) {
    bg = "var(--color-danger-soft)";
    text = "var(--color-danger)";
    dot = "var(--color-danger-dot, var(--color-danger))";
    border = "var(--color-danger-border)";
  } else if (
    normalized.includes("forward") ||
    normalized.includes("office") ||
    normalized.includes("warden") ||
    normalized.includes("info") ||
    normalized.includes("in progress")
  ) {
    bg = "var(--color-info-soft)";
    text = "var(--color-info)";
    dot = "var(--color-info-dot, var(--color-info))";
    border = "var(--color-info-border)";
  } else if (normalized.includes("not refunded") || normalized.includes("unpaid")) {
    bg = "var(--color-warning-soft)";
    text = "var(--color-warning)";
    dot = "var(--color-warning-dot, var(--color-warning))";
    border = "var(--color-warning-border)";
  }

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors whitespace-nowrap ${
        isSmall ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      } ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dot }}
        aria-hidden="true"
      />
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
}
