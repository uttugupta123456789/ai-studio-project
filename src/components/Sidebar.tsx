import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Inbox,
  Users,
  Package,
  MessageSquare,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingEnquiriesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingEnquiriesCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'ai-agent',
      label: 'AI Sales Agent',
      icon: Bot,
      isSpecial: true,
    },
    {
      id: 'enquiries',
      label: 'Enquiries',
      icon: Inbox,
      badge: pendingEnquiriesCount > 0 ? pendingEnquiriesCount : undefined,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: MessageSquare,
    },
    {
      id: 'settings',
      label: 'Gmail & Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Store Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? item.isSpecial
                    ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : item.isSpecial
                  ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isSpecial ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.isSpecial && !isActive && (
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                )}
              </div>

              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive ? 'bg-white text-indigo-700' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick AI Pro Tip Box */}
      <div className="mt-8 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Natural Language</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Ask questions like <span className="text-slate-200 italic">"What laptops are under ₹50k?"</span> or <span className="text-slate-200 italic">"Draft a response to Rahul"</span> in the AI Sales Agent.
        </p>
      </div>
    </aside>
  );
};
