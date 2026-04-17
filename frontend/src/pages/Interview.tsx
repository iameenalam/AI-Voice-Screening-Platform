import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Phone, Loader2, ArrowRight, Volume2, VolumeX } from "lucide-react";
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
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
        // Auto-start if coming back from MicTest
        startInterview();
      }
    }
  };

  const startInterview = async () => {
    if (!interviewId) return;

    // If not already starting from mic test, go to mic test first
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
      
      // Small delay before asking first question to ensure everything is ready
      setTimeout(() => {
        askQuestion(0);
      }, 500);
    }
  };

  const startVoiceRecognition = async () => {
    try {
      console.log('🎤 Starting voice recognition...');
      
      // Start microphone for audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      console.log('✅ Microphone access granted');

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
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
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Start speech recognition with optimized settings
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // CRITICAL: These settings make it truly continuous
        recognition.continuous = true;  // Keep listening
        recognition.interimResults = true;  // Show results as you speak
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        // Chrome-specific optimizations
        if ('webkitSpeechRecognition' in window) {
          (recognition as any).continuous = true;
          (recognition as any).interimResults = true;
        }

        console.log('🎙️ Speech recognition initialized with continuous mode');

        recognition.onstart = () => {
          console.log('✅ Speech recognition started');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          // Process all results from the last processed index
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              console.log(`📝 Final transcript: "${transcript}"`);
            } else {
              interimTranscript += transcript;
              console.log(`💭 Interim transcript: "${transcript}"`);
            }
          }

          // Accumulate final transcripts
          if (finalTranscript) {
            accumulatedTranscriptRef.current += finalTranscript;
            lastTranscriptTimeRef.current = Date.now(); // Update activity timestamp
            console.log(`📊 Accumulated total: ${accumulatedTranscriptRef.current.length} chars`);
            console.log(`📄 Full text: "${accumulatedTranscriptRef.current}"`);
          }

          // Display accumulated final transcript + current interim transcript
          const displayText = (accumulatedTranscriptRef.current + interimTranscript).trim();
          setCurrentResponse(displayText);
          
          // Update recording state based on speech
          if (displayText) {
            setIsRecording(true);
            lastTranscriptTimeRef.current = Date.now(); // Update activity timestamp
          }
          
          // Log current display state
          console.log(`🖥️ Display text length: ${displayText.length} chars`);
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event.error);
          console.log(`   Error details:`, event);
          
          // Don't restart on certain errors
          if (event.error === 'aborted') {
            console.log('⚠️ Recognition aborted (normal during restart)');
            return;
          }
          
          if (event.error === 'not-allowed') {
            console.log('❌ Microphone permission denied');
            toast.error('Microphone access denied. Please allow microphone access.');
            return;
          }
          
          // Auto-restart on ALL other errors
          console.log('🔄 Auto-restarting after error...');
          setTimeout(() => {
            try {
              const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
              if (shouldRestart && recognition) {
                recognition.start();
                console.log('✅ Recognition restarted after error');
              }
            } catch (err: any) {
              console.error('❌ Failed to restart after error:', err.message);
              // Ignore "already started" errors
              if (!err.message?.includes('already started')) {
                toast.error('Speech recognition failed. Click "Restart Mic" button.');
              }
            }
          }, 500);
        };

        recognition.onend = () => {
          const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
          console.log(`⏹️ [${timestamp}] Speech recognition ended`);
          
          // Clear any pending restart
          if (recognitionRestartTimeoutRef.current) {
            clearTimeout(recognitionRestartTimeoutRef.current);
          }
          
          // Use DOM check to avoid stale closure
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          console.log(`   Should restart: ${shouldRestart}`);
          
          if (shouldRestart && !isRestartingRef.current) {
            isRestartingRef.current = true;
            console.log('🔄 Immediately restarting speech recognition...');
            
            // Restart with NO delay for seamless continuation
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              try {
                recognition.start();
                isRestartingRef.current = false;
                console.log(`✅ [${new Date().toISOString().split('T')[1].split('.')[0]}] Recognition restarted`);
              } catch (err: any) {
                isRestartingRef.current = false;
                console.error('❌ Restart failed:', err.message);
                
                // If already started, that's actually good
                if (err.message?.includes('already started')) {
                  console.log('✅ Recognition already running (good!)');
                } else {
                  // Try one more time after a longer delay
                  recognitionRestartTimeoutRef.current = setTimeout(() => {
                    try {
                      recognition.start();
                      console.log('✅ Recognition restarted on second attempt');
                    } catch (err2) {
                      console.error('❌ Second restart attempt failed');
                      toast.error('Speech recognition stopped. Click "Restart Mic".');
                    }
                  }, 500);
                }
              }
            }, 0); // ZERO delay for instant restart
          } else if (isRestartingRef.current) {
            console.log('⏸️ Already restarting, skipping...');
          } else {
            console.log('⏹️ Interview not active, not restarting');
          }
        };

        recognition.start();
        setRecognition(recognition);
        console.log('🎤 Speech recognition service started');
        
        // CRITICAL: Force restart every 55 seconds to prevent Chrome's 60s timeout
        let restartCounter = 0;
        const forceRestartInterval = setInterval(() => {
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          if (shouldRestart) {
            restartCounter++;
            console.log(`🔄 [Forced restart #${restartCounter}] Preventing timeout...`);
            try {
              recognition.stop(); // This will trigger onend which will restart
            } catch (err) {
              console.error('❌ Forced restart failed:', err);
            }
          } else {
            clearInterval(forceRestartInterval);
          }
        }, 55000); // Every 55 seconds (before Chrome's 60s limit)
        
        // Start health check - restart if no activity for 10 seconds
        healthCheckIntervalRef.current = setInterval(() => {
          const timeSinceLastTranscript = Date.now() - lastTranscriptTimeRef.current;
          const secondsSinceLastTranscript = Math.floor(timeSinceLastTranscript / 1000);
          
          // Only log if it's been a while
          if (secondsSinceLastTranscript > 5) {
            console.log(`🏥 Health check: ${secondsSinceLastTranscript}s since last transcript`);
          }
          
          // If no transcript for 10 seconds and interview is active, restart
          const shouldRestart = document.querySelector('[data-interview-active="true"]') !== null;
          if (timeSinceLastTranscript > 10000 && shouldRestart) {
            console.log('⚠️ No activity for 10s, forcing restart...');
            try {
              recognition.stop();
              setTimeout(() => {
                try {
                  recognition.start();
                  console.log('✅ Recognition restarted by health check');
                  lastTranscriptTimeRef.current = Date.now();
                } catch (err) {
                  console.error('❌ Health check restart failed:', err);
                }
              }, 300);
            } catch (err) {
              console.error('❌ Health check stop failed:', err);
            }
          }
        }, 3000); // Check every 3 seconds
        
      } else {
        console.error('❌ Speech recognition not supported');
        toast.error("Speech recognition not supported in this browser");
      }
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      toast.error("Failed to access microphone");
    }
  };

  // Text-to-Speech: Read question aloud
  const speakQuestion = (questionText: string) => {
    // Don't speak if muted
    if (isMuted) {
      console.log('🔇 Speech muted, skipping...');
      return;
    }

    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    console.log(`🔊 Speaking question: "${questionText.substring(0, 50)}..."`);

    const utterance = new SpeechSynthesisUtterance(questionText);
    
    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    utterance.lang = 'en-US';

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`🎤 Using voice: ${preferredVoice.name}`);
    }

    // Event handlers
    utterance.onstart = () => {
      console.log('🔊 Started speaking');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('✅ Finished speaking');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      setIsSpeaking(false);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      console.log('⏹️ Stopped speaking');
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

    console.log(`\n❓ Asking question ${index + 1}/${questions.length}`);
    const question = questions[index];
    
    // Reset for new question
    console.log('🔄 Resetting transcript for new question');
    setCurrentResponse("");
    accumulatedTranscriptRef.current = "";
    setIsRecording(false);
    
    // Save question to transcript
    console.log(`📝 Saving question to transcript: "${question.substring(0, 60)}..."`);
    await api.addTranscriptEntry(interviewId!, 'AI', question, Date.now(), index);
    
    // Read question aloud
    speakQuestion(question);
    
    console.log('✅ Question saved and spoken, ready for response\n');
  };

  const handleNextQuestion = async () => {
    console.log('\n➡️ Moving to next question...');
    
    // Use accumulated transcript (final response without interim results)
    let finalResponse = accumulatedTranscriptRef.current.trim();
    
    // If accumulated is empty but currentResponse has content, use that
    if (!finalResponse && currentResponse.trim()) {
      console.log('⚠️ Using currentResponse as fallback');
      finalResponse = currentResponse.trim();
      accumulatedTranscriptRef.current = finalResponse;
    }
    
    console.log(`📝 Final response length: ${finalResponse.length} characters`);
    console.log(`📄 Response preview: "${finalResponse.substring(0, 100)}..."`);
    
    if (!finalResponse) {
      console.log('❌ No response provided');
      toast.error("Please provide a response before moving to the next question");
      return;
    }

    setLoading(true);
    
    try {
      // Save response to transcript
      console.log(`💾 Saving candidate response for Q${currentQuestion + 1}...`);
      await api.addTranscriptEntry(interviewId!, 'Candidate', finalResponse, Date.now(), currentQuestion);
      console.log('✅ Response saved to transcript');
      
      // Analyze sentiment
      const sentimentScore = analyzeSentiment(finalResponse);
      setSentiment(sentimentScore);
      console.log(`📊 Sentiment score: ${sentimentScore.toFixed(2)}`);
      
      // Store response
      const newResponses = [...responses];
      newResponses[currentQuestion] = finalResponse;
      setResponses(newResponses);
      
      // Move to next question or complete
      if (currentQuestion < questions.length - 1) {
        console.log(`✅ Moving to question ${currentQuestion + 2}/${questions.length}`);
        setCurrentQuestion(currentQuestion + 1);
        
        // Small delay before asking next question to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        await askQuestion(currentQuestion + 1);
      } else {
        console.log('🏁 All questions answered, completing interview...');
        await completeInterview();
        return;
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = () => {
    console.log('\n⏹️ Stopping recording...');
    
    // Stop text-to-speech
    stopSpeaking();
    
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      console.log('✅ Restart timeout cleared');
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      console.log('✅ Health check cleared');
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      console.log('✅ Animation frame cancelled');
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
      console.log('✅ Media stream stopped');
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      console.log('✅ Audio context closed');
    }
    if (recognition) {
      isRestartingRef.current = false;
      recognition.stop();
      console.log('✅ Speech recognition stopped');
    }
    
    setInterviewStarted(false);
    console.log('✅ Recording stopped completely\n');
  };

  const completeInterview = async () => {
    console.log('\n🏁 Completing interview...');
    stopRecording();
    
    setLoading(true);
    console.log('📡 Sending completion request to server...');
    const result = await api.completeInterview(interviewId!);
    setLoading(false);
    
    if (result.error) {
      console.error('❌ Failed to complete interview:', result.error);
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to complete interview';
      toast.error(errMsg);
    } else {
      console.log('✅ Interview completed successfully!');
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
                  
                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-sm font-medium text-blue-400">Speaking</span>
                    </div>
                  )}
                  
                  {/* Mute/Unmute button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) {
                        stopSpeaking();
                        toast.info('Voice muted');
                      } else {
                        toast.info('Voice unmuted');
                      }
                    }}
                    className="gap-2"
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="h-4 w-4" />
                        <span className="hidden sm:inline">Unmute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Mute</span>
                      </>
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
                    
                    {/* Current response display - always show when recording or has content */}
                    <div className="mt-4 p-4 bg-accent/30 rounded-lg text-left min-h-[80px]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Your response:</p>
                        {!currentResponse && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('🔄 Manual restart requested');
                              if (recognition) {
                                try {
                                  recognition.stop();
                                  setTimeout(() => {
                                    recognition.start();
                                    toast.success('Microphone restarted');
                                  }, 500);
                                } catch (err) {
                                  console.error('Manual restart failed:', err);
                                  toast.error('Failed to restart microphone');
                                }
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
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Answer & Next Question
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
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
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          Submit Final Answer & Complete
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
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

export default Interview;
