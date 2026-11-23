import React, { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import apiClient from '../api/apiClient';
import { getActiveDepartments } from '../api/departmentService';
import MultiSelect from '../MultiSelect';

/**
 * Auto accept / auto forward settings card shared by the
 * Warden and Deputy Warden dashboards.
 */
export default function AutoAcceptSettingsCard() {
    const [enabled, setEnabled] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedDepts, setSelectedDepts] = useState([]);
    const [selectedYears, setSelectedYears] = useState([]);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [activeDepts, setActiveDepts] = useState([]);

    useEffect(() => {
        getActiveDepartments().then(depts => {
            if (Array.isArray(depts)) setActiveDepts(depts);
        });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get("/api/hostelStaff/staff/auto-accept", { signal: controller.signal });
                if (res.data) {
                    setEnabled(res.data.enabled);
                    setFromDate(res.data.fromDate || "");
                    setToDate(res.data.toDate || "");

                    const d = res.data.department || "ALL";
                    setSelectedDepts(!d || d === "ALL" ? [] : d.split(",").map(s => s.trim()));

                    const y = res.data.year || "ALL";
                    setSelectedYears(!y || y === "ALL" ? [] : y.split(",").map(s => s.trim()));

                    setReason(res.data.reason || "");
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                setError("Failed to load auto-accept settings");
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchSettings();
        return () => {
            controller.abort();
        };
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);

        if (!fromDate || !toDate) {
            setError("Both from and to dates are required.");
            setSaving(false);
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            setError("From date cannot be after to date.");
            setSaving(false);
            return;
        }

        const deptStr = !selectedDepts || selectedDepts.length === 0 ? "ALL" : selectedDepts.join(",");
        const yearStr = !selectedYears || selectedYears.length === 0 ? "ALL" : selectedYears.join(",");

        try {
            await apiClient.post("/api/hostelStaff/staff/auto-accept", {
                enabled,
                fromDate,
                toDate,
                department: deptStr,
                year: yearStr,
                reason
            });
            setMessage("Settings saved successfully.");
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const getStatusInfo = () => {
        if (!enabled) return { label: "Disabled", color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20" };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(0, 0, 0, 0);

        if (!from || !to) return { label: "Incomplete Date Range", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" };

        if (today >= from && today <= to) {
            const diffTime = to.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const expiryText = diffDays === 0 ? "Expires today" : `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
            return { label: "Active Now", sub: expiryText, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" };
        } else if (today > to) {
            return { label: "Expired", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" };
        } else {
            return { label: "Scheduled", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" };
        }
    };

    const statusInfo = getStatusInfo();
    const isSaveDisabled = !fromDate || !toDate || new Date(fromDate) > new Date(toDate);

    const deptOptions = activeDepts.length > 0
        ? activeDepts.map(d => ({ value: d.departmentCode, label: d.departmentCode }))
        : ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => ({ value: code, label: code }));

    const yearOptions = [
        { value: "1", label: "1st Year (1)" },
        { value: "2", label: "2nd Year (2)" },
        { value: "3", label: "3rd Year (3)" },
        { value: "4", label: "4th Year (4)" }
    ];

    if (loading) {
        return (
            <div className="panel flex items-center justify-center gap-3 p-6">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-border-strong)] border-t-[var(--theme-btn-primary)]" />
                <span className="text-xs text-[var(--theme-text-secondary)]">Loading auto-accept settings…</span>
            </div>
        );
    }

    const badgeClass =
        statusInfo.label === 'Active Now'
            ? 'badge badge-success'
            : statusInfo.label === 'Expired'
                ? 'badge badge-danger'
                : statusInfo.label === 'Scheduled'
                    ? 'badge badge-info'
                    : statusInfo.label === 'Disabled'
                        ? 'badge badge-neutral'
                        : 'badge badge-warning';

    return (
        <section className="panel">
            <div className="panel-header flex-wrap">
                <div className="flex items-start gap-3">
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                        style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                    >
                        <FiClock size={16} />
                    </span>
                    <div>
                        <h3 className="panel-title">Auto accept / auto forward</h3>
                        <p className="panel-subtitle max-w-xl">
                            Automatically forward incoming requests while you are on leave or unavailable.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {statusInfo.sub && (
                        <span className="text-[11px] text-[var(--color-success)]">{statusInfo.sub}</span>
                    )}
                    <span className={badgeClass}>{statusInfo.label}</span>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
                <div
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3.5"
                    style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}
                >
                    <div>
                        <p className="text-[13px] font-semibold text-[var(--theme-text-primary)]">Enable auto accept</p>
                        <p className="mt-0.5 text-[11.5px] text-[var(--theme-text-secondary)]">
                            New requests within the configured window are forwarded automatically.
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        disabled={saving}
                        onClick={() => {
                            const newEnabled = !enabled;
                            setEnabled(newEnabled);
                            if (newEnabled) {
                                const todayStr = new Date().toISOString().split('T')[0];
                                if (!fromDate || fromDate < todayStr) {
                                    setFromDate(todayStr);
                                    if (toDate && toDate < todayStr) setToDate(todayStr);
                                }
                            }
                        }}
                        className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        style={{ background: enabled ? 'var(--theme-btn-primary)' : 'var(--theme-border-strong)' }}
                    >
                        <span
                            className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[19px]' : 'translate-x-[2px]'}`}
                        />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="auto-from" className="field-label">From date</label>
                        <input
                            id="auto-from"
                            type="date"
                            disabled={!enabled || saving}
                            min={new Date().toISOString().split('T')[0]}
                            value={fromDate}
                            onChange={(e) => {
                                const newFrom = e.target.value;
                                setFromDate(newFrom);
                                if (toDate && toDate < newFrom) setToDate(newFrom);
                            }}
                            className="w-full text-[13px] disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="auto-to" className="field-label">To date</label>
                        <input
                            id="auto-to"
                            type="date"
                            disabled={!enabled || saving}
                            min={fromDate || new Date().toISOString().split('T')[0]}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full text-[13px] disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="relative z-20 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MultiSelect
                        label="Department"
                        options={deptOptions}
                        value={selectedDepts}
                        onChange={setSelectedDepts}
                        placeholder="All departments"
                        allOptionLabel="All Departments"
                        disabled={!enabled || saving}
                    />
                    <MultiSelect
                        label="Year"
                        options={yearOptions}
                        value={selectedYears}
                        onChange={setSelectedYears}
                        placeholder="All years"
                        allOptionLabel="All Years"
                        disabled={!enabled || saving}
                    />
                </div>

                <div>
                    <label htmlFor="auto-reason" className="field-label">Reason / description</label>
                    <input
                        id="auto-reason"
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Official duty, out of station, medical leave"
                        className="w-full text-[13px]"
                    />
                </div>

                {error && (
                    <div
                        className="rounded-[var(--radius-md)] px-3.5 py-2.5 text-xs font-medium"
                        style={{
                            background: 'var(--color-danger-soft)',
                            border: '1px solid var(--color-danger-border)',
                            color: 'var(--color-danger)'
                        }}
                    >
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        className="rounded-[var(--radius-md)] px-3.5 py-2.5 text-xs font-medium"
                        style={{
                            background: 'var(--color-success-soft)',
                            border: '1px solid var(--color-success-border)',
                            color: 'var(--color-success)'
                        }}
                    >
                        {message}
                    </div>
                )}

                <div className="flex justify-end border-t border-[var(--theme-border)] pt-4">
                    <button type="submit" disabled={saving || isSaveDisabled} className="btn btn-primary">
                        {saving ? (
                            <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Saving…
                            </>
                        ) : (
                            'Save settings'
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}
