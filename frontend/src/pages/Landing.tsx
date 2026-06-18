import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { 
  Bot, Clock, Zap, Shield, TrendingUp, Users, 
  Mic, Brain, BarChart3, CheckCircle2, ArrowRight,
  Sparkles, MessageSquare, FileText, UploadCloud, 
  Terminal, BarChart, ChevronRight, Check
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="px-6 relative overflow-hidden bg-white border-b border-[#E2E8F0] min-h-[calc(100vh-72px)] flex flex-col justify-center items-center">
        {/* Subtle mesh background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        <div className="container mx-auto max-w-4xl relative z-10 flex flex-col items-center justify-center text-center">

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0A1128] tracking-tight leading-[1.1] mb-6 max-w-3xl">
            AI-Powered First-Round Screening for{" "}
            <span className="text-[#0066FF] relative inline-block">
              Modern Teams
              <span className="absolute left-0 bottom-1 w-full h-[6px] bg-[#0066FF]/10 rounded-full" />
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-[#475569] mb-8 leading-relaxed max-w-2xl">
            Automate first-round voice interviews, generate high-context screening questions, and select top talent faster with Vocalent's automated screening platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-[#0066FF] hover:bg-[#0052CC] text-white px-8 py-6 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all duration-200 shadow-md shadow-blue-500/10 hover:shadow-lg"
              onClick={() => navigate("/signup")}
            >
              Start Screening (Recruiter)
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-[#E6F0FF] hover:bg-[#D9E8FF] border-none text-[#0066FF] px-8 py-6 rounded-xl font-bold transition-colors"
              onClick={() => navigate("/login")}
            >
              Take Interview
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 bg-white border-b border-[#E2E8F0] min-h-[calc(100vh-72px)] flex flex-col justify-center items-center py-24">
        <div className="container mx-auto max-w-7xl w-full">
          
          {/* Header without blue underline, matching Features header size */}
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0066FF] uppercase tracking-widest block mb-2">Process Overview</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0A1128] mb-4">
              How It Works
            </h2>
            <p className="text-[#64748B] text-base md:text-lg">
              Screen candidates effortlessly with our automated, intelligent first-round voice screening pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-[#E2E8F0] p-8 hover:border-[#0066FF] hover:bg-white transition-all duration-300 group shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm mb-6 group-hover:bg-[#0066FF] transition-all">
                <FileText className="h-6 w-6 text-[#0066FF] group-hover:text-white" />
              </div>
              <span className="text-4xl font-black text-[#E2E8F0] group-hover:text-[#0066FF]/20 transition-all block mb-2">01</span>
              <h3 className="text-xl font-bold text-[#0A1128] mb-3">Bulk Parsing</h3>
              <p className="text-[#64748B] leading-relaxed">
                Upload resumes in bulk. Vocalent AI extracts raw metadata, experience details, and core candidate skills instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-[#E2E8F0] p-8 hover:border-[#0066FF] hover:bg-white transition-all duration-300 group shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm mb-6 group-hover:bg-[#0066FF] transition-all">
                <Bot className="h-6 w-6 text-[#0066FF] group-hover:text-white" />
              </div>
              <span className="text-4xl font-black text-[#E2E8F0] group-hover:text-[#0066FF]/20 transition-all block mb-2">02</span>
              <h3 className="text-xl font-bold text-[#0A1128] mb-3">AI Interviewing</h3>
              <p className="text-[#64748B] leading-relaxed">
                Generates intelligent, adaptive questions tailored to each candidate's background and conducts high-quality voice screening.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-[#E2E8F0] p-8 hover:border-[#0066FF] hover:bg-white transition-all duration-300 group shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm mb-6 group-hover:bg-[#0066FF] transition-all">
                <BarChart3 className="h-6 w-6 text-[#0066FF] group-hover:text-white" />
              </div>
              <span className="text-4xl font-black text-[#E2E8F0] group-hover:text-[#0066FF]/20 transition-all block mb-2">03</span>
              <h3 className="text-xl font-bold text-[#0A1128] mb-3">Deep Insights</h3>
              <p className="text-[#64748B] leading-relaxed">
                Review automated transcription matching, detailed sentiment maps, and an aggregated Vocalent AI Match Score.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Cognitive Superpowers Section (Features) - Deep Navy background */}
      <section id="features" className="px-6 bg-[#0A1128] text-white border-b border-[#1E293B] relative overflow-hidden min-h-[calc(100vh-72px)] flex flex-col justify-center items-center py-24">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-7xl relative z-10 w-full">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0066FF] uppercase tracking-widest block mb-2">Advanced Modules</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Cognitive Superpowers
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              Empower your recruiting funnel with next-generation deep intelligence features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Superpower 1 */}
            <div className="bg-[#0E1B3E] border border-blue-950/50 rounded-2xl p-8 hover:border-[#0066FF]/50 transition-all duration-300">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center border border-[#0066FF]/20 mb-6">
                <Brain className="h-6 w-6 text-[#0066FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Question Gen</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Tailors targeted technical & cultural interview questions in real-time based on candidate CV details and role specifications.
              </p>
            </div>

            {/* Superpower 2 */}
            <div className="bg-[#0E1B3E] border border-blue-950/50 rounded-2xl p-8 hover:border-[#0066FF]/50 transition-all duration-300">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center border border-[#0066FF]/20 mb-6">
                <TrendingUp className="h-6 w-6 text-[#0066FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sentiment Analysis</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Analyzes speech velocity, sentence composition, and vocabulary to evaluate confidence levels and communication skills.
              </p>
            </div>

            {/* Superpower 3 */}
            <div className="bg-[#0E1B3E] border border-blue-950/50 rounded-2xl p-8 hover:border-[#0066FF]/50 transition-all duration-300">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center border border-[#0066FF]/20 mb-6">
                <UploadCloud className="h-6 w-6 text-[#0066FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Bulk CV Parsing</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Supports drag-and-drop ingestion of up to 50 CVs at once, automatically updating profiles and creating pipeline records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Dashboard Reimagined Section (Benefits) */}
      <section id="benefits" className="py-24 px-6 bg-[#F8F9FA] border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-5 text-left">
              <span className="text-xs font-bold text-[#0066FF] uppercase tracking-widest block mb-2">Command Center</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A1128] mb-6 leading-tight">
                Your Recruitment Dashboard, Reimagined
              </h2>
              
              <ul className="space-y-4">
                {[
                  "Real-time candidate indexing and sorting",
                  "Automated voice assessment evaluations",
                  "Comprehensive talent matching scores",
                  "Advanced sentiment and confidence analytics"
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-left">
                    <div className="w-6 h-6 rounded-full bg-[#E6F0FF] flex items-center justify-center mt-0.5">
                      <Check className="h-4.5 w-4.5 text-[#0066FF] stroke-[3px]" />
                    </div>
                    <span className="text-base text-[#475569] font-medium">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-xl px-6 py-5 flex items-center gap-2 group transition-all"
                  onClick={() => navigate("/dashboard")}
                >
                  View Workspace
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Right Mockup Column */}
            <div className="lg:col-span-7">
              {/* Beautiful Recruiter Dashboard Mockup */}
              <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-5 overflow-hidden text-left">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                      <Users className="h-4.5 w-4.5 text-[#0066FF]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A1128]">Ahmed Khan</div>
                      <div className="text-[10px] text-[#64748B]">Candidate Assessment</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    94% Match Score
                  </span>
                </div>

                {/* Body Metrics Row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#F8FAFC] border border-[#F1F5F9] p-3 rounded-xl">
                    <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">Total Candidates</div>
                    <div className="text-lg font-extrabold text-[#0A1128]">128</div>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#F1F5F9] p-3 rounded-xl">
                    <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">In-Progress</div>
                    <div className="text-lg font-extrabold text-[#0A1128]">42</div>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#F1F5F9] p-3 rounded-xl">
                    <div className="text-[10px] text-[#EF4444] font-semibold uppercase tracking-wider">Interviews Today</div>
                    <div className="text-lg font-extrabold text-[#EF4444]">8</div>
                  </div>
                </div>

                {/* Table Snippet */}
                <div className="border border-[#F1F5F9] rounded-xl overflow-hidden bg-[#F8FAFC]">
                  <div className="grid grid-cols-12 bg-[#F1F5F9] px-3 py-2 text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                    <div className="col-span-4">Candidate</div>
                    <div className="col-span-4 text-center">AI Rating</div>
                    <div className="col-span-4 text-right">Status</div>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] text-xs">
                    <div className="grid grid-cols-12 px-3 py-2.5 items-center">
                      <div className="col-span-4 font-semibold text-[#0A1128]">Ahmed Khan</div>
                      <div className="col-span-4 flex items-center justify-center">
                        <div className="w-16 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#0066FF] h-full" style={{ width: "94%" }} />
                        </div>
                        <span className="ml-1.5 text-[10px] font-bold text-[#0066FF]">94%</span>
                      </div>
                      <div className="col-span-4 text-right">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">COMPLETED</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 px-3 py-2.5 items-center">
                      <div className="col-span-4 font-semibold text-[#0A1128]">Sarah Ali</div>
                      <div className="col-span-4 flex items-center justify-center">
                        <div className="w-16 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#F59E0B] h-full" style={{ width: "88%" }} />
                        </div>
                        <span className="ml-1.5 text-[10px] font-bold text-[#F59E0B]">88%</span>
                      </div>
                      <div className="col-span-4 text-right">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">PROCESSING</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA / Newsletter Section */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-4xl text-center bg-[#F8F9FA] border border-[#E2E8F0] p-12 md:p-16 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent" />
          
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A1128] mb-4">
              Stay Updated
            </h2>
            <p className="text-[#64748B] mb-8 text-sm md:text-base">
              Subscribe to the Vocalent mailing list for product updates, hiring logs, and modern screening methodologies.
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="work@company.com"
                required
                className="flex-1 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] text-sm"
              />
              <Button
                type="submit"
                className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                Join Newsletter
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
