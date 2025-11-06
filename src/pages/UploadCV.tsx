import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2 } from "lucide-react";

const UploadCV = () => {
  const navigate = useNavigate();
  const [extracted, setExtracted] = useState(false);
  const [candidateData, setCandidateData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTimeout(() => {
        setCandidateData({
          name: "Ali Khan",
          role: "Frontend Developer",
          phone: "+92 300 1234567",
          email: "alikhan@email.com",
        });
        setExtracted(true);
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/screening-setup");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Candidate CV</h1>
            <p className="text-muted-foreground">
              We'll automatically extract candidate information to set up the interview
            </p>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur-sm card-shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!extracted ? (
                <div className="space-y-4">
                  <Label htmlFor="cv-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg mb-2">Click to upload CV</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, DOC, or DOCX (Max 10MB)
                      </p>
                    </div>
                    <Input
                      id="cv-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </Label>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                    </div>
                  </div>
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
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={candidateData.role}
                      onChange={(e) =>
                        setCandidateData({ ...candidateData, role: e.target.value })
                      }
                      className="bg-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={candidateData.phone}
                      onChange={(e) =>
                        setCandidateData({ ...candidateData, phone: e.target.value })
                      }
                      className="bg-input"
                    />
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
                    className="w-full bg-cta hover:bg-cta/90"
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
  );
};

export default UploadCV;
