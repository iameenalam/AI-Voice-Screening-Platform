import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, CheckCircle2, Check, Loader2, Building, Briefcase, Mail, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import ReactMarkdown from 'react-markdown';

const JOB_FIELDS = [
  "Software Engineering",
  "Data Science & AI",
  "Product Management",
  "Design & UX",
  "Marketing & Sales",
  "Human Resources",
  "Finance & Operations",
  "Customer Success",
  "Other"
];

const Apply = () => {
  const navigate = useNavigate();
  const [extracted, setExtracted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const { startUpload } = useUploadThing("cvUploader");

  const [candidateData, setCandidateData] = useState({
    name: "",
    email: "",
    selectedJobId: "",
  });

  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get('company');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);
        const result = await api.getPublicJobs();
        if (result.error) {
          console.error("Failed to fetch jobs:", result.error);
        } else if (result.data) {
          let loadedJobs = result.data;
          if (companyParam) {
            loadedJobs = loadedJobs.filter((j: any) => j.company === companyParam);
          }
          setJobs(loadedJobs);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, [companyParam]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCvFile(file);
      setExtracted(true);
      toast.success("CV attached successfully!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateData.name || !candidateData.email || !candidateData.selectedJobId || !cvFile) {
      toast.error("Please fill in all required fields and upload your CV");
      return;
    }

    setSubmitting(true);

    try {
      const uploadRes = await startUpload([cvFile]);
      if (!uploadRes || uploadRes.length === 0) {
        throw new Error("CV upload failed");
      }
      
      const fileUrl = (uploadRes[0] as any).ufsUrl || uploadRes[0].url;
      const selectedJob = jobs.find(j => j._id === candidateData.selectedJobId);

      const applicationData = {
        name: candidateData.name,
        email: candidateData.email,
        appliedCompany: selectedJob?.company || 'Unknown',
        jobField: selectedJob?.title || 'General Application',
        cvUrl: fileUrl,
      };

      const result = await api.publicApply(applicationData);
      
      setSubmitting(false);

      if (result.error) {
        toast.error(typeof result.error === 'string' ? result.error : (result.error as any).error || 'Application failed');
        return;
      }

      // Show thank you page
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Application failed");
      setSubmitting(false);
    }
  };

  // Thank you screen after successful submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans relative">
        {/* Sidebar strip */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#1E293B]"></div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center max-w-lg w-full shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-[#E2E8F0] relative overflow-hidden">
            
            {/* Faint background check */}
            <CheckCircle2 className="absolute top-10 right-10 h-24 w-24 text-[#F1F5F9] -z-10" />

            <div className="w-16 h-16 mx-auto bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#0047b3] mb-8 relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#0047b3] flex items-center justify-center text-white">
                <Check className="h-4 w-4 stroke-[3px]" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-[#0A1128] mb-2 relative z-10">
              Thank You for Applying!
            </h1>
            
            <p className="text-[15px] text-[#475569] leading-relaxed mb-8 relative z-10">
              Your application has been submitted successfully.
            </p>

            <div className="space-y-6 text-left relative z-10 border-t border-[#E2E8F0] pt-6">
              <div>
                <h3 className="font-bold text-[#0A1128] text-[15px] mb-1">We'll be in touch</h3>
                <p className="text-[14px] text-[#475569] leading-relaxed">
                  Our team will review your application and reach out via email at <span className="font-semibold text-[#0A1128]">{candidateData.email}</span>
                </p>
              </div>

              <div className="border-t border-[#E2E8F0] pt-6">
                <h3 className="font-bold text-[#0A1128] text-[15px] mb-1">AI-Powered Interview</h3>
                <p className="text-[14px] text-[#475569] leading-relaxed">
                  If selected, you'll receive an interview link via email. The interview is voice-based and takes about 45 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      
      <nav className="sticky top-0 w-full z-50 bg-white border-b border-[#E2E8F0] shadow-sm relative">
        <div className="w-full px-4 md:px-8 py-3 flex items-center justify-center">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
        </div>
      </nav>
      
      <div className="flex-1 flex items-center justify-center relative z-10 py-12">
        <div className="w-full px-4 md:px-8">
          <div className="w-full mx-auto">
            <div className="mb-6 md:mb-8 animate-fade-in text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#0F172A]">
                Submit Your Application
              </h1>
              <p className="text-sm md:text-base text-[#64748B]">
                Apply for your dream role. Upload your CV and we'll review your application!
              </p>
            </div>

            <Card className="p-4 md:p-8 flex-1 bg-white border-0 shadow-none animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold text-[#0F172A]">Available Roles</Label>
                    {!loadingJobs && (
                      <span className="text-xs text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                        {jobs.length} {jobs.length === 1 ? 'Opening' : 'Openings'}
                      </span>
                    )}
                  </div>
                  
                  {loadingJobs ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-4 rounded-xl border-2 border-[#E2E8F0] h-24 animate-pulse flex flex-col justify-between">
                          <div className="h-4 bg-[#E2E8F0] rounded-md w-3/4"></div>
                          <div className="h-3 bg-[#E2E8F0] rounded-md w-1/2"></div>
                          <div className="h-4 bg-[#E2E8F0] rounded-md w-1/4 mt-1"></div>
                        </div>
                      ))}
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <Briefcase className="h-8 w-8 text-[#94A3B8] mx-auto mb-3" />
                      <p className="text-sm text-[#475569] font-medium">No open roles available at the moment.</p>
                      <p className="text-xs text-[#94A3B8] mt-1">Please check back later.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {jobs.map(job => (
                        <div 
                          key={job._id}
                          onClick={() => setCandidateData({...candidateData, selectedJobId: job._id})}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left relative overflow-hidden group ${
                            candidateData.selectedJobId === job._id 
                              ? 'border-[#0066FF] bg-[#F0F5FF] shadow-sm' 
                              : 'border-[#E2E8F0] hover:border-[#0066FF]/40 hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {candidateData.selectedJobId === job._id && (
                            <div className="absolute top-0 right-0 w-12 h-12 flex items-start justify-end p-2 pointer-events-none">
                              <div className="w-5 h-5 bg-[#0066FF] rounded-full flex items-center justify-center text-white">
                                <CheckCircle2 className="h-3 w-3" />
                              </div>
                            </div>
                          )}
                          <h3 className={`font-bold mb-1 line-clamp-1 pr-6 ${candidateData.selectedJobId === job._id ? 'text-[#0066FF]' : 'text-[#0F172A] group-hover:text-[#0066FF]'}`}>
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
                            <Building className="h-3.5 w-3.5" /> 
                            <span className="line-clamp-1">{job.company || 'Vocalent'}</span>
                          </div>
                          {job.department && (
                            <div className="mt-3">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                candidateData.selectedJobId === job._id ? 'bg-[#0066FF]/10 text-[#0066FF]' : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}>
                                {job.department}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Job Description Preview */}
                {candidateData.selectedJobId && (
                  <div className="mt-8 animate-fade-in">
                   
                    <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground">
                      <ReactMarkdown>
                        {jobs.find(j => j._id === candidateData.selectedJobId)?.description || 'No description provided for this role.'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Application Form Fields */}
                {candidateData.selectedJobId && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Candidate Details */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        required
                        value={candidateData.name}
                        onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value })}
                        className="bg-input"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={candidateData.email}
                        onChange={(e) => setCandidateData({ ...candidateData, email: e.target.value })}
                        className="bg-input"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* CV Upload section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <Label className="block mb-2 text-sm font-medium">Resume / CV</Label>
                  {!extracted ? (
                    <Label htmlFor="cv-upload" className="cursor-pointer block">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm mb-1">Click to upload your CV</p>
                            <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX (Max 10MB)</p>
                          </>
                      </div>
                      <Input
                        id="cv-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                    </Label>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-green-500 justify-between bg-green-500/10 p-3 rounded-lg border border-green-500/20 animate-fade-in">
                      <div className="flex items-center gap-2 w-full truncate">
                         <CheckCircle2 className="h-5 w-5 shrink-0" />
                         <span className="font-medium truncate text-sm">Uploaded: {cvFile?.name}</span>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setExtracted(false); setCvFile(null); }} className="shrink-0 bg-transparent hover:bg-green-500/20 text-green-600 border-green-500/50">
                        Change File
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !cvFile}
                  className="w-full mt-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : !cvFile ? (
                    "Please upload a CV to apply"
                  ) : (
                    "Submit Application"
                  )}
                    </Button>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apply;
