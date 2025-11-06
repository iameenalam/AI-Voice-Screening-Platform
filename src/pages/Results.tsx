import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, TrendingUp, FileText, AlertCircle } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Interview Completed!</h1>
            <p className="text-muted-foreground">
              AI analysis and transcript are ready for review
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur-sm card-shadow">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                AI Summary
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-lg">
                    Strong Python foundation, confident tone, slight hesitation on teamwork
                    question. Candidate demonstrates technical competency with clear
                    communication skills.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h3 className="font-semibold mb-1 text-sm text-muted-foreground">
                      Sentiment Score
                    </h3>
                    <p className="text-2xl font-bold text-green-500">+0.72</p>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="font-semibold mb-1 text-sm text-muted-foreground">
                      Confidence
                    </h3>
                    <p className="text-2xl font-bold text-blue-500">High</p>
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h3 className="font-semibold mb-1 text-sm text-muted-foreground">
                      Red Flags
                    </h3>
                    <p className="text-2xl font-bold text-yellow-500">None</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm card-shadow">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Interview Transcript
              </h2>

              <div className="space-y-6">
                {[
                  {
                    q: "Tell me about your experience with Python.",
                    a: "I have been working with Python for over 3 years, primarily in web development using Django and Flask. I've built several REST APIs and worked on data processing pipelines...",
                  },
                  {
                    q: "Describe a challenge you faced in a team setting.",
                    a: "In my previous role, we faced a tight deadline for a major feature release. I coordinated with team members to break down tasks and established clear communication channels...",
                  },
                  {
                    q: "Why are you interested in this role?",
                    a: "I'm excited about the opportunity to work on cutting-edge AI products. Your company's mission aligns with my passion for using technology to solve real-world problems...",
                  },
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-primary">Q:</span>
                      <p className="flex-1">{item.q}</p>
                    </div>
                    <div className="flex items-start gap-3 pl-6">
                      <span className="text-sm font-semibold text-muted-foreground">
                        A:
                      </span>
                      <p className="flex-1 text-muted-foreground">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-accent/30 backdrop-blur-sm border-primary/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Strong candidate for technical roles. Consider follow-up questions on team
                    collaboration experiences. Overall assessment: Recommended for next round.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/transcript")}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                View Full Transcript
              </Button>
              <Button
                onClick={() => navigate("/download")}
                className="flex-1 bg-cta hover:bg-cta/90"
                size="lg"
              >
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
