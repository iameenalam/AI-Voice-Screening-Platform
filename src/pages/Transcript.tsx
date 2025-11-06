import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";

const Transcript = () => {
  const navigate = useNavigate();

  const transcript = [
    {
      speaker: "AI",
      text: "Hello! Thank you for joining this interview. Let's get started. Tell me about your experience with Python.",
      time: "00:00",
    },
    {
      speaker: "Candidate",
      text: "I have been working with Python for over 3 years, primarily in web development using Django and Flask. I've built several REST APIs and worked on data processing pipelines using pandas and numpy. Most recently, I developed a microservices architecture for a fintech company.",
      time: "00:15",
    },
    {
      speaker: "AI",
      text: "That sounds impressive. Can you describe a challenge you faced in a team setting?",
      time: "00:45",
    },
    {
      speaker: "Candidate",
      text: "In my previous role, we faced a tight deadline for a major feature release. I coordinated with team members to break down tasks and established clear communication channels through daily standups. We also implemented pair programming sessions which improved code quality and knowledge sharing.",
      time: "01:00",
    },
    {
      speaker: "AI",
      text: "Excellent teamwork approach. Finally, why are you interested in this role?",
      time: "01:35",
    },
    {
      speaker: "Candidate",
      text: "I'm excited about the opportunity to work on cutting-edge AI products. Your company's mission aligns with my passion for using technology to solve real-world problems. I'm particularly interested in your recent work on natural language processing and would love to contribute my Python and API development experience to these projects.",
      time: "01:45",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Full Interview Transcript</h1>
              <p className="text-muted-foreground">Ali Khan - Frontend Developer</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/results")}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => navigate("/download")}
                className="bg-cta hover:bg-cta/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur-sm card-shadow">
            <div className="space-y-6">
              {transcript.map((item, index) => (
                <div
                  key={index}
                  className={`flex gap-4 p-4 rounded-lg ${
                    item.speaker === "AI"
                      ? "bg-primary/5"
                      : "bg-accent/50"
                  }`}
                >
                  <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                    <div className="font-semibold mb-1">{item.speaker}</div>
                    <div>{item.time}</div>
                  </div>
                  <div className="flex-1">
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Transcript;
