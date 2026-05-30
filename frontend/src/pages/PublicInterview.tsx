import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  Mic, Loader2, VolumeX, CheckCircle2,
  Clock, Shield, MicOff, Settings, Check, Phone
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Step = 'loading' | 'error' | 'landing' | 'mictest_init' | 'mictest_ready' | 'interview' | 'completed';

const PublicInterview = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  
  const [step, setStep] = useState<Step>('loading');
  const [loading, setLoading] = useState(false);
  
  // Interview Data
  const [candidateName, setCandidateName] = useState("Candidate");
  const [candidateEmail, setCandidateEmail] = useState("candidate@email.com");
  const [role, setRole] = useState("Senior Product Designer");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewError, setInterviewError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  
  // Audio & Recognition State
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>(new Array(15).fill(4));
  const [micHealthy, setMicHealthy] = useState(false);
  const [micTestRunning, setMicTestRunning] = useState(false);

  // Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const lastTranscriptTimeRef = useRef<number>(Date.now());
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) {
      setInterviewError("Invalid interview link");
      setStep('error');
      return;
    }
    loadInterview();
    return () => stopRecording();
  }, [token]);

  useEffect(() => {
    if (step === 'interview') {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [step]);

  const loadInterview = async () => {
    if (!token) return;
    setStep('loading');
    
    const result = await api.getPublicInterview(token);
    
    if (result.error) {
      const errData = typeof result.error === 'string' ? { error: result.error } : (result.error as any);
      if (errData?.expired) setIsExpired(true);
      if (errData?.completed) {
        setStep('completed');
        return;
      }
      setInterviewError(errData?.error || 'Interview not found');
      setStep('error');
      return;
    }
    
    if (result.data) {
      if (result.data.status === 'completed') {
        setCandidateName(result.data.candidateId?.name?.split(' ')[0] || 'Candidate');
        setStep('completed');
        return;
      }
      
      setQuestions(result.data.questions || [
        { text: "How do you prioritize user needs when working with tight technical constraints?", category: "TECHNICAL EVALUATION" },
        { text: "Can you describe your experience with design systems?", category: "TECHNICAL EVALUATION" }
      ]);
      setCandidateName(result.data.candidateId?.name || 'Alex');
      setCandidateEmail(result.data.candidateId?.email || 'alex.design@career.com');
      setRole(result.data.jobField || result.data.candidateId?.role || 'Senior Product Designer');
      
      if (result.data.status === 'in_progress' || location.state?.startImmediately) {
        setStep('mictest_init');
      } else {
        setStep('landing');
      }
    }
  };

  const startMicTest = async () => {
    setMicTestRunning(true);
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
      let detectedVoice = false;

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a: number, b: number) => a + b) / dataArray.length;
        setAudioLevel(average);

        // Generate waveform animation
        const newBars = Array.from({ length: 15 }, (_, i) => {
          const val = dataArray[i * 4] || 0;
          return Math.max(4, Math.min(48, Math.round(val / 4.5)));
        });
        setWaveBars(newBars);

        if (average > 15) {
          detectedVoice = true;
          setMicHealthy(true);
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Automatically succeed test after 3 seconds if voice detected
      setTimeout(() => {
        if (detectedVoice || micHealthy) {
          setStep('mictest_ready');
        } else {
          setMicTestRunning(false);
          toast.error("No voice detected. Please check your microphone.");
        }
      }, 3000);

    } catch (error) {
      setMicTestRunning(false);
      toast.error("Microphone access denied or unavailable.");
    }
  };

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          accumulatedTranscriptRef.current += finalTranscript;
          lastTranscriptTimeRef.current = Date.now();
        }
        setCurrentResponse((accumulatedTranscriptRef.current + interimTranscript).trim());
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'aborted') console.error('Speech recognition error', e.error);
      };

      rec.start();
      setRecognition(rec);
    }
  };

  const beginInterview = async () => {
    if (!token) return;
    setLoading(true);
    
    // Call API to mark as started
    await api.startPublicInterview(token);
    
    setLoading(false);
    setStep('interview');
    initSpeechRecognition();
    
    setTimeout(() => {
      askQuestion(0);
    }, 1000);
  };

  const askQuestion = async (index: number) => {
    if (index >= questions.length || !token) return;

    setCurrentResponse("");
    accumulatedTranscriptRef.current = "";
    
    const qText = typeof questions[index] === 'string' ? questions[index] : questions[index].text;
    await api.addPublicTranscriptEntry(token, 'AI', qText, Date.now(), index);
    speakQuestion(qText);
  };

  const speakQuestion = (text: string) => {
    if (isMuted) return;
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  };

  const stopRecording = () => {
    stopSpeaking();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (recognition) recognition.stop();
  };

  const handleNextOrComplete = async () => {
    if (!token) return;
    
    let finalResponse = accumulatedTranscriptRef.current.trim();
    if (!finalResponse && currentResponse.trim()) {
      finalResponse = currentResponse.trim();
    }
    
    if (!finalResponse && !isSpeaking) {
      // For testing/mocking, allow advancing without speaking if we just want to go through UI
      finalResponse = "Candidate provided no transcribed audio.";
    }

    setLoading(true);
    try {
      await api.addPublicTranscriptEntry(token, 'Candidate', finalResponse, Date.now(), currentQuestion);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        await new Promise(r => setTimeout(r, 500));
        await askQuestion(currentQuestion + 1);
      } else {
        await completeInterview();
      }
    } catch (error) {
      toast.error("Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const completeInterview = async () => {
    if (!token) return;
    stopRecording();
    setLoading(true);
    const result = await api.completePublicInterview(token);
    setLoading(false);
    
    if (!result.error) {
      setStep('completed');
    } else {
      toast.error("Failed to complete interview");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDERS ---

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 shadow-sm text-center">
          <Logo />
        </nav>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h1 className="text-2xl font-bold text-[#0A1128] mb-2">{isExpired ? 'Link Expired' : 'Unavailable'}</h1>
            <p className="text-[#64748B] mb-6">{interviewError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4 font-sans">
        {/* Mock Email Container */}
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-[#E2E8F0]">
          {/* Email Header */}
          <div className="bg-[#EEF2FF] px-4 py-3 flex items-center gap-4 border-b border-[#E2E8F0]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
            </div>
            <div className="flex-1 text-[10px] text-[#64748B] font-bold text-center tracking-widest uppercase">
              New Message
            </div>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          <div className="p-10 sm:p-16">
            <div className="mb-12 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003399] rounded-lg flex items-center justify-center text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-[#0A1128] leading-tight">Vocalent</div>
                <div className="text-[9px] font-bold text-[#64748B] tracking-widest uppercase">RECRUITMENT SUITE</div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A1128] mb-6 leading-tight">
              Your interview for <span className="text-[#0047b3]">{role}</span> is ready.
            </h1>

            <p className="text-[#475569] text-[15px] leading-relaxed mb-10">
              Hello, we're excited to move forward with your application. Vocalent's AI-assisted platform will guide you through a series of technical and cultural assessments at your own pace.
            </p>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 sm:p-8 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E2E8F0]/30 -mr-16 -mt-16 rounded-full blur-2xl"></div>
              
              <div className="text-[10px] font-bold text-[#475569] tracking-widest uppercase mb-4 relative z-10">
                ACCESS CREDENTIALS
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                <div>
                  <div className="text-[10px] text-[#64748B] mb-1.5">Username</div>
                  <div className="bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[13px] font-bold font-mono">
                    {candidateEmail}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B] mb-1.5">Temporary Password</div>
                  <div className="bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[13px] font-bold font-mono text-[#0A1128] flex justify-between items-center">
                    {token.substring(0, 8).toUpperCase()}-X9K
                    <div className="text-[#94A3B8]">📋</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <Button 
                onClick={() => setStep('mictest_init')}
                className="bg-[#0047b3] hover:bg-[#003399] text-white font-bold py-6 px-8 rounded-xl text-[15px] w-full sm:w-auto min-w-[250px] shadow-md transition-colors"
              >
                Start My Interview →
              </Button>
              <div className="mt-4 text-[12px] text-[#64748B] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Estimated time: 45 minutes
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#0A1128]">
              <div className="w-2 h-2 rounded-full bg-[#0047b3]"></div>
              Powered by Vocalent AI
            </div>
            <div className="flex gap-4 text-[10px] font-bold text-[#64748B] tracking-wider uppercase">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Help Center</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-[9px] text-[#94A3B8] max-w-xl text-center leading-relaxed">
          This is an automated message from Vocalent Recruitment Suite. If you did not apply for a position at our partner firms, please disregard this email. Vocalent uses biometric verification and AI sentiment analysis to ensure a fair assessment process.
        </div>
      </div>
    );
  }

  if (step === 'mictest_init' || step === 'mictest_ready') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <div className="max-w-2xl w-full mx-auto p-6 pt-12 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-[11px] font-bold text-[#0047b3] tracking-widest uppercase">
              STEP 1 OF 3 {step === 'mictest_ready' && '(READY)'}
            </div>
            <Logo />
            <div className="text-[11px] font-bold text-[#64748B]">Mic Test</div>
          </div>
          <div className="w-full h-0.5 bg-[#E2E8F0] rounded-full mb-12 overflow-hidden">
            <div className="h-full bg-[#0047b3] w-1/3 transition-all"></div>
          </div>

          {/* Main Card */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {step === 'mictest_init' ? (
              <div className="w-full bg-white rounded-3xl p-10 text-center border border-[#E2E8F0] shadow-sm">
                <h1 className="text-2xl font-extrabold text-[#0A1128] mb-2">Let's check your microphone</h1>
                <p className="text-[#64748B] text-[14px] mb-10">Speak clearly into your microphone</p>
                
                <div className="w-16 h-16 mx-auto bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#0047b3] mb-8">
                  <Mic className="h-6 w-6" />
                </div>

                <div className="flex justify-center items-center gap-1.5 h-8 mb-8 opacity-40">
                  {waveBars.slice(0, 10).map((h, i) => (
                    <div key={i} className="w-1.5 bg-[#CBD5E1] rounded-full transition-all" style={{ height: `${h}px` }} />
                  ))}
                </div>

                <div className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase flex items-center justify-center gap-2 mb-10">
                  <div className={`w-1.5 h-1.5 rounded-full ${micTestRunning ? 'bg-[#10B981] animate-pulse' : 'bg-[#CBD5E1]'}`}></div>
                  WAITING FOR INPUT...
                </div>

                <Button 
                  onClick={startMicTest}
                  disabled={micTestRunning}
                  className="w-full bg-[#789EE5] hover:bg-[#5b85d9] text-white font-bold py-6 rounded-xl text-[14px] mb-4"
                >
                  {micTestRunning ? 'Listening...' : 'Start Test'}
                </Button>
                
                <button className="text-[12px] font-bold text-[#0047b3] flex items-center justify-center gap-2 w-full hover:underline">
                  <Settings className="h-3.5 w-3.5" /> Change Input Device
                </button>
              </div>
            ) : (
              <div className="w-full bg-white rounded-3xl p-10 text-center border border-[#E2E8F0] shadow-xl shadow-blue-900/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
                
                <h1 className="text-3xl font-extrabold text-[#0A1128] mb-2 relative z-10">You're all set!</h1>
                <p className="text-[#64748B] text-[14px] mb-8 relative z-10">We've successfully verified your audio connection.</p>
                
                <div className="bg-[#EEF2FF] rounded-2xl p-8 mb-6 flex flex-col items-center justify-center h-48 relative z-10">
                  <div className="flex justify-center items-center gap-1.5 h-16 mb-6">
                    {waveBars.slice(0, 12).map((h, i) => (
                      <div key={i} className="w-1.5 bg-[#0047b3] rounded-full transition-all" style={{ height: `${h * 1.5}px` }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-[#0047b3] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0047b3]"></div> Voice detected
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-[#64748B] mb-8 relative z-10">
                  <Mic className="h-3 w-3" /> System Default - Internal Microphone • <span className="font-bold text-[#0047b3]">Healthy</span>
                </div>

                <Button 
                  onClick={beginInterview}
                  className="w-full bg-[#0047b3] hover:bg-[#003399] text-white font-bold py-6 rounded-xl text-[15px] mb-4 shadow-md relative z-10 transition-colors"
                >
                  Start Interview →
                </Button>
                
                <button onClick={() => setStep('mictest_init')} className="text-[12px] font-bold text-[#64748B] hover:text-[#0A1128] w-full relative z-10 transition-colors">
                  Run test again
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-between items-center text-[10px] text-[#94A3B8] font-bold tracking-wider">
            <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Encrypted Connection</div>
            <div>Vocalent v2.4.1</div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans relative">
        {/* Top Bar */}
        <nav className="w-full px-8 py-5 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-bold text-[#0A1128] tracking-widest uppercase">
            QUESTION {currentQuestion + 1} OF {questions.length}
          </div>
          <div className="px-4 py-2 bg-[#F1F5F9] rounded-lg text-[13px] font-mono font-bold text-[#0A1128] flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#64748B]" /> {formatTime(timer)}
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto px-6 py-12 relative">
          
          {/* AI Badge */}
          <div className="flex justify-center mb-12">
            <div className="px-4 py-1.5 rounded-full bg-[#EEF2FF] text-[10px] font-bold text-[#0047b3] tracking-widest uppercase flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full bg-[#0047b3] ${isSpeaking ? 'animate-pulse' : ''}`}></div>
              {isSpeaking ? 'AI SPEAKING...' : 'LISTENING...'}
            </div>
          </div>

          <div className="flex gap-8 relative">
            {/* Sidebar Indicator */}
            <div className="hidden sm:block w-32 shrink-0 border-l-[3px] border-[#0047b3] pl-4 self-start mt-2">
              <div className="text-[9px] font-bold text-[#0047b3] tracking-widest uppercase mb-1">STAGE</div>
              <div className="text-[12px] font-extrabold text-[#0A1128] capitalize">
                {questions[currentQuestion]?.category?.toLowerCase() || (currentQuestion < 3 ? "Technical Evaluation" : currentQuestion < 6 ? "Behavioral Fit" : "Onboarding")}
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A1128] leading-[1.2] tracking-tight mb-16">
                {typeof questions[currentQuestion] === 'string' ? questions[currentQuestion] : questions[currentQuestion]?.text}
              </h1>

              {/* Minimal Transcript Feedback */}
              <div className="text-center text-[#94A3B8] text-[13px] font-medium h-10">
                {currentResponse ? (
                  <span className="text-[#64748B] italic">"{currentResponse.length > 60 ? currentResponse.substring(currentResponse.length - 60) + "..." : currentResponse}"</span>
                ) : (
                  <span>Waiting for audio transcription...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-[#E2E8F0] p-3 flex items-center gap-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-20 py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-[#F8FAFC] text-[#64748B] transition-colors"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="text-[9px] font-bold tracking-widest uppercase">{isMuted ? 'UNMUTE' : 'MUTE'}</span>
          </button>

          <button 
            onClick={currentQuestion < questions.length - 1 ? handleNextOrComplete : completeInterview}
            disabled={loading}
            className="w-40 py-3.5 bg-[#C92A2A] hover:bg-[#b02222] rounded-xl text-white flex items-center justify-center gap-2 font-bold text-[13px] transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4 rotate-[135deg]" />}
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'End Interview'}
          </button>

          <button className="w-20 py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-[#F8FAFC] text-[#64748B] transition-colors">
            <Settings className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-widest uppercase">SETTINGS</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'completed') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans relative">
        {/* Sidebar strip (dark left edge as in Image 5) */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#1E293B]"></div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center max-w-lg w-full shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-[#E2E8F0] relative overflow-hidden">
            
            {/* Faint background check */}
            <CheckCircle2 className="absolute top-10 right-10 h-24 w-24 text-[#F1F5F9] -z-10" />

            <div className="w-16 h-16 mx-auto bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#0047b3] mb-8 relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#0047b3] flex items-center justify-center text-white">
                <Check className="h-4 w-4 stroke-[3px]" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-[#0A1128] mb-4 relative z-10">
              Interview Submitted
            </h1>
            
            <p className="text-[15px] text-[#475569] leading-relaxed mb-8 relative z-10">
              Thank you, <span className="font-bold text-[#0A1128]">{candidateName}</span>. Your interview has been successfully submitted. The recruitment team will be in touch shortly.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFF7ED] text-[#C2410C] mb-10 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest">AI-Enhanced Verification Active</span>
            </div>

            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-[#0047b3] hover:bg-[#003399] text-white font-bold py-6 rounded-xl text-[15px] shadow-md transition-colors relative z-10"
            >
              Return to Homepage
            </Button>
            
            <p className="text-[10px] text-[#94A3B8] font-medium mt-6 relative z-10">
              A confirmation email has been sent to your inbox.
            </p>
          </div>

          <div className="mt-12 text-[9px] font-bold text-[#94A3B8] tracking-widest uppercase flex items-center gap-2">
            VOCALENT <span className="text-[#CBD5E1]">•</span> COGNITIVE RECRUITMENT SUITE
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PublicInterview;
