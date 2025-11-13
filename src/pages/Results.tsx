import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, TrendingUp, FileText, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Results = () => {
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

  // Group transcript by questions
  const transcriptByQuestion = interview.transcript?.reduce((acc: any, entry: any) => {
    const qIndex = entry.questionIndex >= 0 ? entry.questionIndex : acc.length - 1;
    if (!acc[qIndex]) {
      acc[qIndex] = { question: '', answers: [] };
    }
    if (entry.speaker === 'AI') {
      acc[qIndex].question = entry.text;
    } else {
      acc[qIndex].answers.push(entry.text);
    }
    return acc;
  }, []) || [];

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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8 animate-fade-in">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border border-green-500/30 shadow-lg">
              <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Interview Completed!
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              AI analysis and transcript are ready for review
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                AI Summary
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-base md:text-lg">
                    {interview.aiSummary || "Interview completed successfully. Review the transcript for details."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h3 className="font-semibold mb-1 text-xs md:text-sm text-muted-foreground">
                      Sentiment Score
                    </h3>
                    <p className="text-xl md:text-2xl font-bold text-green-500">
                      +{interview.sentimentScore?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="font-semibold mb-1 text-xs md:text-sm text-muted-foreground">
                      Confidence
                    </h3>
                    <p className="text-xl md:text-2xl font-bold text-blue-500">
                      {interview.confidence || 'Medium'}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h3 className="font-semibold mb-1 text-xs md:text-sm text-muted-foreground">
                      Red Flags
                    </h3>
                    <p className="text-xl md:text-2xl font-bold text-yellow-500">
                      {interview.redFlags?.length > 0 ? interview.redFlags.length : 'None'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Interview Transcript
              </h2>

              <div className="space-y-4 md:space-y-6">
                {transcriptByQuestion.length > 0 ? (
                  transcriptByQuestion.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="text-xs md:text-sm font-semibold text-primary">Q:</span>
                        <p className="flex-1 text-sm md:text-base">{item.question}</p>
                      </div>
                      {item.answers.map((answer: string, aIndex: number) => (
                        <div key={aIndex} className="flex items-start gap-3 pl-4 md:pl-6">
                          <span className="text-xs md:text-sm font-semibold text-muted-foreground">
                            A:
                          </span>
                          <p className="flex-1 text-sm md:text-base text-muted-foreground">{answer}</p>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No transcript available yet.</p>
                )}
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 backdrop-blur-xl border-primary/30 shadow-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1 text-sm md:text-base text-foreground">Recommendations</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {interview.recommendations || "Review the interview transcript and analysis to make your decision."}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate("/transcript", { state: { interviewId } })}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto sm:flex-1 hover:bg-accent/50 border-border/50 transition-all"
              >
                View Full Transcript
              </Button>
              <Button
                onClick={() => navigate("/download", { state: { interviewId } })}
                className="w-full sm:w-auto sm:flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                Download Report
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
