import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Phone, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(0);
  const [sentiment, setSentiment] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  
  const mediaStreamRef = useState<any>(null);
  const audioContextRef = useState<any>(null);
  const analyserRef = useState<any>(null);
  const animationFrameRef = useState<any>(null);

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

  const startVoiceRecognition = async () => {
    try {
      // Start microphone for audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef[0] = stream;

      const audioContext = new AudioContext();
      audioContextRef[0] = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef[0] = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a: number, b: number) => a + b) / dataArray.length;
        setAudioLevel(average);
        setIsActive(average > 10); // Activate visualizer when speaking
        animationFrameRef[0] = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Start speech recognition
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

          const fullTranscript = finalTranscript || interimTranscript;
          setCurrentResponse(fullTranscript);
          
          // Update recording state based on speech
          if (fullTranscript.trim()) {
            setIsRecording(true);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            // Restart recognition if it stops due to silence
            setTimeout(() => {
              if (interviewStarted) {
                recognition.start();
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          // Auto-restart recognition if interview is still in progress
          if (interviewStarted) {
            setTimeout(() => recognition.start(), 100);
          }
        };

        recognition.start();
        setRecognition(recognition);
      } else {
        toast.error("Speech recognition not supported in this browser");
      }
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      toast.error("Failed to access microphone");
    }
  };

  // Simple sentiment analysis based on keywords
  const analyzeSentiment = (text: string): number => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'enjoy', 'happy', 'successful', 'achieved', 'accomplished', 'proud', 'excited', 'passionate', 'innovative', 'creative', 'efficient', 'effective', 'skilled'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'difficult', 'problem', 'issue', 'failed', 'struggle', 'hard', 'challenging', 'unfortunately', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5; // Neutral baseline
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.05;
      if (negativeWords.includes(word)) score -= 0.05;
    });
    
    // Word count bonus (longer responses tend to be more engaged)
    if (words.length > 50) score += 0.1;
    if (words.length > 100) score += 0.1;
    
    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
  };

  const askQuestion = async (index: number) => {
    if (index >= questions.length) {
      return;
    }

    const question = questions[index];
    setCurrentResponse("");
    setIsRecording(false);
    
    // Save question to transcript
    await api.addTranscriptEntry(interviewId!, 'AI', question, Date.now(), index);
  };

  const handleNextQuestion = async () => {
    if (!currentResponse.trim()) {
      toast.error("Please provide a response before moving to the next question");
      return;
    }

    // Save response to transcript
    await api.addTranscriptEntry(interviewId!, 'Candidate', currentResponse, Date.now(), currentQuestion);
    
    // Analyze sentiment
    const sentimentScore = analyzeSentiment(currentResponse);
    setSentiment(sentimentScore);
    
    // Store response
    const newResponses = [...responses];
    newResponses[currentQuestion] = currentResponse;
    setResponses(newResponses);
    
    // Move to next question or complete
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      askQuestion(currentQuestion + 1);
    } else {
      await completeInterview();
    }
  };

  const stopRecording = () => {
    if (animationFrameRef[0]) {
      cancelAnimationFrame(animationFrameRef[0]);
    }
    if (mediaStreamRef[0]) {
      mediaStreamRef[0].getTracks().forEach((track: any) => track.stop());
    }
    if (audioContextRef[0]) {
      audioContextRef[0].close();
    }
    if (recognition) {
      recognition.stop();
    }
  };

  const completeInterview = async () => {
    stopRecording();
    
    setLoading(true);
    const result = await api.completeInterview(interviewId!);
    setLoading(false);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Interview completed successfully!");
      navigate("/results", { state: { interviewId } });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-8 md:py-12 w-full">
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
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
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
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center relative">
                      <Mic className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                      {isRecording && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <VoiceVisualizer isActive={isActive} className="mb-6" />
                    
                    {/* Audio level indicator */}
                    <div className="mb-4">
                      <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-100"
                          style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-lg md:text-xl font-semibold mb-6">{questions[currentQuestion]}</p>
                    
                    {/* Current response display */}
                    {currentResponse && (
                      <div className="mt-4 p-4 bg-accent/30 rounded-lg text-left">
                        <p className="text-sm text-muted-foreground mb-1">Your response:</p>
                        <p className="text-sm">{currentResponse}</p>
                      </div>
                    )}
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
      </div>
    </div>
  );
};

export default Interview;
