import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Sparkles, Plus, X } from "lucide-react";

const ScreeningSetup = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([
    "Tell me about your experience with Python.",
    "Describe a challenge you faced in a team setting.",
    "Why are you interested in this role?",
  ]);
  const [newQuestion, setNewQuestion] = useState("");

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion]);
      setNewQuestion("");
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    navigate("/mic-test");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Set Up Screening Questions</h1>
            <p className="text-muted-foreground">
              Customize questions or use our AI-suggested ones for your interview
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">AI Suggested Questions</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                These questions are tailored for the Frontend Developer role
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

            <Card className="p-6 bg-card/50 backdrop-blur-sm card-shadow">
              <h3 className="font-semibold mb-4">Add Custom Question</h3>
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
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </Card>

            <Button
              onClick={handleSubmit}
              className="w-full bg-cta hover:bg-cta/90"
              size="lg"
            >
              Continue to Mic Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreeningSetup;
