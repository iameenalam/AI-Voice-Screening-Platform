import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, CheckCircle2, ArrowRight, FileText, 
  Sparkles, Shield, Check, Paperclip, Menu, ArrowLeft,
  Trash2, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

type CandidateEntry = {
  id: string;             // temp client-side ID
  fileName: string;
  status: 'uploading' | 'extracting' | 'extracted' | 'error';
  cvUrl: string | null;
  data: { name: string; role: string; email: string; fullRole?: string };
  extractedData: any;
  savedId: string | null;
  errorMsg?: string;
};

const UploadCV = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [candidates, setCandidates] = useState<CandidateEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'progress' | 'review'>('upload');
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const result = await api.getCandidates();
        if (result.data) {
          const recruiterUploads = result.data.filter((c: any) => c.isExternal === true);
          setRecentCandidates(recruiterUploads.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch recent candidates");
      }
    };
    fetchRecent();
  }, []);

  const { startUpload } = useUploadThing("cvUploader");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).slice(0, 50); // Enforce max 50 files
      
      const initialEntries: CandidateEntry[] = selectedFiles.map((file, idx) => ({
        id: `temp_${Date.now()}_${idx}`,
        fileName: file.name,
        status: 'uploading',
        cvUrl: null,
        data: { name: "", role: "", email: "" },
        extractedData: {},
        savedId: null
      }));

      setCandidates(initialEntries);
      setCurrentStep('progress');

      // Process sequentially for stable progress tracking and API load distribution
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const tempId = initialEntries[i].id;

        const updateCandidateStatus = (
          id: string,
          status: CandidateEntry['status'],
          updates?: Partial<Omit<CandidateEntry, 'id' | 'status'>>
        ) => {
          setCandidates(prev => prev.map(c => c.id === id ? { ...c, status, ...updates } : c));
        };

        try {
          // 1. Upload CV file to UploadThing
          const uploadRes = await startUpload([file]);
          if (!uploadRes || uploadRes.length === 0) {
            throw new Error("Upload failed");
          }
          const fileUrl = (uploadRes[0] as any).ufsUrl || uploadRes[0].url;

          updateCandidateStatus(tempId, 'extracting', { cvUrl: fileUrl });

          // 2. Call backend parser
          const result = await api.uploadCV(fileUrl, file.name);

          if (result.error) {
            const errMsg = typeof result.error === 'string' ? result.error : (result.error as any).error || 'Extraction failed';
            updateCandidateStatus(tempId, 'error', { errorMsg: errMsg });
            continue;
          }

          if (result.data) {
            const res = result.data as any;
            const data = res.data || {};

            updateCandidateStatus(tempId, 'extracted', {
              cvUrl: res.cvUrl || fileUrl,
              extractedData: data,
              data: {
                name: data.name || "",
                role: data.role || data.jobField || "",
                email: data.email || "",
                fullRole: data.fullRole || data.role || ""
              }
            });
          }
        } catch (err: any) {
          updateCandidateStatus(tempId, 'error', { errorMsg: err.message || "Upload/Extraction failed" });
        }
      }

      // Automatically transition to the review page after batch processing
      setCurrentStep('review');
    }
  };

  const updateCandidateField = (id: string, field: 'name' | 'role' | 'email', value: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        const updatedData = { ...c.data, [field]: value };
        let updatedStatus = c.status;
        // If candidate details are completely filled, upgrade status to extracted
        if (c.status === 'error' && updatedData.name.trim() && updatedData.role.trim() && updatedData.email.trim()) {
          updatedStatus = 'extracted';
        }
        return { ...c, data: updatedData, status: updatedStatus };
      }
      return c;
    }));
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleBackToUpload = () => {
    setCandidates([]);
    setCurrentStep('upload');
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();

    const readyCandidates = candidates.filter(c => c.status !== 'uploading' && c.status !== 'extracting');
    
    if (readyCandidates.length === 0) {
      toast.error("No candidates to submit");
      return;
    }

    // Validation: make sure Name, Role, Email are filled for all candidates being processed
    const invalidCandidates = readyCandidates.filter(c => !c.data.name.trim() || !c.data.role.trim() || !c.data.email.trim());
    if (invalidCandidates.length > 0) {
      toast.error(`Please complete the details for all candidates (e.g. ${invalidCandidates[0].fileName})`);
      return;
    }

    toast.info(`Creating ${readyCandidates.length} candidate profiles...`);
    const savedIds: string[] = [];
    const roles: string[] = [];
    const emails: string[] = [];
    const names: string[] = [];

    for (const c of readyCandidates) {
      const payload = {
        name: c.data.name.trim(),
        role: c.data.role.trim(),
        email: c.data.email.trim(),
        fullRole: c.data.fullRole || c.data.role.trim(),
        cvUrl: c.cvUrl || "",
        extractedData: c.extractedData || {}
      };

      const result = await api.createCandidate(payload);
      if (result.error) {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : (result.error as any).error || "Failed to create candidate";
        toast.error(`Failed to create candidate ${c.data.name}: ${errorMsg}`);
        return;
      }

      if (result.data) {
        const saved = result.data as any;
        savedIds.push(saved._id);
        roles.push(c.data.role.trim());
        emails.push(c.data.email.trim());
        names.push(c.data.name.trim());
      }
    }

    if (savedIds.length === 0) {
      toast.error("No candidates were successfully saved.");
      return;
    }

    toast.success(`${savedIds.length} candidate(s) created!`);

    // Maintain currentCandidateId for backward compatibility
    localStorage.setItem('currentCandidateId', savedIds[0]);

    if (savedIds.length === 1) {
      navigate("/screening-setup", {
        state: {
          candidateId: savedIds[0],
          role: roles[0],
          name: names[0],
          email: emails[0],
          cvUrl: readyCandidates[0].cvUrl || ""
        }
      });
    } else {
      navigate("/screening-setup", {
        state: {
          candidateIds: savedIds,
          isBatch: true,
          role: "Multiple Roles",
          name: `Batch: ${savedIds.length} Candidates`
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex font-sans">
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
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
              onClick={() => navigate('/candidate-pool')} 
              className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0A1128] font-bold text-xs uppercase tracking-wider mb-8"
            >
              <ArrowLeft className="h-4 w-4" /> Back to candidates
            </button>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-black text-[#0A1128]">Add Candidates</h1>
              <p className="text-xs text-[#64748B] font-semibold mt-1">Upload CVs and let Vocalent AI parse, extract, and rank candidates automatically.</p>
            </div>

            {/* Upload Card */}
            <Card className="bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {currentStep === 'upload' && (
                <>
                  <div className="p-8">
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

                  {recentCandidates.length > 0 && (
                    <div className="px-8 mt-4 mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Recently Uploaded</span>
                      </div>
                      <div className="space-y-2">
                        {recentCandidates.map((c, i) => (
                          <div key={c._id || i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-transparent">
                            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">
                              <FileText className="h-4 w-4 text-[#0066FF]" />
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#0A1128]">{c.name || 'Unknown'} - {c.role || c.jobField || 'Candidate'}</div>
                              <div className="text-[11px] text-[#64748B] font-medium mt-0.5">{c.email || 'No email provided'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {currentStep === 'progress' && (
                <>
                  <div className="p-8 pb-6 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-[#0A1128]">Upload Progress</h2>
                      <p className="text-[13px] text-[#64748B] mt-1 font-medium">
                        Processing {candidates.filter(c => c.status === 'extracted' || c.status === 'error').length} of {candidates.length} files.
                      </p>
                    </div>
                  </div>

                  <div className="px-8 space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {candidates.map((c) => (
                      <div key={c.id} className="p-4 bg-white border border-[#E2E8F0] rounded-xl relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shrink-0">
                              <FileText className="h-4 w-4 text-[#64748B]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold text-[#0A1128] truncate">{c.fileName}</div>
                              <div className="text-[10px] font-bold text-[#64748B] uppercase mt-0.5">
                                {c.status === 'uploading' && 'Uploading file...'}
                                {c.status === 'extracting' && 'Extracting details...'}
                                {c.status === 'extracted' && 'Extracted successfully'}
                                {c.status === 'error' && 'Error parsing file'}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            {c.status === 'uploading' && (
                              <span className="text-[12px] font-bold text-[#0066FF] animate-pulse">Uploading</span>
                            )}
                            {c.status === 'extracting' && (
                              <span className="text-[12px] font-bold text-[#D97706] animate-pulse">Extracting</span>
                            )}
                            {c.status === 'extracted' && (
                              <span className="text-[12px] font-bold text-[#10B981] flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </span>
                            )}
                            {c.status === 'error' && (
                              <span className="text-[12px] font-bold text-[#EF4444] flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> Error
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 bg-[#F1F5F9] w-full">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              c.status === 'uploading' ? 'bg-[#0066FF] w-1/3 animate-pulse' :
                              c.status === 'extracting' ? 'bg-[#D97706] w-2/3 animate-pulse' :
                              c.status === 'extracted' ? 'bg-[#10B981] w-full' :
                              'bg-[#EF4444] w-full'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-8 mt-6">
                    <div className="bg-[#FFF7ED] rounded-xl p-3.5 flex items-center gap-3 border border-[#FFEDD5]">
                      <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse shrink-0"></div>
                      <span className="text-[12px] text-[#7C2D12] font-medium">
                        Syncing with <strong className="font-semibold text-[#0A1128]">Vocalent Cloud</strong>. Please do not close this window.
                      </span>
                    </div>
                  </div>

                  <div className="px-8 py-5 mt-6 flex items-center justify-end gap-3 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-[20px]">
                    <button disabled className="text-[13px] font-bold text-[#94A3B8] bg-[#E2E8F0] px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed">
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {currentStep === 'review' && (
                <form onSubmit={handleSubmitAll} className="flex flex-col h-full">
                  <div className="p-8 pb-4 border-b border-[#F1F5F9]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                        </div>
                        <h2 className="text-xl font-bold text-[#0A1128]">Review Profiles</h2>
                      </div>
                      <span className="text-xs font-bold text-[#475569] bg-[#E2E8F0] px-2.5 py-1 rounded-full">
                        {candidates.length} Candidate(s)
                      </span>
                    </div>
                    <p className="text-[13px] text-[#64748B] font-medium mt-2">
                      Review and complete extracted candidate details before setting up the interview.
                    </p>
                  </div>

                  <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
                    {candidates.map((c) => (
                      <div 
                        key={c.id} 
                        className={`p-6 border rounded-2xl relative transition-all ${
                          c.status === 'error' ? 'border-[#FEE2E2] bg-[#FEF2F2]/30' : 'border-[#E2E8F0] bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4.5 w-4.5 text-[#0066FF] shrink-0" />
                            <span className="text-[13px] font-bold text-[#475569] truncate" title={c.fileName}>
                              {c.fileName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCandidate(c.id)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors shrink-0"
                            title="Remove Candidate"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {c.status === 'error' && (
                          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl flex items-start gap-2.5 text-[#B91C1C]">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="text-[11px] font-semibold leading-relaxed">
                              Could not extract details automatically. Please enter details manually below to keep this candidate.
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor={`name-${c.id}`} className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Candidate Name</Label>
                            <Input
                              id={`name-${c.id}`}
                              value={c.data.name}
                              onChange={(e) => updateCandidateField(c.id, 'name', e.target.value)}
                              className="bg-white border-[#E2E8F0] rounded-xl text-[13px] font-semibold py-4.5 focus:border-[#0066FF]"
                              placeholder="e.g. Ahmed Khan"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`role-${c.id}`} className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Role / Job Field</Label>
                            <Input
                              id={`role-${c.id}`}
                              value={c.data.role}
                              onChange={(e) => updateCandidateField(c.id, 'role', e.target.value)}
                              className="bg-white border-[#E2E8F0] rounded-xl text-[13px] font-semibold py-4.5 focus:border-[#0066FF]"
                              placeholder="e.g. Senior Developer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`email-${c.id}`} className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</Label>
                            <Input
                              id={`email-${c.id}`}
                              type="email"
                              value={c.data.email}
                              onChange={(e) => updateCandidateField(c.id, 'email', e.target.value)}
                              className="bg-white border-[#E2E8F0] rounded-xl text-[13px] font-semibold py-4.5 focus:border-[#0066FF]"
                              placeholder="name@company.com"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-8 py-5 mt-auto flex gap-3 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-[20px]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToUpload}
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
        </div>
      </main>
    </div>
  );
};

export default UploadCV;

