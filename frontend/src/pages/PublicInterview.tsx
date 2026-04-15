import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate, useParams } from "react-router-dom";
import { Mic, Phone, Loader2, ArrowRight, Volume2, VolumeX, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PublicInterview = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const lastTranscriptTimeRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestartingRef = useRef<boolean>(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!token) {
      setInterviewError("Invalid interview link");
      setPageLoading(false);
      return;
    }
    loadInterview();
  }, [token]);

  useEffect(() => {
    if (interviewStarted && questions.length > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [interviewStarted, questions]);

  const loadInterview = async () => {
    if (!token) return;
    setPageLoading(true);
    
    const result = await api.getPublicInterview(token);
    setPageLoading(false);
    
    if (result.error) {
      const errData = typeof result.error === 'string' ? { error: result.error } : (result.error as any);
      const errMsg = errData?.error || 'Interview not found';
      
      // Check if expired
      if (errData?.expired) {
        setIsExpired(true);
        setInterviewError(errMsg);
      } else if (errData?.completed) {
        setInterviewCompleted(true);
      } else {
        setInterviewError(errMsg);
      }
      return;
    }
    
    if (result.data) {
      if (result.data.status === 'completed') {
        setInterviewCompleted(true);
        return;
      }
      
      setQuestions(result.data.questions || []);
      setCandidateName(result.data.candidateId?.name || '');
      
      if (result.data.status === 'in_progress') {
        setInterviewStarted(true);
        startVoiceRecognition();
      }
    }
  };

  const startInterview = async () => {
    if (!token) return;
    
    setLoading(true);
    const result = await api.startPublicInterview(token);
    setLoading(false);
    
    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to start';
      toast.error(errMsg);
    } else {
      setInterviewStarted(true);
      startVoiceRecognition();
      setTimeout(() => {
        askQuestion(0);
      }, 500);
    }
  };

  const startVoiceRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a: number, b: number) => a + b) / dataArray.length;
        setAudioLevel(average);
        setIsActive(average > 10);
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

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

          if (finalTranscript) {
            accumulatedTranscriptRef.current += finalTranscript;
            lastTranscriptTimeRef.current = Date.now();
          }

          const displayText = (accumulatedTranscriptRef.current + interimTranscript).trim();
          setCurrentResponse(displayText);
          
          if (displayText) {
            setIsRecording(true);
            lastTranscriptTimeRef.current = Date.now();
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'aborted') return;
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied.');
            return;
          }
          setTimeout(() => {
            try {
              const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
              if (shouldRestart && recognition) {
                recognition.start();
              }
            } catch (err: any) {
              if (!err.message?.includes('already started')) {
                toast.error('Speech recognition failed. Click "Restart Mic".');
              }
            }
          }, 500);
        };

        recognition.onend = () => {
          if (recognitionRestartTimeoutRef.current) {
            clearTimeout(recognitionRestartTimeoutRef.current);
          }
          
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          
          if (shouldRestart && !isRestartingRef.current) {
            isRestartingRef.current = true;
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              try {
                recognition.start();
                isRestartingRef.current = false;
              } catch (err: any) {
                isRestartingRef.current = false;
                if (!err.message?.includes('already started')) {
                  recognitionRestartTimeoutRef.current = setTimeout(() => {
                    try { recognition.start(); } catch {}
                  }, 500);
                }
              }
            }, 0);
          }
        };

        recognition.start();
        setRecognition(recognition);
        
        // Force restart interval
        const forceRestartInterval = setInterval(() => {
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          if (shouldRestart) {
            try { recognition.stop(); } catch {}
          } else {
            clearInterval(forceRestartInterval);
          }
        }, 55000);
        
        // Health check
        healthCheckIntervalRef.current = setInterval(() => {
          const timeSinceLastTranscript = Date.now() - lastTranscriptTimeRef.current;
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          if (timeSinceLastTranscript > 10000 && shouldRestart) {
            try {
              recognition.stop();
              setTimeout(() => {
                try {
                  recognition.start();
                  lastTranscriptTimeRef.current = Date.now();
                } catch {}
              }, 300);
            } catch {}
          }
        }, 3000);
        
      } else {
        toast.error("Speech recognition not supported in this browser");
      }
    } catch (error) {
      toast.error("Failed to access microphone");
    }
  };

  const speakQuestion = (questionText: string) => {
    if (isMuted) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const analyzeSentiment = (text: string): number => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'enjoy', 'happy', 'successful', 'achieved', 'proud', 'excited', 'passionate', 'innovative'];
    const negativeWords = ['bad', 'terrible', 'hate', 'difficult', 'problem', 'failed', 'struggle', 'unfortunately', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5;
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.05;
      if (negativeWords.includes(word)) score -= 0.05;
    });
    if (words.length > 50) score += 0.1;
    if (words.length > 100) score += 0.1;
    return Math.max(0, Math.min(1, score));
  };

  const askQuestion = async (index: number) => {
    if (index >= questions.length || !token) return;

    const question = questions[index];
    setCurrentResponse("");
    accumulatedTranscriptRef.current = "";
    setIsRecording(false);
    
    await api.addPublicTranscriptEntry(token, 'AI', question, Date.now(), index);
    speakQuestion(question);
  };

  const handleNextQuestion = async () => {
    if (!token) return;
    
    let finalResponse = accumulatedTranscriptRef.current.trim();
    if (!finalResponse && currentResponse.trim()) {
      finalResponse = currentResponse.trim();
      accumulatedTranscriptRef.current = finalResponse;
    }
    
    if (!finalResponse) {
      toast.error("Please provide a response before moving to the next question");
      return;
    }

    setLoading(true);
    
    try {
      await api.addPublicTranscriptEntry(token, 'Candidate', finalResponse, Date.now(), currentQuestion);
      
      const sentimentScore = analyzeSentiment(finalResponse);
      setSentiment(sentimentScore);
      
      const newResponses = [...responses];
      newResponses[currentQuestion] = finalResponse;
      setResponses(newResponses);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        await new Promise(resolve => setTimeout(resolve, 500));
        await askQuestion(currentQuestion + 1);
      } else {
        await completeInterview();
        return;
      }
    } catch (error) {
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = () => {
    stopSpeaking();
    if (recognitionRestartTimeoutRef.current) clearTimeout(recognitionRestartTimeoutRef.current);
    if (healthCheckIntervalRef.current) clearInterval(healthCheckIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (recognition) {
      isRestartingRef.current = false;
      recognition.stop();
    }
    setInterviewStarted(false);
  };

  const completeInterview = async () => {
    if (!token) return;
    stopRecording();
    
    setLoading(true);
    const result = await api.completePublicInterview(token);
    setLoading(false);
    
    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed';
      toast.error(errMsg);
    } else {
      toast.success("Interview completed successfully!");
      setInterviewCompleted(true);
    }
  };

  useEffect(() => {
    return () => { stopRecording(); };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (interviewError) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
          <div className="container mx-auto px-4 py-3">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: isExpired ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {isExpired ? (
                <Clock className="h-10 w-10 text-yellow-500" />
              ) : (
                <AlertCircle className="h-10 w-10 text-red-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {isExpired ? 'Interview Link Expired' : 'Interview Unavailable'}
            </h1>
            <p className="text-muted-foreground mb-6">{interviewError}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (interviewCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
          <div className="container mx-auto px-4 py-3">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center max-w-lg mx-auto px-4 animate-fade-in">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Interview Completed!
            </h1>
            <p className="text-lg text-muted-foreground mb-3">
              Thank you{candidateName ? `, ${candidateName}` : ''}! Your responses have been recorded.
            </p>
            <Card className="p-5 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg mb-8 text-left">
              <p className="text-sm text-muted-foreground">
                Your interview data has been securely saved and will be reviewed by the recruiting team. 
                You'll hear back from them soon!
              </p>
            </Card>
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Home
            </Button>
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
                  
                  {isSpeaking && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-sm font-medium text-blue-400">Speaking</span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) { stopSpeaking(); toast.info('Voice muted'); }
                      else { toast.info('Voice unmuted'); }
                    }}
                    className="gap-2"
                  >
                    {isMuted ? (
                      <><VolumeX className="h-4 w-4" /><span className="hidden sm:inline">Unmute</span></>
                    ) : (
                      <><Volume2 className="h-4 w-4" /><span className="hidden sm:inline">Mute</span></>
                    )}
                  </Button>
                  
                  <div className="px-3 py-1.5 rounded-lg bg-accent/30 border border-border/30">
                    <span className="text-sm font-mono font-semibold">{formatTime(timer)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center relative z-10" data-interview-active={interviewStarted ? "true" : "false"}>
        <div className="container mx-auto px-4 py-8 md:py-12 w-full">
          <div className="max-w-4xl mx-auto">
            {!interviewStarted ? (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Welcome{candidateName ? `, ${candidateName}` : ''}!
                </h1>
                <p className="text-muted-foreground mb-2">
                  You've been invited to complete a voice-based AI interview.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  {questions.length} questions prepared • ~10-15 minutes
                </p>
                
                <Card className="p-5 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg mb-8 max-w-md mx-auto text-left">
                  <h3 className="font-semibold mb-3 text-sm">Before you start:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Ensure you're in a quiet environment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Allow microphone access when prompted
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Speak clearly and naturally
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Use Chrome for the best experience
                    </li>
                  </ul>
                </Card>
                
                <Button
                  onClick={startInterview}
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Starting...</>
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
                    
                    <div className="mb-4">
                      <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-100"
                          style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-lg md:text-xl font-semibold mb-6">{questions[currentQuestion]}</p>
                    
                    <div className="mt-4 p-4 bg-accent/30 rounded-lg text-left min-h-[80px]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Your response:</p>
                        {!currentResponse && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (recognition) {
                                try {
                                  recognition.stop();
                                  setTimeout(() => {
                                    recognition.start();
                                    toast.success('Microphone restarted');
                                  }, 500);
                                } catch {}
                              }
                            }}
                            className="text-xs"
                          >
                            🔄 Restart Mic
                          </Button>
                        )}
                      </div>
                      {currentResponse ? (
                        <p className="text-sm md:text-base whitespace-pre-wrap break-words">{currentResponse}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {isRecording ? "Listening..." : "Start speaking to see your response here..."}
                        </p>
                      )}
                    </div>
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

                <div className="flex gap-4">
                  {currentQuestion < questions.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                      disabled={loading || !currentResponse.trim()}
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</>
                      ) : (
                        <>Submit Answer & Next Question<ArrowRight className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                      disabled={loading || !currentResponse.trim()}
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Completing...</>
                      ) : (
                        <>Submit Final Answer & Complete<ArrowRight className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    onClick={completeInterview}
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    {loading ? "Completing..." : "End Interview"}
                  </Button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicInterview;
