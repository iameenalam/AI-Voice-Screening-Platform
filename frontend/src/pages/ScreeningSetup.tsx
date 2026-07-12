import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, ExternalLink,
  RefreshCw, Shield, Send, Check, Trash2, Edit2, Plus, Save, Menu
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HOST_URL = API_BASE_URL.replace('/api', '');

type Question = {
  category: string;
  text: string;
  logic: string;
  isNew?: boolean;
  isEditing?: boolean;
};

const ScreeningSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const candidateId = location.state?.candidateId || localStorage.getItem('currentCandidateId');
  const candidateIds = location.state?.candidateIds;
  const isBatch = location.state?.isBatch;

  const [role, setRole] = useState(location.state?.role || 'NaN');
  const [name, setName] = useState(location.state?.name || 'NaN');
  const [cvUrl, setCvUrl] = useState(location.state?.cvUrl || '');
  const [email, setEmail] = useState(location.state?.email || '');
  const [batchCandidates, setBatchCandidates] = useState<any[]>([]);

  useEffect(() => {
    if (candidateId && !isBatch) {
      api.getCandidate(candidateId).then(result => {
        if (result.data) {
          if (result.data.name) setName(result.data.name);
          if (result.data.role || result.data.jobField) {
            setRole(result.data.role || result.data.jobField);
          }
          if (result.data.cvUrl) setCvUrl(result.data.cvUrl);
          if (result.data.email) setEmail(result.data.email);
        }
      });
    }
  }, [candidateId, isBatch]);

  useEffect(() => {
    if (isBatch && candidateIds && candidateIds.length > 0) {
      Promise.all(candidateIds.map((id: string) => api.getCandidate(id)))
        .then(results => {
          const loadedCandidates = results
            .map(res => res.data)
            .filter(Boolean);
          setBatchCandidates(loadedCandidates);
          
          setName(`Batch: ${loadedCandidates.length} Candidates`);
          
          const roles = Array.from(new Set(loadedCandidates.map(c => c.role || c.jobField || 'Unknown')));
          if (roles.length === 1) {
            setRole(roles[0]);
          } else {
            setRole("Multiple Roles");
          }
        })
        .catch(err => {
          console.error("Failed to load batch candidates info", err);
        });
    }
  }, [isBatch, candidateIds]);

  const defaultQuestions: Question[] = [
    { category: "TECHNICAL EVALUATION", text: `Can you describe your experience and technical proficiency relevant to the ${role} role?`, logic: "Standard technical screen." },
    { category: "TECHNICAL EVALUATION", text: "What tools and frameworks do you use daily, and how do you stay updated with industry trends?", logic: "Assesses tool proficiency." },
    { category: "TECHNICAL EVALUATION", text: "Walk me through a complex technical problem you solved recently.", logic: "Assesses problem solving." },
    { category: "BEHAVIORAL / CULTURE FIT", text: "Describe a challenge you faced in a team setting and how you resolved it.", logic: "Assesses teamwork." },
    { category: "BEHAVIORAL / CULTURE FIT", text: "How do you handle disagreements with colleagues or managers?", logic: "Assesses conflict resolution." },
    { category: "BEHAVIORAL / CULTURE FIT", text: "Tell me about a time you had to adapt to a significant change at work.", logic: "Assesses adaptability." },
    { category: "ONBOARDING / INTRO", text: "Why are you interested in this position and our company?", logic: "Assesses motivation." },
    { category: "ONBOARDING / INTRO", text: "What are you looking for in your next role?", logic: "Assesses alignment." },
    { category: "ONBOARDING / INTRO", text: "What type of work environment brings out your best performance?", logic: "Assesses environment fit." }
  ];

  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);

  useEffect(() => {
    // Only generate for a real role — skip the transient 'NaN'/'Unknown'
    // placeholder so we don't fire a redundant, paid generation call.
    const isPlaceholderRole = !role || role === 'NaN' || role === 'Unknown';
    if (!isPlaceholderRole && !location.state?.isMock) {
      loadSuggestedQuestions();
    }
  }, [role]);

  const loadSuggestedQuestions = async (forceRegenerate = false) => {
    setGenerating(true);
    const queryRole = role === "Multiple Roles" ? "General Candidate" : role;
    const result = await api.generateQuestions(queryRole, forceRegenerate);
    setGenerating(false);
    
    if (result.data?.questions && result.data.questions.length > 0) {
      setQuestions(result.data.questions.map((q: any) => {
        if (typeof q === 'string') {
          return { category: "ROLE ALIGNED", text: q, logic: `Generated based on the ${queryRole} requirements.` };
        }
        return {
          category: (q.category || "ROLE ALIGNED").toUpperCase(),
          text: q.text || "",
          logic: q.logic || `Targeted based on the ${queryRole} requirements.`
        };
      }));
    } else {
      // Fallback if API fails or returns empty
      setQuestions(defaultQuestions);
    }
  };

  const handleAddQuestion = (category: string) => {
    setQuestions([...questions, {
      category: category,
      text: "",
      logic: "Manually added by recruiter.",
      isNew: true,
      isEditing: true
    }]);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const toggleEdit = (index: number) => {
    const updated = [...questions];
    // Don't allow saving if empty
    if (updated[index].isEditing && !updated[index].text.trim()) {
      toast.error("Question text cannot be empty");
      return;
    }
    updated[index].isEditing = !updated[index].isEditing;
    setQuestions(updated);
  };

  const handleQuestionChange = (index: number, newText: string) => {
    const updated = [...questions];
    updated[index].text = newText;
    setQuestions(updated);
  };

  const handleCompose = () => {
    if (questions.some(q => q.isEditing)) {
      toast.error("Please save all questions before proceeding");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    if (!isBatch && !candidateId) {
      toast.error("Candidate information missing. Please go back and select a candidate.");
      return;
    }
    if (isBatch && (!candidateIds || candidateIds.length === 0)) {
      toast.error("Candidate information missing. Please go back and select candidates.");
      return;
    }

    navigate("/compose-invite", {
      state: { 
        candidateId,
        candidateIds,
        isBatch,
        role, 
        name, 
        email,
        questions: questions 
      }
    });
  };

  const handleViewPortfolio = () => {
    if (!cvUrl) {
      toast.error("No CV/Resume available for this candidate");
      return;
    }
    const isAbsoluteUrl = cvUrl.startsWith('http://') || cvUrl.startsWith('https://');
    const targetUrl = isAbsoluteUrl ? cvUrl : `${HOST_URL}${cvUrl}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex font-sans w-full">
      {/* Sidebar Component */}
      <Sidebar 
        isOpenMobile={isMobileMenuOpen} 
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar for Mobile */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-4 flex items-center justify-between shrink-0 gap-4 md:hidden">
          <button 
            className="text-[#64748B] hover:text-[#0A1128]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
          <div className="max-w-[1100px] mx-auto">
            {/* Back Button */}
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0A1128] font-bold text-xs uppercase tracking-wider mb-8"
            >
              <ArrowLeft className="h-4 w-4" /> Back to candidates
            </button>

            {/* Candidate Profile Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4">
              <div>
                <h1 className="text-4xl font-extrabold text-[#0A1128] tracking-tight">{name}</h1>
                <h2 className="text-xl font-bold text-[#0066FF] mt-1">{role}</h2>
                {!isBatch ? (
                  email ? (
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E2E8F0]/60 text-[#475569] rounded-lg text-[11px] font-bold tracking-wide">
                        {email}
                      </div>
                    </div>
                  ) : null
                ) : (
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E0F2FE] text-[#0369A1] rounded-lg text-[11px] font-bold tracking-wide uppercase">
                      Batch Screening Mode
                    </div>
                    <div className="text-xs text-[#64748B] font-semibold">
                      {batchCandidates.length || candidateIds?.length || 0} candidates selected
                    </div>
                  </div>
                )}
              </div>
              {!isBatch && (
                <button 
                  onClick={handleViewPortfolio}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#E6F0FF] text-[#0066FF] hover:bg-[#D6E4FF] rounded-xl text-[13px] font-bold transition-colors shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" /> View Portfolio
                </button>
              )}
            </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (Questions) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[22px] font-extrabold text-[#0A1128] leading-tight">
                AI-Generated Interview <br className="hidden md:block" /> Questions
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] border border-[#FFEDD5] rounded-lg text-[#C2410C]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></div>
                  <span className="text-[10px] font-bold tracking-widest uppercase">AI Suggested — Editable</span>
                </div>
                <button 
                  className="flex items-center gap-1.5 text-[#0066FF] text-[13px] font-bold hover:underline"
                  onClick={() => loadSuggestedQuestions(true)}
                  disabled={generating}
                >
                  <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} /> Regenerate
                </button>
              </div>
            </div>

            {generating ? (
              <div className="space-y-10 animate-pulse">
                {["TECHNICAL EVALUATION", "BEHAVIORAL / CULTURE FIT", "ONBOARDING / INTRO"].map((segment) => (
                  <div key={segment} className="space-y-4">
                    <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="bg-white border-none rounded-2xl p-7 relative h-32">
                        <div className="h-3 w-24 bg-slate-100 rounded mb-4"></div>
                        <div className="space-y-2 mb-4">
                          <div className="h-4 w-full bg-slate-200 rounded"></div>
                          <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-3 w-1/2 bg-slate-100 rounded mt-4"></div>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
            <div className="space-y-10">
              {["TECHNICAL EVALUATION", "BEHAVIORAL / CULTURE FIT", "ONBOARDING / INTRO"].map((segment) => (
                <div key={segment} className="space-y-4">
                  <h4 className="text-sm font-bold text-[#64748B] tracking-wider uppercase border-b border-[#E2E8F0] pb-2">
                    {segment}
                  </h4>
                  
                  {questions.map((q, idx) => q.category === segment && (
                    <Card key={idx} className="bg-white border-none rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] p-7 relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase">
                          QUESTION {String(idx + 1).padStart(2, '0')}
                        </div>
                        
                        {/* Action Buttons (Edit / Delete) */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleEdit(idx)}
                            className="p-1.5 text-[#64748B] hover:text-[#0066FF] hover:bg-[#EEF2FF] rounded-md transition-colors"
                            title={q.isEditing ? "Save" : "Edit"}
                          >
                            {q.isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {q.isEditing ? (
                        <Textarea
                          value={q.text}
                          onChange={(e) => handleQuestionChange(idx, e.target.value)}
                          className="text-[#0A1128] text-[15px] font-medium leading-relaxed bg-[#F8FAFC] border-[#E2E8F0] min-h-[100px] mb-3 focus:border-[#0066FF]"
                          placeholder="Enter question text here..."
                          autoFocus
                        />
                      ) : (
                        <p className={`text-[#0A1128] text-[15px] font-medium leading-relaxed ${q.isNew && q.logic.includes('Insight') ? 'italic' : ''}`}>
                          {q.isNew && q.logic.includes('Insight') ? `"${q.text}"` : q.text}
                        </p>
                      )}
                      
                      {q.logic && !q.isEditing && (
                        <div className="mt-5 flex items-center gap-1.5 text-[#C2410C] bg-white">
                          <Shield className="h-4 w-4" fill="#EA580C" stroke="white" />
                          <span className="text-[11px] font-medium text-[#475569]">
                            <span className="font-bold text-[#0A1128]">{q.isNew ? 'Custom Logic:' : 'Logic:'}</span> {q.logic}
                          </span>
                        </div>
                      )}

                      {q.isNew && !q.isEditing && q.logic.includes('Insight') && (
                        <div className="absolute bottom-6 right-6 text-[10px] font-bold text-[#0066FF] tracking-widest uppercase">
                          NEWLY GENERATED
                        </div>
                      )}
                    </Card>
                  ))}
                  
                  <button 
                    onClick={() => handleAddQuestion(segment)}
                    className="w-full py-4 border-2 border-dashed border-[#CBD5E1] hover:border-[#0066FF] rounded-xl flex items-center justify-center gap-2 text-[#475569] hover:text-[#0066FF] hover:bg-[#EEF2FF] transition-colors text-[13px] font-bold"
                  >
                    <Plus className="h-4 w-4" /> Add Question to {segment}
                  </button>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6 lg:sticky lg:top-8">
            
            {!isBatch ? (
              <Card className="bg-white border-none rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] p-7">
                <div className="flex items-center gap-3 mb-6 border-b border-[#E2E8F0] pb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#0A1128]">Candidate</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-0.5">Name</div>
                    <div className="font-semibold text-[#0A1128]">{name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-0.5">Role</div>
                    <div className="font-semibold text-[#0A1128]">{role}</div>
                  </div>
                  {email && (
                    <div>
                      <div className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-0.5">Email</div>
                      <div className="font-semibold text-[#0A1128] break-all">{email}</div>
                    </div>
                  )}
                </div>

                <p className="mt-6 text-[12px] text-[#64748B] leading-relaxed">
                  The questions on the left are AI-suggested from the candidate's role and are fully editable before you send the invite.
                </p>
              </Card>
            ) : (
              /* Batch Summary Card */
              <Card className="bg-white border-none rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] p-7">
                <div className="flex items-center gap-3 mb-6 border-b border-[#E2E8F0] pb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0A1128]">Batch Candidates</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{batchCandidates.length || candidateIds?.length || 0} Ready for Invite</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {batchCandidates.length > 0 ? (
                    batchCandidates.map((c, i) => (
                      <div key={c._id || i} className="flex items-start justify-between gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-transparent">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-[#0A1128] truncate">{c.name}</div>
                          <div className="text-[11px] text-[#64748B] font-medium truncate mt-0.5">{c.role || c.jobField || "Candidate"}</div>
                          <div className="text-[10px] text-[#94A3B8] font-medium truncate mt-0.5">{c.email}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-[#64748B] font-semibold">
                      Loading candidates list...
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="pt-2">
              <Button
                onClick={handleCompose}
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-6 rounded-xl text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                Compose Invite
                <Send className="h-4 w-4" />
              </Button>
            </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};

export default ScreeningSetup;
