import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, Clock, Users, ArrowUpRight, 
  ChevronRight, Activity, Smile, Bell, HelpCircle, 
  Search, UserPlus, RefreshCw, UploadCloud, Network,
  ArrowRight, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completed: 0,
    inProgress: 0,
    avgSentiment: 0,
  });
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const user = api.getCurrentUser();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const result = await api.getDashboardStats();
    setLoading(false);

    if (result.error) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : (result.error as any)?.error || "Something went wrong";
      toast.error(errorMessage);
    } else if (result.data) {
      setStats({
        totalInterviews: result.data.stats?.totalInterviews || 0,
        completed: result.data.stats?.completed || 0,
        inProgress: result.data.stats?.inProgress || 0,
        avgSentiment: result.data.stats?.avgSentiment || 0,
      });
      setRecentInterviews(result.data.recentInterviews || []);
    }
  };

  const isEmpty = stats.totalInterviews === 0 && recentInterviews.length === 0;
  const matchScorePercent = Math.round(stats.avgSentiment * 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex font-sans">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar matching mock */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-4 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search candidates, jobs, or reports..."
              className="w-full bg-[#F1F5F9]/60 border border-transparent rounded-xl pl-10 pr-4 py-2 text-xs font-medium placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
            />
          </div>

          <div className="flex items-center gap-4 text-[#64748B] pl-4">
            <div className="relative cursor-pointer hover:text-[#0A1128] transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </div>
            <HelpCircle className="h-5 w-5 cursor-pointer hover:text-[#0A1128] transition-colors" />
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          {isEmpty ? (
            /* EMPTY STATE VIEW matching image exactly */
            <div className="space-y-8 animate-fade-in">
              {/* Dashboard Title & Subtext */}
              <div>
                <span className="text-[10px] font-black text-[#0066FF] uppercase tracking-wider block mb-1">
                  Dashboard Overview
                </span>
                <h1 className="text-3xl font-black text-[#0A1128]">
                  Welcome back, {user?.name?.split(" ")[0] || "Alex"}.
                </h1>
                <p className="text-xs text-[#64748B] font-semibold mt-1">
                  Your workspace is ready. Let's start building your dream team by adding your first candidates.
                </p>
              </div>

              {/* 3 Metric Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                      Total Candidates
                    </span>
                    <span className="text-3xl font-black text-[#0A1128]">0</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#0066FF]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                </Card>

                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                      In-Progress
                    </span>
                    <span className="text-3xl font-black text-[#0A1128]">0</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#0066FF]">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                </Card>

                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                      Completed
                    </span>
                    <span className="text-3xl font-black text-[#0A1128]">0</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#0066FF]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </Card>
              </div>

              {/* Bottom Split Layout grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left side Recent Candidates Empty Box */}
                <Card className="lg:col-span-2 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col items-center justify-center min-h-[420px]">
                  <div className="w-full flex items-center justify-between mb-8">
                    <h3 className="text-sm font-extrabold text-[#0A1128]">Recent Candidates</h3>
                    <div className="flex gap-2">
                      <div className="w-12 h-6 bg-[#F1F5F9] rounded-lg" />
                      <div className="w-6 h-6 bg-[#F1F5F9] rounded-lg" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center">
                    {/* Cloud upload svg shape */}
                    <div className="w-32 h-32 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mb-6">
                      <div className="w-14 h-14 bg-[#0066FF] rounded-xl flex items-center justify-center shadow-lg text-white">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                    </div>

                    <h4 className="text-base font-black text-[#0A1128] mb-2">
                      No candidates to show yet
                    </h4>
                    <p className="text-xs text-[#64748B] font-semibold leading-relaxed mb-6">
                      Upload a single CV or a batch of resumes to let Vocalent's AI engine automatically parse, categorize, and rank them for you.
                    </p>

                    <div className="flex gap-3 w-full justify-center">
                      <Button
                        onClick={() => navigate("/upload-cv")}
                        className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs px-5 py-4 rounded-xl shadow-md flex items-center gap-1.5"
                      >
                        <UploadCloud className="h-4 w-4" />
                        Upload CV
                      </Button>
                      <Button
                        onClick={() => navigate("/candidate-pool")}
                        className="bg-[#EBF1FF] hover:bg-[#D6E4FF] text-[#0066FF] font-bold text-xs px-5 py-4 rounded-xl"
                      >
                        Browse Directory
                      </Button>
                    </div>
                  </div>

                  {/* Parsing active indicator */}
                  <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-[#0066FF] uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 bg-[#0066FF] rounded-full animate-ping" />
                    AI Parsing Ready
                  </div>
                </Card>

                {/* Right side Get Started Guide */}
                <div className="space-y-6">
                  {/* Get Started Guide Card */}
                  <Card className="p-6 bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl shadow-sm text-left">
                    <h3 className="text-base font-black text-[#0A1128] mb-6">Get Started</h3>
                    
                    <div className="space-y-6">
                      {/* Step 1 */}
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-[#0066FF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0A1128]">Create your first Job Posting</h4>
                          <p className="text-[10px] text-[#64748B] font-semibold mt-1">
                            Define the role to help our AI understand your needs.
                          </p>
                          <button 
                            onClick={() => navigate("/candidate-pool")} 
                            className="text-[10px] font-bold text-[#0066FF] hover:underline mt-1.5 flex items-center gap-0.5"
                          >
                            Go to Jobs <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-white text-[#64748B] border border-[#E2E8F0] flex items-center justify-center text-xs font-bold shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#64748B]">Import Candidates</h4>
                          <p className="text-[10px] text-[#94A3B8] font-semibold mt-1">
                            Drag and drop CVs or connect your LinkedIn recruiter account.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-white text-[#64748B] border border-[#E2E8F0] flex items-center justify-center text-xs font-bold shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#64748B]">Review AI Matches</h4>
                          <p className="text-[10px] text-[#94A3B8] font-semibold mt-1">
                            Our AI sorts candidates by technical fit and experience.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Connect Apps Card */}
                  <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm text-left">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider">
                        Connect Apps
                      </span>
                      <Network className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                    <div className="flex gap-2">
                      {/* Mock social badges */}
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[10px] font-extrabold text-[#0066FF]">
                        in
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[10px] font-extrabold text-[#94A3B8]">
                        •••
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[10px] font-extrabold text-[#94A3B8]">
                        🌐
                      </div>
                      <button className="w-8 h-8 rounded-lg border border-dashed border-[#E2E8F0] hover:border-[#0066FF] flex items-center justify-center text-xs font-bold text-[#94A3B8] hover:text-[#0066FF] transition-colors">
                        +
                      </button>
                    </div>
                  </Card>
                </div>

              </div>
            </div>
          ) : (
            /* ANALYTICS PRESENT VIEW (Default Active State Dashboard) */
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#0A1128]">
                    Welcome Back, {user?.name || "Ahmed"}
                  </h1>
                  <p className="text-sm text-[#64748B] mt-1">
                    Screening platform activity and candidate metrics command center.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/upload-cv")}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-6 px-6 rounded-xl text-sm shadow-sm"
                >
                  Start New Screening
                </Button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Total Candidates
                    </span>
                    <span className="text-3xl font-black text-[#0A1128]">{stats.totalInterviews}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#E6F0FF] flex items-center justify-center text-[#0066FF]">
                    <Users className="h-5 w-5" />
                  </div>
                </Card>

                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      In-Progress
                    </span>
                    <span className="text-3xl font-black text-amber-500">{stats.inProgress}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Clock className="h-5 w-5" />
                  </div>
                </Card>

                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Completed
                    </span>
                    <span className="text-3xl font-black text-[#10B981]">{stats.completed}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#10B981]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </Card>

                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Avg. Sentiment
                    </span>
                    <span className="text-3xl font-black text-[#0066FF]">{matchScorePercent}%</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#E6F0FF] flex items-center justify-center text-[#0066FF]">
                    <Smile className="h-5 w-5" />
                  </div>
                </Card>
              </div>

              {/* Charts & Graphs block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hiring Pipeline Chart Card */}
                <Card className="lg:col-span-2 p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0A1128]">Hiring Pipeline Funnel</h3>
                      <p className="text-xs text-[#64748B]">Distribution of candidates across interview stages.</p>
                    </div>
                    <Activity className="h-5 w-5 text-[#94A3B8]" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#475569] mb-1">
                        <span>Applied / CV Parsed</span>
                        <span>{stats.totalInterviews} candidates</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#0066FF] h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#475569] mb-1">
                        <span>Interviews Invited / In-Progress</span>
                        <span>{stats.inProgress + stats.completed} candidates</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#0066FF] h-full rounded-full" 
                          style={{ width: `${stats.totalInterviews > 0 ? ((stats.inProgress + stats.completed) / stats.totalInterviews) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#475569] mb-1">
                        <span>Screening Completed</span>
                        <span>{stats.completed} candidates</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#10B981] h-full rounded-full" 
                          style={{ width: `${stats.totalInterviews > 0 ? (stats.completed / stats.totalInterviews) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Sentiment breakdown ring */}
                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0A1128] mb-1">Candidate Sentiment</h3>
                    <p className="text-xs text-[#64748B] mb-6">Real-time keyword emotional tagging.</p>
                  </div>

                  <div className="flex justify-center items-center relative mb-6">
                    <div 
                      className="w-32 h-32 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(#0066FF 0% ${matchScorePercent}%, #E2E8F0 ${matchScorePercent}% 100%)`
                      }}
                    >
                      <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-[#0A1128]">{matchScorePercent}%</span>
                        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Positive</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center justify-center text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-[#0066FF]" />
                      <span className="text-[#475569]">Pos ({matchScorePercent}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-[#E2E8F0]" />
                      <span className="text-[#475569]">Neutral ({100 - matchScorePercent}%)</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* New Analytics Views Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Time to Hire / Average Duration */}
                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0A1128]">Screening Engagement Trends</h3>
                      <p className="text-xs text-[#64748B]">Average time spent by candidates across modules.</p>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] rounded-lg">
                      <Clock className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    {/* Module 1 */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#475569] mb-1.5">
                        <span>Technical Evaluation</span>
                        <span className="text-[#0A1128]">14m 20s</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#4F46E5] h-full rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    
                    {/* Module 2 */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#475569] mb-1.5">
                        <span>Behavioral / Culture Fit</span>
                        <span className="text-[#0A1128]">8m 45s</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#0EA5E9] h-full rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* Module 3 */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#475569] mb-1.5">
                        <span>Onboarding / Intro</span>
                        <span className="text-[#0A1128]">2m 10s</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#8B5CF6] h-full rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* AI Competency Mapping */}
                <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0A1128]">AI Competency Mapping</h3>
                      <p className="text-xs text-[#64748B]">Most frequently verified skills across all candidates.</p>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] rounded-lg">
                      <Sparkles className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">React / Next.js</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#0A1128]">84%</span>
                        <span className="text-[10px] font-bold text-[#10B981] flex items-center"><ArrowUpRight className="h-3 w-3" /> 12%</span>
                      </div>
                    </div>
                    <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">System Design</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#0A1128]">62%</span>
                        <span className="text-[10px] font-bold text-[#10B981] flex items-center"><ArrowUpRight className="h-3 w-3" /> 5%</span>
                      </div>
                    </div>
                    <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Team Leadership</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#0A1128]">45%</span>
                        <span className="text-[10px] font-bold text-[#EF4444] flex items-center"><span className="inline-block transform rotate-90"><ArrowUpRight className="h-3 w-3" /></span> 2%</span>
                      </div>
                    </div>
                    <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">AWS / Cloud</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#0A1128]">78%</span>
                        <span className="text-[10px] font-bold text-[#10B981] flex items-center"><ArrowUpRight className="h-3 w-3" /> 18%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Submissions List Card */}
              <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0A1128]">Recent Screening Sessions</h3>
                    <p className="text-xs text-[#64748B]">Click any candidate row to access the full breakdown dossier.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/candidate-pool")}
                    className="border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold px-4 py-2"
                  >
                    View Candidate Pool
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#F8FAFC] text-[#64748B] text-xs font-extrabold uppercase border-b border-[#E2E8F0]">
                      <tr>
                        <th className="px-6 py-4">Candidate</th>
                        <th className="px-6 py-4">Target Role</th>
                        <th className="px-6 py-4">Sentiment</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {recentInterviews.map((interview, index) => (
                        <tr
                          key={index}
                          onClick={() => navigate("/results", { state: { interviewId: interview.id } })}
                          className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 font-bold text-[#0A1128]">
                            {interview.candidateName}
                          </td>
                          <td className="px-6 py-4 text-[#475569] font-medium">
                            {interview.candidateRole}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-[#10B981]">
                              +{interview.sentiment?.toFixed(2) || "0.00"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {interview.status === "completed" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBFDF5] text-[#10B981] border border-[#D1FAE5]">
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                                In Progress
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-semibold text-[#94A3B8] group-hover:text-[#0066FF] transition-colors">
                            <div className="flex items-center justify-end gap-1">
                              {interview.createdAt
                                ? formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })
                                : ""}
                              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
