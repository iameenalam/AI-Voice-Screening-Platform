import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate } from "react-router-dom";
import { Mic, CheckCircle2 } from "lucide-react";

const MicTest = () => {
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  const startTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTestComplete(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Test Your Microphone</h1>
            <p className="text-muted-foreground">
              Make sure your microphone is working properly before starting the interview
            </p>
          </div>

          <Card className="p-12 bg-card/50 backdrop-blur-sm card-shadow text-center">
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
                  onClick={() => navigate("/interview")}
                  className="bg-cta hover:bg-cta/90"
                  size="lg"
                >
                  Start Interview
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
