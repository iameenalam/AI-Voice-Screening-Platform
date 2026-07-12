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
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "sonner";

// Sentinel posted when a question produced no transcribable audio. The backend
// recognises this and excludes it from analysis (kept in sync with the server).
const NO_RESPONSE = '[[no_response]]';

const speechRecognitionSupported = () =>
  typeof window !== 'undefined' &&
  ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

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
  const isMutedRef = useRef(isMuted);
  const recognitionRef = useRef<any>(null);
  // Tracks whether the SpeechRecognition instance is currently running, so
  // start() is never called while it's already active (that throws
  // InvalidStateError — the mute toggle and the TTS pause/resume logic can
  // both try to start it around the same time).
  const recognitionActiveRef = useRef(false);
  // True while the AI question TTS is playing (recognition is intentionally
  // paused then) and a mirror of `step`, so the onend restart logic can run
  // outside React state/closures.
  const aiSpeakingRef = useRef(false);
  const stepRef = useRef<Step>('loading');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const pendingUploadsRef = useRef<Promise<void>[]>([]);

  // Sync mute ref, and honour mute at the microphone level. Stopping speech
  // recognition alone does NOT stop the MediaRecorder, so without this a
  // "muted" answer would still be recorded, uploaded, transcribed and scored.
  // Disabling the audio tracks makes the captured audio silent.
  useEffect(() => {
    isMutedRef.current = isMuted;
    const tracks = mediaStreamRef.current?.getAudioTracks?.() || [];
    tracks.forEach((t) => {
      t.enabled = !isMuted;
    });
  }, [isMuted]);

  // Pause / Resume speech recognition on mute toggle
  useEffect(() => {
    if (step === 'interview' && recognition) {
      if (isMuted) {
        try {
          recognition.stop();
        } catch (e) {
          console.error("Error stopping recognition:", e);
        }
      } else {
        safeStartRecognition();
      }
    }
  }, [isMuted, recognition, step]);

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
    stepRef.current = step;
  }, [step]);

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
      if (errData?.completed || errData?.in_progress) {
        if (errData?.candidateName) {
          setCandidateName(errData.candidateName);
        }
        setStep('completed');
        return;
      }
      setInterviewError(errData?.error || 'Interview not found');
      setStep('error');
      return;
    }
    
    if (result.data) {
      if (result.data.status === 'completed' || result.data.status === 'in_progress') {
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
      
      setStep('landing');
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
        if (isMutedRef.current) {
          setAudioLevel(0);
          setWaveBars(new Array(15).fill(4));
        } else if (analyser) {
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
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Automatically succeed test after 3 seconds if voice detected.
      // Use the local `detectedVoice` (mutated by checkAudioLevel) rather than
      // the micHealthy state, which is stale inside this closure.
      setTimeout(() => {
        if (detectedVoice) {
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

      rec.onstart = () => { recognitionActiveRef.current = true; };
      rec.onend = () => {
        recognitionActiveRef.current = false;
        // Chrome ends continuous recognition on its own after a few seconds of
        // silence. Restart it so the live caption / fallback transcript keeps
        // working mid-answer — but don't fight the intentional pause during the
        // AI's TTS or while muted.
        if (stepRef.current === 'interview' && !isMutedRef.current && !aiSpeakingRef.current) {
          setTimeout(() => resumeRecognition(), 300);
        }
      };

      rec.start();
      recognitionRef.current = rec;
      setRecognition(rec);
    } else {
      toast.error('Voice transcription is not supported in this browser. Please use Chrome or Edge.');
    }
  };

  const beginInterview = async () => {
    if (!token) return;

    // Block browsers that cannot transcribe, rather than silently running an
    // interview that produces an empty transcript.
    if (!speechRecognitionSupported()) {
      const msg = "Your browser doesn't support voice transcription. Please open this link in Google Chrome or Microsoft Edge.";
      toast.error(msg);
      setInterviewError(msg);
      setStep('error');
      return;
    }

    setLoading(true);

    // Call API to mark as started
    const result = await api.startPublicInterview(token);
    
    setLoading(false);
    
    if (result.error) {
      const errData = typeof result.error === 'string' ? { error: result.error } : (result.error as any);
      const errMsg = errData?.error || "Failed to start interview. The link might have already been used.";
      toast.error(errMsg);
      setInterviewError(errMsg);
      setStep('error');
      return;
    }
    
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

  // Pause recognition while the AI is speaking so the TTS audio isn't captured
  // and transcribed as the candidate's answer (echo loop). Resume afterwards.
  const pauseRecognition = () => {
    try { recognitionRef.current?.stop(); } catch (e) { /* noop */ }
  };
  // Only calls start() when the recognizer isn't already running — calling it
  // while active throws InvalidStateError. Guards against the mute toggle and
  // the TTS pause/resume both trying to (re)start it around the same time.
  const safeStartRecognition = () => {
    if (recognitionActiveRef.current) return;
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // race: start() was already called and onstart hasn't fired yet
    }
  };
  const resumeRecognition = () => {
    if (isMutedRef.current) return;
    safeStartRecognition();
  };

  // --- Answer audio recording ----------------------------------------------
  // Each answer is also recorded with MediaRecorder (reusing the mic-test
  // stream) and uploaded, so the backend can transcribe it accurately for
  // scoring. The browser speech recognition above stays as the live caption
  // and as the fallback text when the upload or transcription fails.

  const pickRecorderMime = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  };

  const startAnswerRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') return;
    if (mediaRecorderRef.current?.state === 'recording') return;
    try {
      const mime = pickRecorderMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recordedChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      rec.start(1000); // collect chunks so a crash loses at most 1s
      mediaRecorderRef.current = rec;
      recordingStartRef.current = Date.now();
    } catch (e) {
      console.warn('Answer recording unavailable:', e);
    }
  };

  const stopAnswerRecording = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === 'inactive') return resolve(null);
      rec.onstop = () => {
        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        resolve(chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null);
      };
      try {
        rec.stop();
      } catch {
        resolve(null);
      }
    });

  const uploadAnswerAudio = async (qIndex: number, blob: Blob | null, durationMs: number) => {
    if (!token || !blob || blob.size < 1024) return; // skip empty/near-empty clips
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([blob], `answer-q${qIndex + 1}.${ext}`, { type: blob.type || 'audio/webm' });
      const uploaded = await uploadFiles('audioUploader', { files: [file] });
      const url = (uploaded?.[0] as any)?.ufsUrl || uploaded?.[0]?.url;
      if (url) await api.addPublicAnswerAudio(token, qIndex, url, durationMs);
    } catch (e) {
      // Non-fatal: the browser transcript remains the fallback for scoring.
      console.warn('Answer audio upload failed:', e);
    }
  };

  const speakQuestion = (text: string) => {
    if (isMuted) {
      // TTS is skipped, so the answer phase starts immediately.
      startAnswerRecording();
      return;
    }
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;

    utterance.onstart = () => {
      // Set before pausing so the recognition onend fired by pauseRecognition()
      // sees the AI is speaking and does not auto-restart mid-question.
      aiSpeakingRef.current = true;
      setIsSpeaking(true);
      pauseRecognition();
    };
    // Start recording only once the AI stops speaking, so the recording (like
    // the recognition) doesn't capture the TTS question audio.
    utterance.onend = () => {
      aiSpeakingRef.current = false;
      setIsSpeaking(false);
      resumeRecognition();
      startAnswerRecording();
    };
    utterance.onerror = () => {
      aiSpeakingRef.current = false;
      setIsSpeaking(false);
      resumeRecognition();
      startAnswerRecording();
    };

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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) { /* noop */ }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (recognition) recognition.stop();
  };

  const handleNextOrComplete = async () => {
    if (!token) return;

    // Stop the answer recording first so the next question's TTS is never
    // captured in this answer's audio.
    const answeredIndex = currentQuestion;
    const durationMs = recordingStartRef.current ? Date.now() - recordingStartRef.current : 0;
    const blobPromise = stopAnswerRecording();

    let finalResponse = accumulatedTranscriptRef.current.trim();
    if (!finalResponse && currentResponse.trim()) {
      finalResponse = currentResponse.trim();
    }

    // No transcribable audio: post a sentinel the backend excludes from
    // analysis, rather than fabricated text scored as a real answer.
    if (!finalResponse) {
      finalResponse = NO_RESPONSE;
    }

    setLoading(true);
    try {
      await api.addPublicTranscriptEntry(token, 'Candidate', finalResponse, Date.now(), answeredIndex);

      // Upload the recording in the background; completion waits for these.
      pendingUploadsRef.current.push(
        blobPromise.then((blob) => uploadAnswerAudio(answeredIndex, blob, durationMs))
      );

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

    // Let in-flight answer uploads finish before finalising, so the backend
    // can transcribe them (bounded: a hung upload can't block completion).
    await Promise.race([
      Promise.allSettled(pendingUploadsRef.current),
      new Promise((r) => setTimeout(r, 20000)),
    ]);

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
              Hello, we're excited to move forward with your application. Start your interview and make sure that you do not close your browser or reload the page.
            </p>



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
                  className="w-full bg-[#0047b3] hover:bg-[#003399] text-white font-bold py-6 rounded-xl text-[14px] mb-4"
                >
                  {micTestRunning ? 'Listening...' : 'Start Test'}
                </Button>
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


        </div>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans relative">
        {/* Top Bar */}
        <nav className="w-full px-8 py-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white relative">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden md:block w-px h-5 bg-[#E2E8F0]"></div>
            <div className="hidden md:flex flex-col">
              <span className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase">Candidate</span>
              <span className="text-[13px] font-extrabold text-[#0A1128]">{candidateName}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <div className="px-3 py-1.5 bg-[#F1F5F9] rounded-lg text-[13px] font-mono font-bold text-[#0A1128] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#64748B]" /> {formatTime(timer)}
            </div>
          </div>

          {/* Thin progress bar line below nav */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F1F5F9]">
            <div 
              className="h-full bg-[#0047b3] transition-all duration-300" 
              style={{ width: `${((currentQuestion + 1) / Math.max(1, questions.length)) * 100}%` }}
            />
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
          {/* Card Container */}
          <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 md:p-12 max-w-3xl w-full flex flex-col gap-8">
            
            {/* Header Stage Badge & Status Indicator */}
            <div className="flex justify-between items-center">
              <div className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[10px] font-extrabold text-[#0047b3] tracking-widest uppercase">
                {questions[currentQuestion]?.category || "TECHNICAL EVALUATION"}
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[10px] font-bold text-[#64748B] tracking-wider uppercase">
                <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-[#0047b3] animate-pulse' : 'bg-[#10B981]'}`} />
                {isSpeaking ? 'AI Speaking' : 'Listening'}
              </div>
            </div>

            {/* Question Area */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] leading-relaxed tracking-tight">
                {typeof questions[currentQuestion] === 'string' ? questions[currentQuestion] : questions[currentQuestion]?.text}
              </h2>
            </div>

            {/* Audio Feedback & Waveform section */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden gap-4">
              {/* Waveform visualization */}
              <div className="flex items-center justify-center gap-1 h-8">
                {isMuted ? (
                  <span className="text-[11px] font-bold text-[#C92A2A] tracking-wider uppercase flex items-center gap-1">
                    <MicOff className="h-4 w-4" /> Microphone Muted
                  </span>
                ) : isSpeaking ? (
                  <div className="flex justify-center items-center gap-1.5 h-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0047b3] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0047b3] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0047b3] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <>
                    {waveBars.slice(0, 12).map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-[#0047b3] rounded-full transition-all duration-75" 
                        style={{ height: `${Math.max(4, h * 0.7)}px` }} 
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Transcription Text */}
              <div className="text-center text-[13px] font-medium max-w-md">
                {isMuted ? (
                  <span className="text-[#94A3B8]">Your microphone is muted. Click unmute to speak.</span>
                ) : currentResponse ? (
                  <span className="text-[#334155] font-semibold italic">"{currentResponse}"</span>
                ) : (
                  <span className="text-[#94A3B8] animate-pulse">Waiting for audio transcription...</span>
                )}
              </div>
            </div>

            {/* Controls Area */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0]">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl border text-[13px] font-bold tracking-wider transition-colors ${
                  isMuted 
                    ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#C92A2A] hover:bg-[#FEE2E2]' 
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </button>

              <button
                onClick={handleNextOrComplete}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#C92A2A] hover:bg-[#b02222] disabled:opacity-50 text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4 rotate-[135deg]" />}
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'End Interview'}
              </button>
            </div>

          </div>
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
            
            <p className="text-[15px] text-[#475569] leading-relaxed mb-0 relative z-10">
              Thank you, <span className="font-bold text-[#0A1128]">{candidateName}</span>. Your interview has been successfully submitted. The recruitment team will be in touch shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PublicInterview;
