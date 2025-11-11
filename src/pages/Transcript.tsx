import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Transcript = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<any>(null);

  useEffect(() => {
    if (interviewId) {
      loadInterview();
    } else {
      toast.error("Interview not found");
      navigate("/dashboard");
    }
  }, [interviewId]);

  const loadInterview = async () => {
    if (!interviewId) return;
    
    setLoading(true);
    const result = await api.getInterview(interviewId);
    setLoading(false);
    
    if (result.error) {
      toast.error(result.error);
      navigate("/dashboard");
    } else if (result.data) {
      setInterview(result.data);
    }
  };

  const formatTime = (timestamp: number) => {
    const totalSeconds = Math.floor(timestamp / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const transcript = interview.transcript || [];
  const candidateName = interview.candidateId?.name || 'Candidate';
  const candidateRole = interview.candidateId?.role || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar showUserMenu />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Full Interview Transcript
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {candidateName} {candidateRole ? `- ${candidateRole}` : ''}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/results", { state: { interviewId } })}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => navigate("/download", { state: { interviewId } })}
                className="bg-cta hover:bg-cta/90 w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
            <div className="space-y-4 md:space-y-6">
              {transcript.length > 0 ? (
                transcript.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 rounded-lg ${
                      item.speaker === "AI"
                        ? "bg-primary/5"
                        : "bg-accent/50"
                    }`}
                  >
                    <div className="flex-shrink-0 sm:w-24 text-xs sm:text-sm text-muted-foreground">
                      <div className="font-semibold mb-1">{item.speaker}</div>
                      <div>{formatTime(item.timestamp || Date.now())}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base">{item.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No transcript available yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Transcript;
