import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2, Loader2, Building, Briefcase, Mail, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  const [companies, setCompanies] = useState<string[]>([]);

  const [candidateData, setCandidateData] = useState({
    name: "",
    email: "",
    appliedCompany: "",
    jobField: "",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await api.getCompanies();
        if (result.error) {
          console.error("Failed to fetch companies:", result.error);
          toast.error(typeof result.error === 'string' ? result.error : (result.error as any).error || 'Failed to fetch companies');
        } else if (result.data) {
          setCompanies(result.data);
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

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
    
    if (!candidateData.name || !candidateData.email || !candidateData.appliedCompany || !candidateData.jobField || !cvFile) {
      toast.error("Please fill in all required fields and upload your CV");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('name', candidateData.name);
    formData.append('email', candidateData.email);
    formData.append('appliedCompany', candidateData.appliedCompany);
    formData.append('jobField', candidateData.jobField);

    const result = await api.publicApply(formData);
    
    setSubmitting(false);

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : (result.error as any).error || 'Application failed');
      return;
    }

    // Show thank you page
    setSubmitted(true);
  };

  // Thank you screen after successful submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
        
        <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
          </div>
        </nav>
        
        <div className="flex-1 flex items-center justify-center relative z-10 py-12">
          <div className="container mx-auto px-4 w-full">
            <div className="max-w-lg mx-auto text-center">
              <div className="animate-fade-in">
                {/* Success icon with animation */}
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-0 bg-green-500/10 rounded-full" />
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Thank You for Applying!
                </h1>
                
                <p className="text-lg text-muted-foreground mb-3">
                  Your application has been submitted successfully.
                </p>
                
                <Card className="p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">We'll be in touch</p>
                        <p className="text-xs text-muted-foreground">
                          Our team will review your application and reach out via email at <span className="text-foreground font-medium">{candidateData.email}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">AI-Powered Interview</p>
                        <p className="text-xs text-muted-foreground">
                          If selected, you'll receive an interview link via email. The interview is voice-based and takes about 10–15 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="hover:bg-accent/50 border-border/50 transition-all"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
        </div>
      </nav>
      
      <div className="flex-1 flex items-center justify-center relative z-10 py-12">
        <div className="container mx-auto px-4 w-full">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 md:mb-8 animate-fade-in text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Submit Your Application
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Apply for your dream role. Upload your CV and we'll review your application!
              </p>
            </div>

            <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Target Company</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <select 
                        id="company"
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={candidateData.appliedCompany}
                        onChange={(e) => setCandidateData({...candidateData, appliedCompany: e.target.value})}
                        required
                      >
                        <option value="" disabled>Select Company</option>
                        <option value="All">All Companies</option>
                        {companies.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field">Professional Field</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <select
                        id="field"
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={candidateData.jobField}
                        onChange={(e) => setCandidateData({...candidateData, jobField: e.target.value})}
                        required
                      >
                        <option value="" disabled>Select Field</option>
                        {JOB_FIELDS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Always visible candidate details */}
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
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apply;
