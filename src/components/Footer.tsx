import { Logo } from "@/components/Logo";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered voice screening platform that automates first-round interviews and helps you hire faster.
            </p>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <Twitter className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button className="p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <Linkedin className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button className="p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <Github className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="hover:text-foreground transition-colors">Features</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Pricing</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Integrations</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">API</button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="hover:text-foreground transition-colors">About</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Blog</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Careers</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Contact</button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Terms of Service</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Cookie Policy</button>
              </li>
              <li>
                <button className="hover:text-foreground transition-colors">Security</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Vocalent. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>support@vocalent.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

