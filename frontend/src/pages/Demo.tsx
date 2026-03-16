import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";

const Demo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Try a Sample Interview</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Experience Vocalent's AI voice screening as a candidate
          </p>

          <Card className="p-12 bg-card/50 backdrop-blur-sm card-shadow">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Play className="h-16 w-16 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-4">Sample Position: Frontend Developer</h2>
            <p className="text-muted-foreground mb-8">
              This demo interview will ask you 3 questions about frontend development. 
              Your responses will be analyzed in real-time to showcase Vocalent's capabilities.
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => navigate("/mic-test")}
                size="lg"
                className="w-full bg-cta hover:bg-cta/90"
              >
                Start Demo Interview
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Demo;
