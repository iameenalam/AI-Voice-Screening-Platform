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
import { Logo } from "@/components/Logo";
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
  const isBatch = location.state?.isBatch;

  // For batch preview, mock a candidate name instead of displaying "Batch..."
  const previewName = isBatch ? 'Sarah Jenkins' : name;
  const previewFirstName = previewName.split(' ')[0] || 'Sarah';
  const firstName = isBatch ? '{{firstName}}' : (name.split(' ')[0] || 'Sarah');
  const questions = location.state?.questions || [];
  
  const email = location.state?.email || '';
  const mockEmail = isBatch ? 'sarah.jenkins@example.com' : (email || `${firstName.toLowerCase()}.${name.split(' ').slice(1).join('').toLowerCase() || 'jenkins'}@designmail.com`);
  const mockUrl = isBatch ? `vocalent.io/i/batch-${Math.floor(Math.random()*10000)}` : `vocalent.io/i/${role.split(' ').map((w: string) => w[0]).join('').toLowerCase()}-${candidateId?.substring(0,4) || '8021'}-${name.split(' ').slice(-1)[0].toLowerCase() || 'jenkins'}`;

  const previewRole = isBatch ? 'Senior UI Designer' : role;

  const defaultSubject = isBatch 
    ? `Interview Invitation: {{role}} at Vocalent`
    : `Interview Invitation: ${role} at Vocalent`;

  const defaultMessage = isBatch 
    ? `Hello {{firstName}},

You've been invited to interview for the {{role}} position at Vocalent.

We'd love to discuss how your expertise could help shape our next generation of screening tools.

This will be a 45-minute technical discussion followed by a culture fit session.`
    : `Hello ${firstName},

You've been invited to interview for the ${role} position at Vocalent.

We were incredibly impressed by your portfolio, particularly your work on the adaptive design systems. We'd love to discuss how your expertise in cognitive-focused UI could help shape our next generation of recruitment tools.

This will be a 45-minute technical discussion followed by a culture fit session.`;

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);

  const previewSubject = subject
    .replace(/{{name}}/g, previewName)
    .replace(/{{firstName}}/g, previewFirstName)
    .replace(/{{role}}/g, previewRole)
    .replace(/{{jobField}}/g, previewRole);

  const previewMessage = message
    .replace(/{{name}}/g, previewName)
    .replace(/{{firstName}}/g, previewFirstName)
    .replace(/{{role}}/g, previewRole)
    .replace(/{{jobField}}/g, previewRole);

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
      navigate("/candidate-pool"); // Assuming applications is the Candidate Pool
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex font-sans">
      <Sidebar 
        isOpenMobile={isMobileMenuOpen} 
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Navbar with centered logo */}
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-10">
        <div className="max-w-[1200px] mx-auto w-full">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center text-[10px] font-bold text-[#64748B] tracking-widest uppercase mb-3">
              <span className="cursor-pointer hover:text-[#0A1128]" onClick={() => navigate('/candidate-pool')}>INTERVIEWS</span> 
              <ChevronRight className="h-3 w-3 mx-2" /> 
              <span className="text-[#0A1128]">INVITE CANDIDATE</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0A1128] tracking-tight">Send Interview Invite</h1>
            <p className="text-[14px] text-[#64748B] mt-2 font-medium">
              {isBatch ? (
                <>
                  Craft personalized invitations for your batch of candidates. Use <code className="bg-[#E2E8F0] px-1.5 py-0.5 rounded font-mono text-xs font-bold text-[#0052CC]">{`{{firstName}}`}</code>, <code className="bg-[#E2E8F0] px-1.5 py-0.5 rounded font-mono text-xs font-bold text-[#0052CC]">{`{{name}}`}</code>, or <code className="bg-[#E2E8F0] px-1.5 py-0.5 rounded font-mono text-xs font-bold text-[#0052CC]">{`{{role}}`}</code> to dynamically insert candidate details.
                </>
              ) : (
                <>
                  Craft a personalized invitation for {name}. Your AI assistant has pre-filled this <br />
                  based on the {role} role requirements.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10 items-start">
            
            {/* Left Column: Editor */}
            <div>
              <Card className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none p-8">
                <h2 className="text-xl font-extrabold text-[#0A1128] mb-8">Compose Invite</h2>
                
                <div className="space-y-6">
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
                  </div>

                  <Button 
                    onClick={handleSendInvite}
                    disabled={loading}
                    className="w-full bg-[#0052CC] hover:bg-[#0047b3] text-white font-bold py-6 rounded-xl text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors mt-6"
                  >
                    {loading ? "Sending..." : "Send Invite Now"}
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Preview */}
            <div>
              <div className="flex items-center justify-between mb-4 px-2 h-8 shrink-0">
                <span className="text-[11px] font-bold text-[#64748B] tracking-widest uppercase">Inbox Preview</span>
              </div>

              <Card className="bg-white rounded-[20px] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border-none overflow-hidden">
                {/* Mock Browser Header */}
                <div className="bg-[#EEF2FF] px-4 py-3 flex items-center gap-4 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="flex-1 bg-white/70 rounded-md py-1.5 px-3 text-[10px] text-[#94A3B8] font-medium text-center truncate">
                    https://mail.google.com/u/0/#inbox/{previewName.split(' ')[0].toLowerCase()}-{previewName.split(' ').slice(-1)[0].toLowerCase() || 'jenkins'}
                  </div>
                </div>

                {/* Email Content */}
                <div className="p-10">
                  <div>
                    <div className="mb-10">
                      <div className="text-[15px] font-bold text-[#0A1128]">{previewSubject}</div>
                      <div className="text-[12px] text-[#64748B] mt-1">
                        <span className="font-semibold text-[#0A1128]">Vocalent Recruitment</span> to {mockEmail}
                      </div>
                    </div>

                    <div className="text-[14px] text-[#334155] leading-[1.8] space-y-5 whitespace-pre-wrap">
                      {previewMessage}
                    </div>

                    <div className="mt-12 mb-12">
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
                  </div>

                  <div className="border-t border-[#F1F5F9] pt-8 shrink-0">
                    <div className="text-[13px] text-[#64748B]">
                      Best regards,<br />
                      The Vocalent Recruitment Team
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default ComposeInvite;
