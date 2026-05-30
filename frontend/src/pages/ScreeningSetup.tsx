import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Briefcase, ExternalLink, 
  RefreshCw, Shield, Send, Check, Trash2, Edit2, Plus, Save
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  
  const candidateId = location.state?.candidateId || localStorage.getItem('currentCandidateId');
  const candidateIds = location.state?.candidateIds;
  const isBatch = location.state?.isBatch;
  const role = location.state?.role || 'Senior UX Designer';
  const name = location.state?.name || 'Sarah Ali';

  const defaultQuestions: Question[] = [
    {
      category: "DESIGN STRATEGY",
      text: "Can you describe your design process for a complex B2B dashboard, specifically how you balance technical constraints with user-centric outcomes?",
      logic: "Inferred from her previous role at Nexus Enterprise."
    },
    {
      category: "TECHNICAL DEPTH",
      text: "How do you manage design systems at scale across cross-functional teams while ensuring component integrity and accessibility compliance?",
      logic: "Targeted based on her mastery in Figma and design tokens."
    },
    {
      category: "SOFT SKILLS",
      text: "Tell us about a time you had a significant disagreement with a product manager regarding a feature's UX. How did you advocate for the user while maintaining a collaborative relationship?",
      logic: ""
    },
    {
      category: "EMERGING TECH",
      text: "How are you integrating Generative AI into your current design workflow to accelerate prototyping without sacrificing human-centered principles?",
      logic: "Vocalent Insight Layer.",
      isNew: true
    },
    {
      category: "LEADERSHIP",
      text: "As a Senior Designer, how do you approach mentorship and raising the 'design bar' for junior members within your squad?",
      logic: ""
    }
  ];

  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);

  useEffect(() => {
    if (role && !location.state?.isMock) {
      loadSuggestedQuestions();
    }
  }, [role]);

  const loadSuggestedQuestions = async () => {
    setGenerating(true);
    const result = await api.generateQuestions(role);
    setGenerating(false);
    
    if (result.data?.questions && result.data.questions.length > 0) {
      setQuestions(result.data.questions.map((q: string) => ({
        category: "ROLE ALIGNED",
        text: q,
        logic: `Generated based on the ${role} requirements.`
      })));
    } else {
      // Fallback if API fails or returns empty
      setQuestions(defaultQuestions);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      category: "CUSTOM QUESTION",
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
        questions: questions.map(q => q.text) 
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans pb-12">
      {/* Top Navbar Area */}
      <nav className="bg-white border-b border-[#E2E8F0] px-8 py-3 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="text-[#64748B] hover:text-[#0A1128] mr-6">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="relative max-w-xl">
            <span className="absolute left-3.5 top-2.5 text-[#94A3B8] text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search candidate records..."
              className="w-full bg-[#F8FAFC] border-none rounded-lg pl-9 pr-4 py-2 text-[13px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#E2E8F0]"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#64748B]">
          <span className="cursor-pointer hover:text-[#0A1128]">🔔</span>
          <span className="cursor-pointer hover:text-[#0A1128]">❓</span>
          <div className="w-8 h-8 rounded-full bg-[#0066FF] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white text-xs">
            JD
          </div>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 mt-10">
        {/* Candidate Profile Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0A1128] tracking-tight">{name}</h1>
            <h2 className="text-xl font-bold text-[#0066FF] mt-1">{role}</h2>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E2E8F0]/60 text-[#475569] rounded-lg text-[11px] font-bold tracking-wide uppercase">
                <MapPin className="h-3.5 w-3.5" /> SAN FRANCISCO, CA
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E2E8F0]/60 text-[#475569] rounded-lg text-[11px] font-bold tracking-wide uppercase">
                <Briefcase className="h-3.5 w-3.5" /> 8+ YEARS EXP.
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#E6F0FF] text-[#0066FF] hover:bg-[#D6E4FF] rounded-xl text-[13px] font-bold transition-colors shadow-sm">
            <ExternalLink className="h-4 w-4" /> View Portfolio
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Questions) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[22px] font-extrabold text-[#0A1128] leading-tight">
                AI-Generated Interview <br className="hidden md:block" /> Questions
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] border border-[#FFEDD5] rounded-lg text-[#C2410C]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></div>
                  <span className="text-[10px] font-bold tracking-widest uppercase">Cognitive Engine Active</span>
                </div>
                <button 
                  className="flex items-center gap-1.5 text-[#0066FF] text-[13px] font-bold hover:underline"
                  onClick={loadSuggestedQuestions}
                  disabled={generating}
                >
                  <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} /> Regenerate
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <Card key={idx} className="bg-white border-none rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] p-7 relative group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase">
                      QUESTION {String(idx + 1).padStart(2, '0')} - {q.category}
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
                        <span className="font-bold text-[#0A1128]">{q.category === 'EMERGING TECH' || q.category === 'CUSTOM QUESTION' ? 'Custom Logic:' : 'Logic:'}</span> {q.logic}
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
                onClick={handleAddQuestion}
                className="w-full py-5 border-2 border-dashed border-[#CBD5E1] hover:border-[#0066FF] rounded-2xl flex items-center justify-center gap-2 text-[#475569] hover:text-[#0066FF] hover:bg-[#EEF2FF] transition-colors text-[13px] font-bold"
              >
                <Plus className="h-5 w-5" /> Add Custom Question
              </button>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            
            {/* Extracted Skills Card */}
            <Card className="bg-white border-none rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-6 rounded-full bg-[#0066FF] flex items-center justify-center text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </div>
                <h3 className="text-[15px] font-bold text-[#0A1128]">Extracted Skills</h3>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {['FIGMA', 'PROTOTYPING', 'USER RESEARCH', 'B2B SAAS', 'DESIGN SYSTEMS', 'HEURISTIC EVAL'].map(skill => (
                  <span key={skill} className="px-2.5 py-1.5 bg-[#EEF2FF] text-[#0066FF] text-[10px] font-bold tracking-widest uppercase rounded-md">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-5 relative">
                <div className="text-[10px] font-extrabold text-[#C2410C] tracking-widest uppercase mb-2">
                  ARCHITECT'S NOTE
                </div>
                <p className="text-[12px] text-[#475569] leading-relaxed font-medium">
                  Questions were weighted toward her 3-year tenure at <span className="font-bold text-[#0A1128]">Dropbox</span> where she led the redesign of the admin console.
                </p>
              </div>
            </Card>

            {/* Fit Score Card */}
            <Card className="bg-[#0047b3] border-none rounded-2xl shadow-[0_8px_30px_rgba(0,71,179,0.25)] p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h3 className="text-white font-bold text-[15px] mb-2 relative z-10">Candidate Fit Score</h3>
              
              <div className="flex items-baseline gap-1 mb-4 relative z-10">
                <span className="text-white text-6xl font-black tracking-tight">94</span>
                <span className="text-white/80 text-xl font-bold">%</span>
              </div>
              
              <p className="text-white/80 text-[12px] leading-relaxed font-medium relative z-10">
                Sarah's portfolio case studies align 92% with our current technical roadmap for Q3.
              </p>
            </Card>

            <div className="pt-2">
              <Button
                onClick={handleCompose}
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-6 rounded-xl text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                Compose Invite
                <Send className="h-4 w-4" />
              </Button>
              
              <button className="w-full mt-4 text-[#475569] hover:text-[#0A1128] text-[13px] font-bold transition-colors">
                Save Draft Template
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreeningSetup;
