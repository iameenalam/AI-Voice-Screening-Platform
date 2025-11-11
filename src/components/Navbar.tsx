import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, LogOut, User } from "lucide-react";
import { api } from "@/lib/api";

interface NavbarProps {
  showActions?: boolean;
  actionLabel?: string;
  onActionClick?: () => void;
  showUserMenu?: boolean;
}

export const Navbar = ({ 
  showActions = false, 
  actionLabel = "New Interview",
  onActionClick,
  showUserMenu = false 
}: NavbarProps) => {
  const navigate = useNavigate();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          
          <div className="flex items-center gap-3">
            {showUserMenu && user && (
              <div className="hidden sm:flex items-center gap-3 mr-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/30 border border-border/30">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </div>
            )}
            
            {showActions && (
              <Button 
                onClick={onActionClick || (() => navigate("/upload-cv"))}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            )}
            
            {!showActions && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/login")}
                  className="hidden sm:flex"
                  size="sm"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                  size="sm"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
            
            {showUserMenu && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

