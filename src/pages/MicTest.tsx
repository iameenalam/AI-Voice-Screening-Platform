import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, CheckCircle2, ArrowRight } from "lucide-react";

const MicTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const [testing, setTesting] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  const startTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTestComplete(true);
    }, 3000);
  };

  const handleStartInterview = () => {
    navigate("/interview", { state: { interviewId } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar showUserMenu />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8 text-center animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Test Your Microphone
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Make sure your microphone is working properly before starting the interview
            </p>
          </div>

          <Card className="p-6 md:p-12 bg-card/80 backdrop-blur-xl border-border/50 card-shadow text-center hover-lift animate-fade-in">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="h-12 w-12 text-primary" />
              </div>

              {testing && (
                <div className="mb-6">
                  <VoiceVisualizer isActive={true} />
                </div>
              )}

              {testComplete && (
                <div className="flex items-center justify-center gap-2 text-green-500 mb-6">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-xl font-medium">Microphone working fine!</span>
                </div>
              )}

              {!testing && !testComplete && (
                <p className="text-muted-foreground mb-6">
                  Click the button below to test your microphone
                </p>
              )}

              {testing && (
                <p className="text-muted-foreground mb-6">
                  Say something to test your microphone...
                </p>
              )}
            </div>

            <div className="space-y-4">
              {!testComplete && (
                <Button
                  onClick={startTest}
                  disabled={testing}
                  className="bg-cta hover:bg-cta/90"
                  size="lg"
                >
                  {testing ? "Testing..." : "Test Microphone"}
                </Button>
              )}

              {testComplete && (
                <Button
                  onClick={handleStartInterview}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Start Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MicTest;
