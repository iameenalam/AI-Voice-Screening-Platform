import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const UploadCV = () => {
  const navigate = useNavigate();
  const [extracted, setExtracted] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      
      const result = await api.uploadCV(e.target.files[0]);
      
      if (result.error) {
        toast.error(result.error);
        setUploading(false);
        return;
      }

      if (result.data) {
        // API returns { success: true, data: extractedData, cvUrl: string }
        const res = result.data as any;
        const data = res.data || {};
        const hasData = data.name || data.email;
        
        setCandidateData({
          name: data.name || "",
          role: data.role || "",
          email: data.email || "",
        });
        
        // Capture cvUrl and raw extracted data
        if (res.cvUrl) setCvUrl(res.cvUrl);
        setRawExtractedData(data);
        
        // Store full role if available
        if (data.fullRole && data.fullRole !== data.role) {
          setFullRole(data.fullRole);
        }
        
        setExtracted(true);
        
        if (hasData) {
          toast.success("Contact details extracted successfully!");
        } else {
          toast.warning("Could not extract data automatically. Please enter details manually.");
        }
      }
      
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateData.name || !candidateData.role || !candidateData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Include full role, cvUrl, and extractedData in the submission
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
      // Pass full role for AI question generation
      navigate("/screening-setup", { 
        state: { 
          candidateId: data._id, 
          role: fullRole || candidateData.role // Use full role for context
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
          </div>
        </div>
      </nav>
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-8 md:py-12 w-full">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Upload Candidate CV
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              We'll automatically extract candidate information to set up the interview
            </p>
          </div>

          <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!extracted ? (
                <div className="space-y-4">
                  <Label htmlFor="cv-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 md:p-12 text-center hover:border-primary/50 transition-colors">
                      {uploading ? (
                        <>
                          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                          <p className="text-lg mb-2">Extracting information...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-base md:text-lg mb-2">Click to upload CV</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            PDF, DOC, or DOCX (Max 10MB)
                          </p>
                        </>
                      )}
                    </div>
                    <Input
                      id="cv-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </Label>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-green-500 mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Contact details extracted successfully!</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={candidateData.name}
                      onChange={(e) =>
                        setCandidateData({ ...candidateData, name: e.target.value })
                      }
                      className="bg-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="role">Role</Label>
                      {fullRole && fullRole !== candidateData.role && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFullRole(!showFullRole)}
                          className="text-xs h-6 px-2"
                        >
                          {showFullRole ? "Show Less" : "Show Full"}
                        </Button>
                      )}
                    </div>
                    {showFullRole && fullRole ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {fullRole}
                        </div>
                        <Input
                          id="role"
                          value={candidateData.role}
                          onChange={(e) =>
                            setCandidateData({ ...candidateData, role: e.target.value })
                          }
                          className="bg-input"
                          placeholder="Edit role here..."
                        />
                      </div>
                    ) : (
                      <Input
                        id="role"
                        value={candidateData.role}
                        onChange={(e) =>
                          setCandidateData({ ...candidateData, role: e.target.value })
                        }
                        className="bg-input"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={candidateData.email}
                      onChange={(e) =>
                        setCandidateData({ ...candidateData, email: e.target.value })
                      }
                      className="bg-input"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    Next: Screening Questions
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

export default UploadCV;
