import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
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
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to load transcript';
      toast.error(errMsg);
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
        <div className="w-full px-4 md:px-8 py-3 flex items-center justify-center">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
        </div>
      </nav>
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-8 md:py-12 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Full Interview Transcript
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground truncate">
                {candidateName} {candidateRole ? `- ${candidateRole}` : ''}
              </p>
            </div>
          </div>

          <Card className="p-4 sm:p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in mb-6">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {transcript.length > 0 ? (
                transcript.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 rounded-lg ${
                      item.speaker === "AI"
                        ? "bg-primary/5"
                        : "bg-accent/50"
                    }`}
                  >
                    <div className="flex-shrink-0 sm:w-20 md:w-24 text-xs sm:text-sm text-muted-foreground">
                      <div className="font-semibold mb-1">{item.speaker}</div>
                      <div className="text-xs">{formatTime(item.timestamp || Date.now())}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base break-words">{item.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No transcript available yet.</p>
              )}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/results", { state: { interviewId } })}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto sm:flex-1 hover:bg-accent/50 border-border/50 transition-all"
            >
              Back
            </Button>
            <Button
              onClick={() => navigate("/download", { state: { interviewId } })}
              className="w-full sm:w-auto sm:flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              Export
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Transcript;
