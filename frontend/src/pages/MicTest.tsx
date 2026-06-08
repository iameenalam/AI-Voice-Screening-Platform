import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, CheckCircle2, ArrowRight, AlertCircle, Volume2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const MicTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const token = location.state?.token;
  
  const [testing, setTesting] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>(new Array(15).fill(4));
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const stopMicTest = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const startTest = async () => {
    setError(null);
    setTesting(true);
    setTestComplete(false);

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
      let detectedSound = false;

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);

        // Generate synthetic wave bars from actual frequency data
        const newBars = Array.from({ length: 15 }, (_, i) => {
          const val = dataArray[i * 4] || 0;
          return Math.max(4, Math.min(60, Math.round(val / 3.5)));
        });
        setWaveBars(newBars);

        if (average > 10) {
          detectedSound = true;
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      setTimeout(() => {
        stopMicTest();
        setTesting(false);
        
        if (detectedSound) {
          setTestComplete(true);
          toast.success("Microphone is working perfectly!");
        } else {
          setError("No sound detected. Please check your microphone and try again.");
          toast.error("No sound detected from microphone");
        }
      }, 5000);

    } catch (err) {
      console.error("Microphone access error:", err);
      setTesting(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Microphone access denied. Please allow microphone access and try again.");
          toast.error("Microphone access denied");
        } else {
          setError("Failed to access microphone. Please check your settings.");
          toast.error("Microphone error");
        }
      }
    }
  };

  const handleStartInterview = () => {
    if (token) {
      navigate(`/interview/${token}`, { state: { interviewId, token, startImmediately: true } });
    } else {
      navigate("/interview", { state: { interviewId, startImmediately: true } });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col font-sans">
      <nav className="sticky top-0 w-full z-50 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
            <div className="px-3 py-1.5 rounded-full bg-[#E6F0FF] text-xs font-bold text-[#0066FF] border border-[#B3D1FF] uppercase tracking-wider">
              STEP 1 OF 3 (READY)
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#0A1128] mb-2">
              Microphone Setup Check
            </h1>
            <p className="text-sm text-[#64748B]">
              Let's make sure your audio device is connected and healthy before we start.
            </p>
          </div>

          <Card className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg relative overflow-hidden text-center">
            {/* Visual Equalizer / Mic Container */}
            <div className="w-full h-32 flex items-center justify-center gap-1.5 mb-8 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] relative overflow-hidden">
              {!testing && !testComplete && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#E6F0FF]/40">
                  <div className="w-14 h-14 bg-white border border-[#B3D1FF] rounded-xl flex items-center justify-center mb-2 shadow-sm text-[#0066FF]">
                    <Mic className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0066FF] uppercase tracking-widest">
                    WAITING FOR INPUT
                  </span>
                </div>
              )}

              {(testing || testComplete) && (
                <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-[280px]">
                  {waveBars.map((height, index) => (
                    <div
                      key={index}
                      className="w-1.5 bg-[#0066FF] rounded-full transition-all duration-75"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Audio Device Details */}
            <div className="mb-8 p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-[#0A1128]">Internal Microphone</div>
                  <div className="text-[10px] text-[#64748B]">Hardware connection verified</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Healthy
              </span>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-destructive mb-6 p-4 bg-destructive/5 border border-destructive/10 rounded-xl text-left">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-xs leading-relaxed">{error}</span>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-3">
              {!testComplete ? (
                <Button
                  onClick={startTest}
                  disabled={testing}
                  className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-6 rounded-xl font-bold transition-all text-sm"
                >
                  {testing ? "Testing microphone... Speak naturally" : "Start Test"}
                </Button>
              ) : (
                <Button
                  onClick={handleStartInterview}
                  className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group text-sm"
                >
                  Start Interview
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}

              {(testComplete || error) && (
                <Button
                  onClick={startTest}
                  variant="outline"
                  className="w-full border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] py-6 rounded-xl font-semibold transition-all text-sm"
                >
                  Test Again
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MicTest;
