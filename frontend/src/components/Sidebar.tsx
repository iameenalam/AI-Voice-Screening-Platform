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
      label: "Jobs",
      icon: Briefcase,
      path: "/jobs"
    },
    {
      label: "Candidates",
      icon: Users,
      path: "/candidate-pool"
    },
    // {
    //   label: "Interviews",
    //   icon: CheckSquare,
    //   path: "/candidate-pool" // Or point to interviews
    // },
    // {
    //   label: "Analytics",
    //   icon: BarChart,
    //   path: "/dashboard"
    // }
  ];

  const handleLogout = () => {
    api.logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-[#0A1128]/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onMobileToggle}
        />
      )}
      
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-6 select-none transition-all duration-300
        ${isCollapsed ? 'md:w-20 md:px-0 md:py-6 md:items-center' : 'w-64'}
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8 w-full">
          {/* Header/Logo */}
          <div className={`flex items-center ${isCollapsed ? 'md:justify-center w-full' : 'justify-between pl-2'} h-8 relative`}>
            {(!isCollapsed || isOpenMobile) && (
              <button onClick={() => navigate("/")} className="hover:opacity-85 transition-opacity">
                <Logo />
              </button>
            )}
            
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className={`hidden md:flex w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0A1128] hover:bg-[#F8FAFC] items-center justify-center transition-colors ${
                isCollapsed ? 'relative mx-auto' : 'absolute right-0'
              }`}
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>

            {/* Mobile Close Toggle */}
            <button 
              onClick={onMobileToggle}
              className="md:hidden w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0A1128] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors absolute right-0"
            >
              <X className="h-5 w-5 shrink-0" />
            </button>
          </div>

        {/* Navigation List */}
        <nav className="space-y-1 w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center transition-all ${
                  isCollapsed 
                    ? 'justify-center w-12 h-12 mx-auto rounded-xl' 
                    : 'gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full'
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
      <div className={`space-y-4 ${isCollapsed ? 'flex flex-col items-center w-full' : 'w-full'}`}>
        
        {/* User Profile Card */}
        {isCollapsed ? (
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="w-12 h-12 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#64748B] hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="h-5 w-5" />
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
                Recruiter
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
    </>
  );
};
