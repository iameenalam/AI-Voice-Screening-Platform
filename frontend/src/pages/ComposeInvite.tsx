import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Copy, Send, CheckCircle2, ChevronRight,
  Monitor, Smartphone, Menu
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ComposeInvite = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Extract from state
  const candidateId = location.state?.candidateId || localStorage.getItem('currentCandidateId');
  const role = location.state?.role || 'Senior UI Designer';
  const name = location.state?.name || 'Sarah Jenkins';
  const firstName = name.split(' ')[0] || 'Sarah';
  const questions = location.state?.questions || [];
  
  const isBatch = location.state?.isBatch;
  const mockEmail = isBatch ? 'candidate@example.com' : `${firstName.toLowerCase()}.${name.split(' ').slice(1).join('').toLowerCase() || 'jenkins'}@designmail.com`;
  const mockUrl = isBatch ? `vocalent.io/i/batch-${Math.floor(Math.random()*10000)}` : `vocalent.io/i/${role.split(' ').map((w: string) => w[0]).join('').toLowerCase()}-${candidateId?.substring(0,4) || '8021'}-${name.split(' ').slice(-1)[0].toLowerCase() || 'jenkins'}`;

  const defaultSubject = `Interview Invitation: ${role} at Vocalent`;
  const defaultMessage = `Hello ${firstName},

You've been invited to interview for the ${role} position at Vocalent.

We were incredibly impressed by your portfolio, particularly your work on the adaptive design systems. We'd love to discuss how your expertise in cognitive-focused UI could help shape our next generation of recruitment tools.

This will be a 45-minute technical discussion followed by a culture fit session.`;

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${mockUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Interview link copied to clipboard");
  };

  const candidateIds = location.state?.candidateIds || [];

  const handleSendInvite = async () => {
    if (!isBatch && !candidateId) {
      toast.error("Candidate information missing. Please go back and select a candidate.");
      return;
    }
    if (isBatch && (!candidateIds || candidateIds.length === 0)) {
      toast.error("Batch candidates missing. Please go back and select candidates.");
      return;
    }

    setLoading(true);
    let result;
    
    if (isBatch) {
      result = await api.batchSendInvites(candidateIds, questions, subject, message);
    } else {
      result = await api.sendInterviewInvite(candidateId, questions, subject, message);
    }
    
    setLoading(false);

    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || "Failed to send invitation";
      toast.error(errMsg);
    } else if (result.data) {
      if (result.data.emailFailed) {
        toast.warning(`Interview created but email failed. Link: ${result.data.interviewLink}`);
      } else {
        toast.success(result.data.message || (isBatch ? "Invitations sent successfully!" : "Interview invitation sent successfully!"));
      }
      navigate("/"); // Assuming applications is the Candidate Pool
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex font-sans">
      <Sidebar 
        isOpenMobile={isMobileMenuOpen} 
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />

      <main className="flex-1 overflow-y-auto h-screen relative flex flex-col">
        {/* Top Navbar */}
        <nav className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-4 flex items-center justify-between shadow-sm shrink-0 gap-4">
          <button 
            className="md:hidden text-[#64748B] hover:text-[#0A1128]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1">
            <div className="relative max-w-xl">
              <span className="absolute left-3.5 top-2.5 text-[#94A3B8] text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search candidates or jobs..."
                className="w-full bg-[#F1F5F9]/60 border-none rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#E2E8F0]"
              />
            </div>
          </div>
          <div className="flex items-center gap-5 text-[#64748B]">
            <span className="cursor-pointer hover:text-[#0A1128]">🔔</span>
            <span className="cursor-pointer hover:text-[#0A1128]">❓</span>
          </div>
        </nav>

        <div className="p-10 max-w-[1200px] mx-auto w-full">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center text-[10px] font-bold text-[#64748B] tracking-widest uppercase mb-3">
              <span className="cursor-pointer hover:text-[#0A1128]" onClick={() => navigate('/candidate-pool')}>INTERVIEWS</span> 
              <ChevronRight className="h-3 w-3 mx-2" /> 
              <span className="text-[#0A1128]">INVITE CANDIDATE</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0A1128] tracking-tight">Send Interview Invite</h1>
            <p className="text-[14px] text-[#64748B] mt-2 font-medium">
              Craft a personalized invitation for {name}. Your AI assistant has pre-filled this <br />
              based on the {role} role requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10">
            
            {/* Left Column: Editor */}
            <div className="space-y-6">
              <Card className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none p-8">
                <h2 className="text-xl font-extrabold text-[#0A1128] mb-8">Compose Invite</h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-[#475569] tracking-widest uppercase">Email Subject</Label>
                    <Input 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-[#F8FAFC] border-none rounded-xl text-[13px] font-semibold py-6 focus:ring-1 focus:ring-[#E2E8F0] shadow-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-[#475569] tracking-widest uppercase">Message Body</Label>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FFF7ED] rounded text-[#C2410C]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></div>
                        <span className="text-[9px] font-bold tracking-widest uppercase">AI Enhanced</span>
                      </div>
                    </div>
                    <Textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-[#F8FAFC] border-none rounded-xl text-[13px] font-medium leading-relaxed py-4 min-h-[280px] focus:ring-1 focus:ring-[#E2E8F0] shadow-none resize-none"
                    />
                  </div>

                  <div className="bg-[#F8FAFC] rounded-xl p-4 flex items-center justify-between border border-[#E2E8F0]">
                    <div>
                      <div className="text-[11px] font-bold text-[#0066FF] mb-1">Unique Interview Link</div>
                      <div className="text-[11px] text-[#64748B] font-medium font-mono">{mockUrl}</div>
                    </div>
                    <button 
                      onClick={handleCopyLink}
                      className="w-8 h-8 rounded-lg hover:bg-[#E2E8F0] flex items-center justify-center text-[#475569] transition-colors"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button 
                    onClick={handleSendInvite}
                    disabled={loading}
                    className="w-full bg-[#0052CC] hover:bg-[#0047b3] text-white font-bold py-6 rounded-xl text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors mt-4"
                  >
                    {loading ? "Sending..." : "Send Invite Now"}
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Preview */}
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-[11px] font-bold text-[#64748B] tracking-widest uppercase">Inbox Preview</span>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] flex items-center justify-center text-[#0A1128]">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div className="w-8 h-8 rounded-lg hover:bg-[#E2E8F0] flex items-center justify-center text-[#94A3B8] transition-colors">
                    <Smartphone className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <Card className="bg-white rounded-[20px] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border-none overflow-hidden">
                {/* Mock Browser Header */}
                <div className="bg-[#EEF2FF] px-4 py-3 flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="flex-1 bg-white/70 rounded-md py-1.5 px-3 text-[10px] text-[#94A3B8] font-medium text-center">
                    https://mail.google.com/u/0/#inbox/{name.split(' ')[0].toLowerCase()}-{name.split(' ').slice(-1)[0].toLowerCase() || 'jenkins'}
                  </div>
                </div>

                {/* Email Content */}
                <div className="p-10">
                  <div className="mb-10">
                    <div className="text-[15px] font-bold text-[#0A1128]">Vocalent Recruitment</div>
                    <div className="text-[12px] text-[#64748B]">to {mockEmail}</div>
                  </div>

                  <div className="text-[14px] text-[#334155] leading-[1.8] space-y-5 whitespace-pre-wrap">
                    {message}
                  </div>

                  <div className="mt-12 mb-16">
                    <div className="bg-[#F8FAFC] rounded-2xl p-8 flex flex-col items-center text-center">
                      <div className="text-[13px] font-bold text-[#0A1128] mb-5">Ready to begin your journey?</div>
                      <button className="bg-[#0047b3] text-white font-bold py-3.5 px-8 rounded-xl text-[14px] shadow-md hover:bg-[#003399] transition-colors mb-4">
                        Take Interview
                      </button>
                      <div className="text-[10px] text-[#64748B] max-w-[250px] leading-relaxed">
                        Clicking this button will open our secure interview portal. Ensure your camera and microphone are ready.
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#F1F5F9] pt-8">
                    <div className="text-[13px] text-[#64748B]">
                      Best regards,<br />
                      The Vocalent Recruitment Team
                    </div>
                    
                    <div className="mt-10 pt-6 border-t border-[#F1F5F9] text-center space-y-3">
                      <div className="flex justify-center gap-4 text-[11px] text-[#94A3B8] font-medium">
                        <a href="#" className="hover:underline">Privacy Policy</a>
                        <a href="#" className="hover:underline">Unsubscribe</a>
                      </div>
                      <div className="text-[9px] text-[#CBD5E1]">
                        Vocalent Technologies Inc. • 500 Silicon Way, Palo Alto, CA
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ComposeInvite;
