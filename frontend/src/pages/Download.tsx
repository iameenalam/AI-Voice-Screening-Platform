import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { Download as DownloadIcon, FileText, FileSpreadsheet, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const Download = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState<any>(null);
  const [format, setFormat] = useState<"pdf" | "csv" | "json">("pdf");
  const [includeOptions, setIncludeOptions] = useState({
    transcript: true,
    sentiment: true,
    summary: true,
  });

  useEffect(() => {
    if (interviewId) {
      loadInterview();
    }
  }, [interviewId]);

  const loadInterview = async () => {
    if (!interviewId) return;
    
    const result = await api.getInterview(interviewId);
    if (result.data) {
      setInterview(result.data);
    }
  };

  const handleDownload = () => {
    if (!interview) {
      toast.error("Interview data not available");
      return;
    }

    setLoading(true);
    
    // Generate report data
    const reportData: any = {};
    
    if (includeOptions.transcript) {
      reportData.transcript = interview.transcript || [];
    }
    
    if (includeOptions.sentiment) {
      reportData.sentiment = {
        score: interview.sentimentScore,
        confidence: interview.confidence,
        redFlags: interview.redFlags || [],
      };
    }
    
    if (includeOptions.summary) {
      reportData.summary = interview.aiSummary;
      reportData.recommendations = interview.recommendations;
    }

    reportData.candidate = interview.candidateId;
    reportData.date = interview.completedAt || interview.createdAt;

    // Create and download file
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(reportData, null, 2);
      filename = `interview-report-${interviewId}.json`;
      mimeType = "application/json";
    } else if (format === "csv") {
      // Simple CSV conversion
      const rows = [
        ["Field", "Value"],
        ["Candidate", interview.candidateId?.name || "N/A"],
        ["Role", interview.candidateId?.role || "N/A"],
        ["Sentiment Score", interview.sentimentScore?.toFixed(2) || "N/A"],
        ["Confidence", interview.confidence || "N/A"],
        ["Summary", interview.aiSummary || "N/A"],
      ];
      content = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
      filename = `interview-report-${interviewId}.csv`;
      mimeType = "text/csv";
    } else {
      // PDF - simple text representation (in production, use a PDF library)
      content = `Interview Report\n\n`;
      content += `Candidate: ${interview.candidateId?.name || "N/A"}\n`;
      content += `Role: ${interview.candidateId?.role || "N/A"}\n\n`;
      if (includeOptions.sentiment) {
        content += `Sentiment Score: ${interview.sentimentScore?.toFixed(2) || "N/A"}\n`;
        content += `Confidence: ${interview.confidence || "N/A"}\n\n`;
      }
      if (includeOptions.summary) {
        content += `Summary:\n${interview.aiSummary || "N/A"}\n\n`;
      }
      if (includeOptions.transcript) {
        content += `Transcript:\n`;
        interview.transcript?.forEach((entry: any) => {
          content += `${entry.speaker}: ${entry.text}\n`;
        });
      }
      filename = `interview-report-${interviewId}.txt`;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLoading(false);
    toast.success(`Report downloaded as ${format.toUpperCase()}!`);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Download Interview Report
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Choose your preferred format and select what to include
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-4 sm:p-6 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4">Format Options</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: "pdf", label: "PDF", icon: FileText },
                  { value: "csv", label: "CSV", icon: FileSpreadsheet },
                  { value: "json", label: "JSON", icon: Code },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value as typeof format)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      format === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <option.icon className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">{option.label}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-card/80 backdrop-blur-xl border-border/50 card-shadow hover-lift animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4">Include in Report</h2>
              <div className="space-y-4">
                {[
                  { id: "transcript", label: "Full Transcript" },
                  { id: "sentiment", label: "Sentiment Analysis" },
                  { id: "summary", label: "AI Interview Summary" },
                ].map((option) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.id}
                      checked={includeOptions[option.id as keyof typeof includeOptions]}
                      onCheckedChange={(checked) =>
                        setIncludeOptions({
                          ...includeOptions,
                          [option.id]: checked,
                        })
                      }
                    />
                    <Label
                      htmlFor={option.id}
                      className="text-base cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 backdrop-blur-xl border-primary/30 shadow-lg animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Report Summary</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 md:mb-4">
                Your report will include{" "}
                {Object.values(includeOptions).filter(Boolean).length} sections in{" "}
                {format.toUpperCase()} format.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DownloadIcon className="h-4 w-4" />
                <span>Estimated file size: ~2.5 MB</span>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate("/results", { state: { interviewId } })}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto sm:flex-1 hover:bg-accent/50 border-border/50 transition-all"
              >
                Back to Results
              </Button>
              <Button
                onClick={handleDownload}
                className="w-full sm:w-auto sm:flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-lg hover:shadow-xl transition-all"
                size="lg"
                disabled={loading || !interview}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="mr-2 h-5 w-5" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
