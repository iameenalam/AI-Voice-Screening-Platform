import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { 
  BarChart, Users, UploadCloud, LogOut, 
  Menu, X, Briefcase, Settings, BarChart2, CheckSquare, ChevronLeft, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onMobileToggle?: () => void;
  isOpenMobile?: boolean;
}

export const Sidebar = ({ onMobileToggle, isOpenMobile = false }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.getCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: BarChart2,
      path: "/dashboard"
    },
    {
      label: "Candidates",
      icon: Users,
      path: "/candidate-pool"
    },
    {
      label: "Interviews",
      icon: CheckSquare,
      path: "/candidate-pool" // Or point to interviews
    },
    {
      label: "Analytics",
      icon: BarChart,
      path: "/dashboard"
    }
  ];

  const handleLogout = () => {
    api.logout();
    navigate("/");
  };

  return (
    <aside className={`${isCollapsed ? 'w-20 items-center' : 'w-64'} bg-white border-r border-[#E2E8F0] h-screen sticky top-0 flex flex-col justify-between p-6 z-40 select-none transition-all duration-300`}>
      <div className="space-y-8 w-full">
        {/* Header/Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between pl-2'} h-8`}>
          {!isCollapsed && (
            <button onClick={() => navigate("/")} className="hover:opacity-85 transition-opacity">
              <Logo />
            </button>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0A1128] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'w-full'
                } ${
                  isActive 
                    ? "bg-[#EBF1FF] text-[#0066FF]" 
                    : "text-[#64748B] hover:text-[#0A1128] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#0066FF]" : "text-[#94A3B8]"}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings & Profile Cards */}
      <div className={`space-y-4 ${isCollapsed ? 'flex flex-col items-center' : 'w-full'}`}>
        


        {/* Settings button above profile */}
        <button 
          onClick={() => navigate("/dashboard")} 
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#64748B] hover:text-[#0A1128] hover:bg-[#F8FAFC] transition-all ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
        >
          <Settings className="h-5 w-5 shrink-0 text-[#94A3B8]" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        {/* User Profile Card */}
        {isCollapsed ? (
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center font-bold text-[#0066FF] text-sm hover:bg-[#D6E4FF] transition-colors"
          >
            {user?.name?.slice(0, 2) || "AC"}
          </button>
        ) : (
          <div className="bg-[#EEF2FF] rounded-2xl p-4 flex items-center gap-3 border border-[#E0E7FF]">
            <div className="w-10 h-10 rounded-full bg-[#0066FF] flex items-center justify-center font-bold text-white text-sm shrink-0">
              {user?.name?.slice(0, 2) || "AC"}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-bold text-[#0A1128] truncate leading-tight">
                {user?.name || "Alex Chen"}
              </div>
              <div className="text-[10px] text-[#64748B] font-semibold mt-0.5">
                Talent Lead
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              title="Log Out"
              className="text-[#64748B] hover:text-[#EF4444] p-1 rounded-lg hover:bg-white transition-all shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
