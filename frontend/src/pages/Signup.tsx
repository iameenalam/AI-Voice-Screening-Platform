import { useState, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Quote } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
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

    const result = await api.signup(
      formData.email,
      formData.password,
      formData.name,
      formData.company
    );
    setLoading(false);

    if (result.error) {
      const errorObj = typeof result.error === 'string' 
        ? { error: result.error } 
        : result.error;
      const errorMsg = errorObj?.error || 'An error occurred';
      const errorDetails = errorObj?.details;
      
      toast.error(errorMsg, {
        description: errorDetails || 'Verify your information and try again',
        duration: 5000,
      });
    } else {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col md:flex-row font-sans">
      
      {/* Left side detail panel (hidden on small devices) */}
      <div className="hidden md:flex md:w-1/2 bg-[#0A1128] text-white flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0044CC] via-transparent to-transparent opacity-40" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-12">
          <div className="text-white">
            <Logo className="text-white" />
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Scale Your Auditory Recruiting Operations
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Experience the power of NLP intent classification and vocal acoustic evaluation. Let AI do the initial screening interviews for you.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold block">Smart Evaluation Roadmap</span>
                <span className="text-xs text-[#94A3B8]">Auto-compile specialized prompt roadmaps tailored for any candidate role.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold block">Recruiter Admin Dashboards</span>
                <span className="text-xs text-[#94A3B8]">Review transcripts, match scores, and easily compare candidate responses.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mt-8">
          <Quote className="h-6 w-6 text-[#0066FF] mb-3 opacity-80" />
          <p className="text-xs text-[#E2E8F0] font-medium leading-relaxed italic mb-4">
            "Vocalent enabled our recruitment squad to identify top engineering profiles in record time."
          </p>
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Sarah Jenkins, Head of Talent at TechScale
          </div>
        </div>
      </div>

      {/* Right side signup form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-24 bg-[#F8F9FA]">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 border border-[#E2E8F0] rounded-3xl shadow-lg">
          <div className="mb-8">
            <div className="md:hidden mb-6">
              <Logo />
            </div>
            <h1 className="text-2xl font-black text-[#0A1128] mb-1.5">
              Create Your Account
            </h1>
            <p className="text-xs text-[#64748B] font-semibold">
              Get started with Vocalent screening today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="name" className="text-xs font-bold text-[#0A1128] uppercase tracking-wider">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white border-[#E2E8F0] rounded-xl text-xs font-semibold py-5 focus:border-[#0066FF]"
              />
            </div>

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
              <Label htmlFor="company" className="text-xs font-bold text-[#0A1128] uppercase tracking-wider">Company Name</Label>
              <Input
                id="company"
                type="text"
                placeholder="Your Company Ltd"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-6 rounded-xl font-bold transition-all text-xs mt-2" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#64748B] font-semibold">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#0066FF] font-bold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Signup;
