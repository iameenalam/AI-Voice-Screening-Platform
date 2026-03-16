import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const MicTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const [testing, setTesting] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
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
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create audio context and analyser
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let detectedSound = false;

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);

        // If we detect sound above threshold, mark as successful
        if (average > 10) {
          detectedSound = true;
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      // Auto-complete after 5 seconds if sound detected
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
        } else if (err.name === 'NotFoundError') {
          setError("No microphone found. Please connect a microphone and try again.");
          toast.error("No microphone found");
        } else {
          setError("Failed to access microphone. Please check your settings.");
          toast.error("Microphone error");
        }
      }
    }
  };

  const handleStartInterview = () => {
    navigate("/interview", { state: { interviewId } });
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
          </div>
        </div>
      </nav>
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-8 md:py-12 w-full">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8 text-center animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Test Your Microphone
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Make sure your microphone is working properly before starting the interview
            </p>
          </div>

          <Card className="p-4 sm:p-6 md:p-12 bg-card/80 backdrop-blur-xl border-border/50 card-shadow text-center hover-lift animate-fade-in">
            <div className="mb-6 md:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="h-10 w-10 sm:h-12 sm:w-12 md:h-12 md:w-12 text-primary" />
              </div>

              {testing && (
                <div className="mb-6">
                  <VoiceVisualizer isActive={audioLevel > 10} />
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-100"
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Audio Level: {Math.round(audioLevel)}
                    </p>
                  </div>
                </div>
              )}

              {testComplete && (
                <div className="flex items-center justify-center gap-2 text-green-500 mb-4 md:mb-6 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-base sm:text-lg md:text-xl font-medium">Microphone working fine!</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-destructive mb-6 p-4 bg-destructive/10 rounded-lg animate-fade-in">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {!testing && !testComplete && !error && (
                <p className="text-muted-foreground mb-6">
                  Click the button below to test your microphone
                </p>
              )}

              {testing && (
                <p className="text-muted-foreground mb-6">
                  <span className="font-medium">Speak now!</span> Say something to test your microphone...
                </p>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4 w-full">
              {!testComplete && (
                <Button
                  onClick={startTest}
                  disabled={testing}
                  className="w-full h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all text-sm sm:text-base font-medium rounded-md"
                >
                  {testing ? "Testing... (5s)" : error ? "Try Again" : "Test Microphone"}
                </Button>
              )}

              {testComplete && (
                <Button
                  onClick={handleStartInterview}
                  className="w-full h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all text-sm sm:text-base font-medium rounded-md"
                >
                  <span className="flex items-center justify-center">
                    Start Interview
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Button>
              )}
              
              {(testComplete || error) && (
                <Button
                  onClick={startTest}
                  variant="outline"
                  className="w-full h-12 sm:h-14 px-6 sm:px-8 hover:bg-accent/50 border-border/50 transition-all text-sm sm:text-base font-medium rounded-md"
                >
                  Test Again
                </Button>
              )}
            </div>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default MicTest;
