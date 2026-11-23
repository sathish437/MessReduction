import React from 'react';
import { FiHome, FiActivity } from 'react-icons/fi';

const MobileBottomNav = ({ activeTab, setActiveTab, isAnyProcessing }) => {
    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md px-4 py-2 flex items-center justify-around safe-bottom"
            style={{
                background: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                boxShadow: 'var(--shadow-modal)'
            }}
        >
            <button 
                type="button"
                onClick={() => setActiveTab('dashboard')} 
                disabled={isAnyProcessing}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-[var(--radius-md)] transition-all ${
                    isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                } ${
                    activeTab === 'dashboard'
                        ? 'text-[var(--theme-btn-primary)] font-bold'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
            >
                {activeTab === 'dashboard' && (
                    <span
                        className="absolute inset-0 rounded-[var(--radius-md)] transition-all"
                        style={{ background: 'var(--color-accent-soft)' }}
                    />
                )}
                <FiHome size={18} className="relative z-10" />
                <span className="relative z-10 text-[11px] font-semibold mt-0.5 tracking-tight">Apply</span>
            </button>
            
            <button 
                type="button"
                onClick={() => setActiveTab('track')} 
                disabled={isAnyProcessing}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-[var(--radius-md)] transition-all ${
                    isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                } ${
                    activeTab === 'track'
                        ? 'text-[var(--theme-btn-primary)] font-bold'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
            >
                {activeTab === 'track' && (
                    <span
                        className="absolute inset-0 rounded-[var(--radius-md)] transition-all"
                        style={{ background: 'var(--color-accent-soft)' }}
                    />
                )}
                <FiActivity size={18} className="relative z-10" />
                <span className="relative z-10 text-[11px] font-semibold mt-0.5 tracking-tight">Track</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
