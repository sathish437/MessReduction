import React from 'react';
import { FiHome, FiActivity } from 'react-icons/fi';

const MobileBottomNav = ({ activeTab, setActiveTab, isAnyProcessing }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] px-4 py-2 flex items-center justify-around">
            <button 
                onClick={() => setActiveTab('dashboard')} 
                disabled={isAnyProcessing}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-2xl transition-all duration-300 ${isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'} ${activeTab === 'dashboard' ? 'text-[var(--color-btn-primary)] font-bold' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
                {activeTab === 'dashboard' && (
                    <span className="absolute inset-0 rounded-2xl bg-[var(--color-btn-primary)]/10 border border-[var(--color-btn-primary)]/20 transition-all duration-300" />
                )}
                <FiHome size={20} className={`relative z-10 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
                <span className="relative z-10 text-[11px] font-semibold mt-1 tracking-tight">Home</span>
            </button>
            
            <button 
                onClick={() => setActiveTab('track')} 
                disabled={isAnyProcessing}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-2xl transition-all duration-300 ${isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'} ${activeTab === 'track' ? 'text-[var(--color-btn-primary)] font-bold' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
                {activeTab === 'track' && (
                    <span className="absolute inset-0 rounded-2xl bg-[var(--color-btn-primary)]/10 border border-[var(--color-btn-primary)]/20 transition-all duration-300" />
                )}
                <FiActivity size={20} className={`relative z-10 transition-transform duration-300 ${activeTab === 'track' ? 'scale-110' : ''}`} />
                <span className="relative z-10 text-[11px] font-semibold mt-1 tracking-tight">Track</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
