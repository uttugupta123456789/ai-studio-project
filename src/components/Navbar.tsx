import React from 'react';
import { Cpu, Mail, RefreshCw, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  isGmailConnected: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSyncGmail: () => void;
  onConnectGmail?: () => void;
  isSyncing: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isGmailConnected,
  onLogin,
  onLogout,
  onSyncGmail,
  onConnectGmail,
  isSyncing,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-2">
              ElectroSales <span className="text-indigo-400 font-semibold">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block tracking-wide uppercase font-medium">
              Electronics Store Sales Assistant
            </span>
          </div>
        </div>

        {/* Right Actions: Gmail Sync & Staff Login */}
        <div className="flex items-center gap-3">
          {/* Gmail Status Badge & Sync Button */}
          {isGmailConnected ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Gmail Synced
              </span>
              <button
                type="button"
                onClick={onSyncGmail}
                disabled={isSyncing}
                title="Sync recent enquiry emails from Gmail"
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onConnectGmail) {
                  onConnectGmail();
                } else {
                  setActiveTab('settings');
                }
              }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Connect Gmail
            </button>
          )}

          {/* User Auth */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Staff'}
                  className="w-8 h-8 rounded-full border border-indigo-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-semibold">
                  {(user.displayName || user.email || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-tight">
                  {user.displayName || 'Staff Member'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-800 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.02h3.88c2.27-2.09 3.66-5.17 3.66-9.11z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.11C3.28 21.37 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.3c-.25-.72-.38-1.49-.38-2.3s.13-1.58.38-2.3V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.11z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.28 2.63 1.26 6.59l4.02 3.11c.95-2.83 3.6-4.95 6.72-4.95z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
