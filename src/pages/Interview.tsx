import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useNavigate } from "react-router-dom";
import { Mic, Phone } from "lucide-react";

const Interview = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(0);
  const [sentiment, setSentiment] = useState(0.72);

  const questions = [
    "Tell me about your experience with Python.",
    "Describe a challenge you faced in a team setting.",
    "Why are you interested in this role?",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    const questionInterval = setInterval(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        navigate("/results");
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(questionInterval);
    };
  }, [currentQuestion, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Recording</span>
            </div>
            <span className="text-sm font-mono">{formatTime(timer)}</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Interview in Progress</h1>
            <p className="text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur-sm card-shadow">
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-16 w-16 text-primary" />
                </div>
                <VoiceVisualizer isActive={isActive} className="mb-6" />
                <p className="text-xl mb-4">{questions[currentQuestion]}</p>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-green-500/20">
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                  Real-time Insights
                </h3>
                <p className="text-lg">
                  Positive trend{" "}
                  <span className="text-green-500 font-bold">+{sentiment}</span> sentiment
                  score
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
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

            <Button
              onClick={() => navigate("/results")}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <Phone className="mr-2 h-5 w-5" />
              End Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
