import { Logo } from "@/components/Logo";
import { Instagram, Facebook, Linkedin } from "lucide-react";

export const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="border-t border-border/50 bg-background/70 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 pt-10 md:pt-12 pb-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start text-center md:text-left">
          
          {/* Logo + Description */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-sm">
              AI-powered voice screening platform that automates first-round interviews and helps you hire faster.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-4 text-sm text-foreground uppercase tracking-wide">
              Navigate To:
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <button
                onClick={() => scrollToSection("home")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("benefits")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Benefits
              </button>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-4 text-sm text-foreground uppercase tracking-wide">
              Follow Us
            </h3>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30 mt-8 pt-6 pb-3 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Vocalent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
