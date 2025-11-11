import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Phone, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(0);
  const [sentiment, setSentiment] = useState(0.72);
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentResponse, setCurrentResponse] = useState("");

  useEffect(() => {
    if (!interviewId) {
      toast.error("Interview not found");
      navigate("/dashboard");
      return;
    }

    loadInterview();
  }, [interviewId]);

  useEffect(() => {
    if (interviewStarted && questions.length > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [interviewStarted, questions]);

  const loadInterview = async () => {
    if (!interviewId) return;
    
    const result = await api.getInterview(interviewId);
    if (result.data) {
      setQuestions(result.data.questions || []);
      if (result.data.status === 'in_progress') {
        setInterviewStarted(true);
        startVoiceRecognition();
      }
    }
  };

  const startInterview = async () => {
    if (!interviewId) return;
    
    setLoading(true);
    const result = await api.startInterview(interviewId);
    setLoading(false);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setInterviewStarted(true);
      startVoiceRecognition();
      askQuestion(0);
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentResponse(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.start();
      setRecognition(recognition);
    } else {
      toast.error("Speech recognition not supported in this browser");
    }
  };

  const askQuestion = async (index: number) => {
    if (index >= questions.length) {
      await completeInterview();
      return;
    }

    const question = questions[index];
    await api.addTranscriptEntry(interviewId!, 'AI', question, Date.now(), index);
    
    // Wait for response (simulated - in real app, you'd wait for user to finish speaking)
    setTimeout(async () => {
      if (currentResponse.trim()) {
        await api.addTranscriptEntry(interviewId!, 'Candidate', currentResponse, Date.now(), index);
        
        // Analyze response
        const analysis = await api.analyzeResponse(interviewId!, question, currentResponse);
        if (analysis.data) {
          setSentiment(analysis.data.sentiment);
        }
        
        setCurrentResponse("");
        
        // Move to next question after a delay
        if (index < questions.length - 1) {
          setTimeout(() => {
            setCurrentQuestion(index + 1);
            askQuestion(index + 1);
          }, 2000);
        } else {
          await completeInterview();
        }
      } else {
        // No response, move to next question
        if (index < questions.length - 1) {
          setCurrentQuestion(index + 1);
          askQuestion(index + 1);
        } else {
          await completeInterview();
        }
      }
    }, 30000); // 30 seconds per question
  };

  const completeInterview = async () => {
    if (recognition) {
      recognition.stop();
    }
    
    setLoading(true);
    const result = await api.completeInterview(interviewId!);
    setLoading(false);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      navigate("/results", { state: { interviewId } });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
            
            <div className="flex items-center gap-4">
              {interviewStarted && (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-400">Recording</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-accent/30 border border-border/30">
                    <span className="text-sm font-mono font-semibold">{formatTime(timer)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {!interviewStarted ? (
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Interview?</h1>
              <p className="text-muted-foreground mb-6">
                {questions.length} questions prepared
              </p>
              <Button
                onClick={startInterview}
                disabled={loading}
                className="bg-cta hover:bg-cta/90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Interview in Progress</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>

              <div className="grid gap-6">
                <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mic className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                    </div>
                    <VoiceVisualizer isActive={isActive} className="mb-6" />
                    <p className="text-lg md:text-xl mb-4">{questions[currentQuestion]}</p>
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-green-500/30 shadow-lg">
                    <h3 className="font-semibold mb-2 text-xs md:text-sm text-muted-foreground">
                      Real-time Insights
                    </h3>
                    <p className="text-base md:text-lg">
                      Positive trend{" "}
                      <span className="text-green-500 font-bold">+{sentiment.toFixed(2)}</span> sentiment
                      score
                    </p>
                  </Card>

                  <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg">
                    <h3 className="font-semibold mb-2 text-xs md:text-sm text-muted-foreground">
                      Progress
                    </h3>
                    <div className="flex gap-2">
                      {questions.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 flex-1 rounded-full ${
                            index <= currentQuestion ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </Card>
                </div>

                <Button
                  onClick={completeInterview}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  {loading ? "Completing..." : "End Interview"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Interview;
