import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Mic, Phone, Loader2, ArrowRight, Volume2, 
  VolumeX, CheckCircle2, Settings, PenTool, Check 
} from "lucide-react";
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
  const [sentiment, setSentiment] = useState(0.5);
  const [questions, setQuestions] = useState<any[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [waveBars, setWaveBars] = useState<number[]>(new Array(15).fill(4));
  
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
      } else if (location.state?.startImmediately) {
        startInterview();
      }
    }
  };

  const startInterview = async () => {
    if (!interviewId) return;

    if (!location.state?.startImmediately) {
      navigate("/mic-test", { state: { interviewId } });
      return;
    }
    
    setLoading(true);
    const result = await api.startInterview(interviewId);
    setLoading(false);
    
    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to start interview';
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

        const newBars = Array.from({ length: 15 }, (_, i) => {
          const val = dataArray[i * 4] || 0;
          return Math.max(4, Math.min(48, Math.round(val / 4.5)));
        });
        setWaveBars(newBars);

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
        
        const forceRestartInterval = setInterval(() => {
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          if (shouldRestart) {
            try { recognition.stop(); } catch {}
          } else {
            clearInterval(forceRestartInterval);
          }
        }, 55000);
        
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
    utterance.rate = 0.95;
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
    return Math.max(0.1, Math.min(0.9, score));
  };

  const askQuestion = async (index: number) => {
    if (index >= questions.length || !interviewId) return;

    const question = questions[index];
    setCurrentResponse("");
    accumulatedTranscriptRef.current = "";
    setIsRecording(false);
    
    const qText = typeof question === 'string' ? question : question.text;
    await api.addTranscriptEntry(interviewId, 'AI', qText, Date.now(), index);
    speakQuestion(qText);
  };

  const handleNextQuestion = async () => {
    if (!interviewId) return;
    
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
      await api.addTranscriptEntry(interviewId, 'Candidate', finalResponse, Date.now(), currentQuestion);
      
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
    if (!interviewId) return;
    stopRecording();
    
    setLoading(true);
    const result = await api.completeInterview(interviewId);
    setLoading(false);
    
    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed';
      toast.error(errMsg);
    } else {
      toast.success("Interview completed successfully!");
      navigate("/results", { state: { interviewId } });
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

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 shadow-sm">
          <button onClick={() => navigate("/")} className="hover:opacity-85 transition-opacity">
            <Logo />
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-[#E6F0FF] border border-[#B3D1FF] rounded-2xl flex items-center justify-center text-[#0066FF]">
              <Mic className="h-6 w-6" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#0A1128] mb-2 font-sans">
              Ready to Start Interview?
            </h1>
            <p className="text-sm text-[#64748B] mb-8 leading-relaxed font-sans">
              {questions.length} questions prepared for your session.
            </p>

            <Button
              onClick={startInterview}
              disabled={loading}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold px-8 py-6 rounded-xl text-sm transition-all font-sans"
            >
              {loading ? "Starting..." : "Start Interview"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col font-sans relative"
      data-interview-active="true"
    >
      <nav className="sticky top-0 w-full z-50 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="hover:opacity-85 transition-opacity">
            <Logo />
          </button>
          
          <div className="flex items-center gap-3">
            {isSpeaking ? (
              <span className="px-3.5 py-1.5 rounded-full bg-[#E6F0FF] text-[10px] font-bold text-[#0066FF] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                AI Speaking...
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-[#EBFDF5] text-[10px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                Candidate Speaking
              </span>
            )}

            <div className="px-3.5 py-1.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-mono font-bold">
              {formatTime(timer)}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          
          <div className="mb-8 text-left border-l-2 border-[#0066FF] pl-4">
            <span className="text-[10px] font-bold text-[#0066FF] uppercase tracking-widest block mb-1">
              STAGE: {questions[currentQuestion]?.category || (currentQuestion < 3 ? "TECHNICAL EVALUATION" : currentQuestion < 6 ? "BEHAVIORAL FIT" : "ONBOARDING")}
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0A1128] leading-snug">
              {typeof questions[currentQuestion] === 'string' ? questions[currentQuestion] : questions[currentQuestion]?.text}
            </h1>
          </div>

          <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg mb-6 relative overflow-hidden">
            <div className="w-full h-12 flex items-end justify-center gap-1 mb-6 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl px-4 py-2">
              {waveBars.map((height, idx) => (
                <div 
                  key={idx}
                  className="w-1 bg-[#0066FF] rounded-full transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            <div className="p-5 bg-[#FAF7F0] border border-[#EBE3D5] rounded-xl text-left min-h-[160px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-extrabold text-[#8C7A5C] uppercase tracking-wider">Candidate transcription</span>
                </div>
                
                {currentResponse ? (
                  <p className="text-sm text-[#2C2518] font-medium leading-relaxed whitespace-pre-wrap">
                    {currentResponse}
                  </p>
                ) : (
                  <p className="text-xs text-[#8C7A5C] font-semibold italic">
                    {isSpeaking ? "Waiting for candidate response stream..." : "Listening... Start speaking clearly to generate NLP logs"}
                  </p>
                )}
              </div>

              <div className="mt-4 px-3 py-2 rounded bg-blue-50 text-[#0066FF] text-[10px] font-semibold flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-ping" />
                AI is analyzing sentiment and technical keywords in real-time
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (!isMuted) { stopSpeaking(); toast.info('Voice muted'); }
                  else { toast.info('Voice unmuted'); }
                }}
                className="border-[#E2E8F0] hover:bg-[#F8FAFC] p-4 rounded-xl flex items-center justify-center text-[#64748B]"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  toast.info("NLP logs tagged with focal priority");
                }}
                className="border-[#E2E8F0] hover:bg-[#F8FAFC] p-4 rounded-xl flex items-center justify-center text-[#64748B]"
              >
                <PenTool className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 flex-1 max-w-[200px] justify-center">
              {questions.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full flex-1 transition-all ${idx <= currentQuestion ? 'bg-[#0066FF]' : 'bg-[#E2E8F0]'}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={completeInterview}
                variant="destructive"
                size="lg"
                className="bg-[#EF4444] hover:bg-[#DC2626] font-bold px-6 py-5 rounded-xl text-sm flex items-center gap-2"
              >
                <Phone className="h-4.5 w-4.5" />
                End Interview
              </Button>

              <Button
                onClick={handleNextQuestion}
                disabled={loading || !currentResponse.trim()}
                size="lg"
                className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold px-6 py-5 rounded-xl text-sm flex items-center gap-1.5 group"
              >
                {currentQuestion < questions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                ) : (
                  <>
                    Complete
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Interview;
