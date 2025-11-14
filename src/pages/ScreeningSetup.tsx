import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Plus, X, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ScreeningSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const candidateId = location.state?.candidateId || localStorage.getItem('currentCandidateId');
  const role = location.state?.role || '';

  useEffect(() => {
    if (role) {
      loadSuggestedQuestions();
    } else {
      // Default questions if no role
      setQuestions([
        "Tell me about your experience with this role.",
        "Describe a challenge you faced in a team setting.",
        "Why are you interested in this position?",
      ]);
    }
  }, [role]);

  const loadSuggestedQuestions = async () => {
    setGenerating(true);
    const result = await api.generateQuestions(role);
    setGenerating(false);
    
    if (result.data?.questions) {
      setQuestions(result.data.questions);
    } else {
      // Fallback questions
      setQuestions([
        "Tell me about your experience with this role.",
        "Describe a challenge you faced in a team setting.",
        "Why are you interested in this position?",
      ]);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion]);
      setNewQuestion("");
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    if (!candidateId) {
      toast.error("Candidate information missing. Please go back and upload CV again.");
      return;
    }

    setLoading(true);
    const result = await api.createInterview(candidateId, questions);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      localStorage.setItem('currentInterviewId', result.data._id);
      navigate("/mic-test", { state: { interviewId: result.data._id } });
    }
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
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Set Up Screening Questions
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Customize questions or use our AI-suggested ones for your interview
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base md:text-lg">AI Suggested Questions</h3>
                {generating && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin ml-2" />
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
                {role ? `These questions are tailored for ${role}` : "AI-generated interview questions"}
              </p>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg group"
                  >
                    <span className="text-sm text-muted-foreground mt-1">
                      {index + 1}.
                    </span>
                    <p className="flex-1">{question}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
              <h3 className="font-semibold mb-4 text-base md:text-lg">Add Custom Question</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-question">Question</Label>
                  <Textarea
                    id="new-question"
                    placeholder="Enter your custom question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="bg-input min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleAddQuestion}
                  variant="outline"
                  className="w-full hover:bg-accent/50 border-border/50 transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </Card>

            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={loading || questions.length === 0}
            >
              {loading ? "Creating Interview..." : "Continue to Mic Test"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ScreeningSetup;
