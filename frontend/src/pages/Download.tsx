import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { Download as DownloadIcon, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { jsPDF } from "jspdf";

const Download = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState<any>(null);
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
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

    if (format === "csv") {
      const rows = [
        ["Field", "Value"],
        ["Candidate", interview.candidateId?.name || "N/A"],
        ["Email", interview.candidateId?.email || "N/A"],
        ["Role", interview.candidateId?.role || "N/A"],
      ];

      if (includeOptions.sentiment) {
        rows.push(["Sentiment Score", `+${interview.sentimentScore?.toFixed(2) || "0.00"}`]);
        rows.push(["Confidence Level", interview.confidence || "Medium"]);
        rows.push(["Red Flags", interview.redFlags?.length > 0 ? String(interview.redFlags.length) : "None"]);
      }

      if (includeOptions.summary) {
        rows.push(["AI Summary", interview.aiSummary || "N/A"]);
        rows.push(["Recommendations", interview.recommendations || "N/A"]);
      }

      if (includeOptions.transcript && interview.transcript) {
        rows.push([]);
        rows.push(["Speaker", "Utterance"]);
        interview.transcript.forEach((entry: any) => {
          rows.push([entry.speaker || "N/A", entry.text || "N/A"]);
        });
      }

      content = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      filename = `interview-report-${interviewId}.csv`;
      mimeType = "text/csv";

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
      toast.success("Report downloaded as CSV!");
    } else {
      // PDF - generate a real PDF using jsPDF
      const doc = new jsPDF();
      let y = 15;
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(10, 17, 40); // #0A1128
      doc.text("Vocalent - Voice Screening Dossier Report", 15, y);
      y += 12;

      // Date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // #64748B
      const reportDate = new Date(interview.completedAt || interview.createdAt).toLocaleDateString();
      doc.text(`Generated on: ${reportDate}`, 15, y);
      y += 15;

      // Candidate Info Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 71, 179); // #0047b3
      doc.text("Candidate Details", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // #0F172A
      doc.text(`Name: ${interview.candidateId?.name || "N/A"}`, 15, y);
      y += 6;
      doc.text(`Email: ${interview.candidateId?.email || "N/A"}`, 15, y);
      y += 6;
      doc.text(`Role: ${interview.candidateId?.role || "N/A" || interview.jobField}`, 15, y);
      y += 15;

      if (includeOptions.sentiment) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 71, 179);
        doc.text("AI Evaluation Metrics", 15, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`Sentiment Score: +${interview.sentimentScore?.toFixed(2) || "0.00"}`, 15, y);
        y += 6;
        doc.text(`Confidence Level: ${interview.confidence || "Medium"}`, 15, y);
        y += 6;
        doc.text(`Red Flags: ${interview.redFlags?.length > 0 ? String(interview.redFlags.length) : "None"}`, 15, y);
        y += 15;
      }

      if (includeOptions.summary) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 71, 179);
        doc.text("AI Interview Summary", 15, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // #475569
        
        const summaryLines = doc.splitTextToSize(interview.aiSummary || "No summary available.", 180);
        doc.text(summaryLines, 15, y);
        y += (summaryLines.length * 5) + 10;

        if (interview.recommendations) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(10, 17, 40);
          doc.text("Recommendations:", 15, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const recLines = doc.splitTextToSize(interview.recommendations, 180);
          doc.text(recLines, 15, y);
          y += (recLines.length * 5) + 15;
        }
      }

      if (includeOptions.transcript && interview.transcript && interview.transcript.length > 0) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 71, 179);
        doc.text("Interview Transcript", 15, y);
        y += 10;

        doc.setFontSize(10);
        interview.transcript.forEach((entry: any) => {
          const entryLines = doc.splitTextToSize(entry.text, 150);
          
          if (y + (entryLines.length * 5) > 280) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.text(`${entry.speaker}:`, 15, y);
          
          doc.setFont("helvetica", "normal");
          doc.text(entryLines, 35, y);
          
          y += (entryLines.length * 5) + 4;
        });
      }

      doc.save(`interview-report-${interviewId}.pdf`);
      setLoading(false);
      toast.success("Report downloaded as PDF!");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      <nav className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm relative">
        <div className="w-full px-4 md:px-8 py-3 flex items-center justify-center">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
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
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "pdf", label: "PDF", icon: FileText },
                  { value: "csv", label: "CSV", icon: FileSpreadsheet },
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
