import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, ArrowRight, LogOut, Menu, X } from "lucide-react";
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
  showUserMenu = false,
}: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.getCurrentUser();
  const isLandingPage = location.pathname === "/";

  const handleLogout = () => {
    api.logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    // Close mobile menu first, then scroll after a brief delay to ensure menu is closed
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Get navbar height (sticky navbar) - account for different screen sizes
        const navbar = document.querySelector('nav');
        const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0;
        
        // Get current scroll position
        const currentScrollY = window.scrollY || window.pageYOffset;
        
        // Get element's position relative to viewport
        const elementRect = element.getBoundingClientRect();
        
        // Calculate target scroll position: element position + current scroll - navbar height
        const targetScrollY = elementRect.top + currentScrollY - navbarHeight;
        
        // Scroll to position accounting for navbar height
        window.scrollTo({
          top: Math.max(0, targetScrollY), // Ensure we don't scroll to negative position
          behavior: "smooth"
        });
      }
    }, 150); // Slightly longer delay to ensure mobile menu animation completes
  };

  return (
    <nav className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => {
              navigate("/");
              setMobileMenuOpen(false);
            }}
            className="hover:opacity-80 transition-opacity"
          >
            <Logo />
          </button>

          {/* Center Navigation Links (Desktop only) */}
          {isLandingPage && (
            <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => scrollToSection("home")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("benefits")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Benefits
              </button>
            </div>
          )}

          {/* Right Side Buttons */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {/* On Dashboard: show Candidate Pool + New Interview */}
                {location.pathname === "/dashboard" && (
                  <>
                    <Button
                      onClick={() => navigate("/candidate-pool")}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                      size="sm"
                    >
                      Candidate Pool
                    </Button>
                    <Button
                      onClick={() => navigate("/upload-cv")}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Interview
                    </Button>
                  </>
                )}

                {/* On Candidate Pool: show Dashboard + New Interview */}
                {location.pathname === "/candidate-pool" && (
                  <>
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                      size="sm"
                    >
                      Dashboard
                    </Button>
                    <Button
                      onClick={() => navigate("/upload-cv")}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Interview
                    </Button>
                  </>
                )}

                {/* On other secondary logged-in pages (Setup, Results, etc.): show action button if provided */}
                {location.pathname !== "/dashboard" && location.pathname !== "/candidate-pool" && location.pathname !== "/" && (
                  <Button
                    onClick={onActionClick || (() => navigate("/upload-cv"))}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {actionLabel}
                  </Button>
                )}

                {/* On Landing Page: show Dashboard */}
                {location.pathname === "/" && (
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                    size="sm"
                  >
                    Dashboard
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}

            {!user && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
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
              </div>
            )}

            {/* Hamburger Menu - Only show on landing page */}
            {isLandingPage && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 animate-fadeIn">
            <div className="flex flex-col gap-3 pt-4">
              {isLandingPage && (
                <>
                  <button
                    onClick={() => scrollToSection("home")}
                    className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => scrollToSection("benefits")}
                    className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Benefits
                  </button>
                </>
              )}

              {/* Mobile User Buttons */}
              {user ? (
                <>
                  {location.pathname === "/dashboard" ? (
                    <Button
                      onClick={() => {
                        navigate("/candidate-pool");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg transition-all mt-2"
                      size="sm"
                    >
                      Candidate Pool
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        navigate("/dashboard");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg transition-all mt-2"
                      size="sm"
                    >
                      Dashboard
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      navigate("/upload-cv");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg transition-all mt-1"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Interview
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full text-muted-foreground hover:text-foreground mt-1"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full mt-2"
                    size="sm"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg transition-all"
                    size="sm"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
