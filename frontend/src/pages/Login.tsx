import { useState, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Quote } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useLayoutEffect(() => {
    if (api.isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  if (api.isAuthenticated()) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await api.login(formData.email, formData.password);
    setLoading(false);

    if (result.error) {
      const errorObj = typeof result.error === 'string' 
        ? { error: result.error } 
        : result.error;
      const errorMsg = errorObj?.error || 'An error occurred';
      const errorDetails = errorObj?.details;
      
      toast.error(errorMsg, {
        description: errorDetails || 'Check your credentials and try again',
        duration: 5000,
      });
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col md:flex-row font-sans">
      
      {/* Left side detail panel (hidden on small devices) */}
      <div className="hidden md:flex md:w-1/2 bg-[#0A1128] text-white flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        {/* Background visual detail */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0044CC] via-transparent to-transparent opacity-40" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-12">
          {/* Logo with custom white text */}
          <div className="text-white">
            <Logo className="text-white" />
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Cognitive AI Screening for High-Performance Teams
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Automate voice screening, analyze soft skills and technical parameters in real-time, and hire candidates matching your exact criteria.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold block">Bulk CV Parsing</span>
                <span className="text-xs text-[#94A3B8]">Parse PDFs or DOCX files and extract contact details in seconds.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold block">Automated Audio Interviews</span>
                <span className="text-xs text-[#94A3B8]">Review transcripts, acoustic sentiment tracking, and NLP keyword counts.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Quote block */}
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mt-8">
          <Quote className="h-6 w-6 text-[#0066FF] mb-3 opacity-80" />
          <p className="text-xs text-[#E2E8F0] font-medium leading-relaxed italic mb-4">
            "Vocalent cut our candidate voice assessment workload by 80% while matching talent with pinpoint precision."
          </p>
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Sarah Jenkins, Head of Talent at TechScale
          </div>
        </div>
      </div>

      {/* Right side form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-24 bg-[#F8F9FA]">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 border border-[#E2E8F0] rounded-3xl shadow-lg">
          <div className="mb-8">
            <div className="md:hidden mb-6">
              <Logo />
            </div>
            <h1 className="text-2xl font-black text-[#0A1128] mb-1.5">
              Welcome back
            </h1>
            <p className="text-xs text-[#64748B] font-semibold">
              Sign in to manage candidate screening sessions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-xs font-bold text-[#0A1128] uppercase tracking-wider">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-white border-[#E2E8F0] rounded-xl text-xs font-semibold py-5 focus:border-[#0066FF]"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="password" className="text-xs font-bold text-[#0A1128] uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-white border-[#E2E8F0] rounded-xl text-xs font-semibold py-5 focus:border-[#0066FF]"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-6 rounded-xl font-bold transition-all text-xs" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#64748B] font-semibold">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-[#0066FF] font-bold hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
