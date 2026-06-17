import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, CheckCircle2, ArrowRight, X, FileText, 
  Sparkles, Shield, Check, Paperclip 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

const UploadCV = () => {
  const navigate = useNavigate();
  const [extracted, setExtracted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [candidateData, setCandidateData] = useState({
    name: "",
    role: "",
    email: "",
  });
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [extractedData, setRawExtractedData] = useState<any>(null);
  const [fullRole, setFullRole] = useState("");
  const [showFullRole, setShowFullRole] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  const { startUpload } = useUploadThing("cvUploader");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      setUploadFileName(file.name);
      
      try {
        const uploadRes = await startUpload([file]);
        if (!uploadRes || uploadRes.length === 0) {
          throw new Error("Upload failed");
        }
        
        const fileUrl = (uploadRes[0] as any).ufsUrl || uploadRes[0].url;
        const result = await api.uploadCV(fileUrl, file.name);
      
        if (result.error) {
          const errMsg = typeof result.error === 'string' ? result.error : (result.error as any).error || 'Upload failed';
          toast.error(errMsg + " - Please enter details manually.");
          setCandidateData({ name: "", role: "", email: "" });
          setFullRole("");
          setRawExtractedData({});
          setExtracted(true);
          setUploading(false);
          return;
        }

        if (result.data) {
          const res = result.data as any;
          const data = res.data || {};
          const hasData = data.name || data.email;
          
          setCandidateData({
            name: data.name || "",
            role: data.role || "",
            email: data.email || "",
          });
          
          if (res.cvUrl) setCvUrl(res.cvUrl);
          setRawExtractedData(data);
          
          if (data.fullRole && data.fullRole !== data.role) {
            setFullRole(data.fullRole);
          }
          
          setExtracted(true);
          
          if (hasData) {
            toast.success("Contact details extracted successfully!");
          } else {
            toast.warning("Could not extract all data. Please complete the fields manually.");
          }
        }
        
        setUploading(false);
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateData.name || !candidateData.role || !candidateData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    const candidatePayload = {
      ...candidateData,
      fullRole: fullRole || candidateData.role,
      cvUrl: cvUrl || "",
      extractedData: extractedData || {},
    };

    const result = await api.createCandidate(candidatePayload);
    
    if (result.error) {
      const errorMsg = typeof result.error === 'string' 
        ? result.error 
        : (result.error as any).error || "Failed to create candidate";
      toast.error(errorMsg);
      return;
    }

    if (result.data) {
      const data = result.data as any;
      setCandidateId(data._id);
      localStorage.setItem('currentCandidateId', data._id);
      navigate("/screening-setup", { 
        state: { 
          candidateId: data._id, 
          role: fullRole || candidateData.role,
          name: candidateData.name || data.name,
          cvUrl: cvUrl || data.cvUrl
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen flex items-center justify-center p-4 relative">
        <div className="w-full max-w-[550px]">
          <Card className="bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {!uploading && !extracted && (
              <>
                {/* Header Image 1 */}
                <div className="p-8 pb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-[#0A1128]">Bulk CV Upload</h2>
                    <p className="text-[13px] text-[#64748B] mt-1 font-medium">Enhance your candidate pool with AI-driven CV parsing.</p>
                  </div>
                  <button onClick={() => navigate('/dashboard')} className="text-[#94A3B8] hover:text-[#0A1128] transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Dropzone Image 1 */}
                <div className="px-8">
                  <Label htmlFor="cv-upload" className="cursor-pointer block border-2 border-dashed border-[#E2E8F0] hover:border-[#0066FF] hover:bg-[#F8FAFC] transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center text-[#0066FF] mb-4">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#0A1128] mb-1">Drop CVs here to start</h3>
                    <p className="text-[13px] text-[#64748B] mb-5">Select up to 50 PDF or DOCX files</p>
                    <span className="px-5 py-2 bg-white border border-[#E2E8F0] text-[#0066FF] text-[13px] font-bold rounded-xl shadow-sm inline-block">
                      Browse Files
                    </span>
                    <Input id="cv-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleFileUpload} />
                  </Label>
                </div>

                {/* Recently Uploaded Image 1 */}
                <div className="px-8 mt-8 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Recently Uploaded</span>
                    <span className="text-[11px] font-bold text-[#0066FF]">4 files ready</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-transparent">
                      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">
                        <FileText className="h-4 w-4 text-[#0066FF]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#0A1128]">Alex_Chen_Senior_Dev.pdf</div>
                        <div className="text-[11px] text-[#64748B] font-medium mt-0.5">1.2 MB • Processing Match Score...</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-transparent">
                      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">
                        <FileText className="h-4 w-4 text-[#0066FF]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#0A1128]">Sarah_Miller_UX_Resume.docx</div>
                        <div className="text-[11px] text-[#64748B] font-medium mt-0.5">840 KB • Metadata verified</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#FFF7ED] rounded-xl border border-[#FFEDD5]">
                      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">
                        <Sparkles className="h-4 w-4 text-[#EA580C]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#0A1128] flex items-center gap-2">
                          Marketing_Lead_2024.pdf <div className="w-1.5 h-1.5 rounded-full bg-[#BFDBFE]"></div>
                        </div>
                        <div className="text-[11px] font-bold text-[#C2410C] mt-0.5">Vocalent AI: Top 5% Candidate detected</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Image 1 */}
                <div className="px-8 py-5 mt-4 flex items-center justify-between border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-medium">
                    <Shield className="h-4 w-4 text-[#94A3B8]" />
                    All files are encrypted and processed securely.
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="text-[13px] font-bold text-[#0A1128] px-4 py-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
                      Cancel
                    </button>
                    <Label htmlFor="cv-upload" className="text-[13px] font-bold text-white bg-[#0066FF] hover:bg-[#0052CC] px-6 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer">
                      Upload Files
                    </Label>
                  </div>
                </div>
              </>
            )}

            {uploading && (
              <>
                {/* Header Image 2 */}
                <div className="p-8 pb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-[#0A1128]">Upload Progress</h2>
                    <p className="text-[13px] text-[#64748B] mt-1 font-medium">Processing candidate profiles and documentation.</p>
                  </div>
                  <button className="text-[#94A3B8] hover:text-[#0A1128] transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-8 space-y-4">
                  {/* Completed 1 */}
                  <div className="p-4 bg-white border-2 border-[#0066FF] rounded-xl relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                          <FileText className="h-5 w-5 text-[#0066FF]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#0A1128]">resume_ahmed_khan.pdf</div>
                          <div className="text-[11px] font-bold text-[#64748B] mt-0.5">1.2 MB • <span className="text-[#0A1128]">COMPLETED</span></div>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-[#0066FF] w-full"></div>
                  </div>

                  {/* Completed 2 */}
                  <div className="p-4 bg-white border-2 border-[#0066FF] rounded-xl relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                          <FileText className="h-5 w-5 text-[#0066FF]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#0A1128]">cv_sarah_ali.docx</div>
                          <div className="text-[11px] font-bold text-[#64748B] mt-0.5">840 KB • <span className="text-[#0A1128]">COMPLETED</span></div>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-[#0066FF] w-full"></div>
                  </div>

                  {/* Uploading */}
                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                          <FileText className="h-5 w-5 text-[#64748B]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#0A1128]">{uploadFileName || "portfolio_jane_doe.pdf"}</div>
                          <div className="text-[11px] font-bold text-[#64748B] mt-0.5">4.8 MB • UPLOADING...</div>
                        </div>
                      </div>
                      <div className="text-[13px] font-bold text-[#0066FF]">45%</div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-[#F1F5F9] w-full mt-3">
                      <div className="h-full bg-[#0066FF] w-[45%] rounded-r-full transition-all duration-500"></div>
                    </div>
                  </div>

                  {/* Waiting */}
                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                          <Paperclip className="h-5 w-5 text-[#64748B]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#0A1128]">certifications_pack.zip</div>
                          <div className="text-[11px] font-bold text-[#64748B] mt-0.5">12.4 MB • WAITING</div>
                        </div>
                      </div>
                      <div className="text-[13px] font-bold text-[#0A1128]">0%</div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-[#F1F5F9] w-full mt-3">
                      <div className="h-full bg-[#0066FF] w-[5%] rounded-r-full"></div>
                    </div>
                  </div>
                </div>

                <div className="px-8 mt-6">
                  <div className="bg-[#FFF7ED] rounded-xl p-3 flex items-center gap-3 border border-transparent">
                    <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse"></div>
                    <span className="text-[12px] text-[#0A1128]">
                      Syncing with <strong className="font-bold">Vocalent Cloud</strong>. Please do not close this window.
                    </span>
                  </div>
                </div>

                {/* Footer Image 2 */}
                <div className="px-8 py-5 mt-6 flex items-center justify-end gap-3 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-[20px]">
                  <button className="text-[13px] font-bold text-[#0A1128] px-4 py-2 hover:bg-[#E2E8F0] rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button disabled className="text-[13px] font-bold text-[#94A3B8] bg-[#E2E8F0] px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {extracted && !uploading && (
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Header for Extracted state */}
                <div className="p-8 pb-4 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0A1128]">Profile Extracted</h2>
                  </div>
                  <p className="text-[13px] text-[#64748B] font-medium ml-11">Review details for {candidateData.name || "the candidate"} before matching.</p>
                </div>

                <div className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Candidate Name</Label>
                    <Input
                      id="name"
                      value={candidateData.name}
                      onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value })}
                      className="bg-white border-[#E2E8F0] rounded-xl text-[14px] font-semibold py-5 focus:border-[#0066FF]"
                      placeholder="e.g. Ahmed Khan"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="role" className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Target Job Field / Role</Label>
                      {fullRole && fullRole !== candidateData.role && (
                        <button
                          type="button"
                          onClick={() => setShowFullRole(!showFullRole)}
                          className="text-[11px] font-bold text-[#0066FF] hover:underline"
                        >
                          {showFullRole ? "Show Less" : "Show Full Description"}
                        </button>
                      )}
                    </div>
                    {showFullRole && fullRole ? (
                      <div className="space-y-2">
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] leading-relaxed font-medium text-[#475569]">
                          {fullRole}
                        </div>
                        <Input
                          id="role"
                          value={candidateData.role}
                          onChange={(e) => setCandidateData({ ...candidateData, role: e.target.value })}
                          className="bg-white border-[#E2E8F0] rounded-xl text-[14px] font-semibold py-5 focus:border-[#0066FF]"
                        />
                      </div>
                    ) : (
                      <Input
                        id="role"
                        value={candidateData.role}
                        onChange={(e) => setCandidateData({ ...candidateData, role: e.target.value })}
                        className="bg-white border-[#E2E8F0] rounded-xl text-[14px] font-semibold py-5 focus:border-[#0066FF]"
                        placeholder="e.g. Senior Frontend Engineer"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={candidateData.email}
                      onChange={(e) => setCandidateData({ ...candidateData, email: e.target.value })}
                      className="bg-white border-[#E2E8F0] rounded-xl text-[14px] font-semibold py-5 focus:border-[#0066FF]"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="px-8 py-5 mt-auto flex gap-3 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-[20px]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setExtracted(false)}
                    className="flex-1 border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0A1128] font-bold text-[13px] py-6 rounded-xl transition-colors"
                  >
                    Back to Upload
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[13px] py-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    Setup Questions
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UploadCV;
