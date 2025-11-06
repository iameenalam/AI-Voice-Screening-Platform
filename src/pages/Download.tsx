import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Download as DownloadIcon, FileText, FileSpreadsheet, Code } from "lucide-react";
import { toast } from "sonner";

const Download = () => {
  const navigate = useNavigate();
  const [format, setFormat] = useState<"pdf" | "csv" | "json">("pdf");
  const [includeOptions, setIncludeOptions] = useState({
    transcript: true,
    sentiment: true,
    summary: true,
  });

  const handleDownload = () => {
    toast.success(`Downloading report as ${format.toUpperCase()}...`);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Download Interview Report</h1>
            <p className="text-muted-foreground">
              Choose your preferred format and select what to include
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm card-shadow">
              <h2 className="text-xl font-semibold mb-4">Format Options</h2>
              <div className="grid md:grid-cols-3 gap-3">
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

            <Card className="p-6 bg-card/50 backdrop-blur-sm card-shadow">
              <h2 className="text-xl font-semibold mb-4">Include in Report</h2>
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

            <Card className="p-6 bg-accent/30 backdrop-blur-sm border-primary/20">
              <h2 className="text-xl font-semibold mb-2">Report Summary</h2>
              <p className="text-muted-foreground mb-4">
                Your report will include{" "}
                {Object.values(includeOptions).filter(Boolean).length} sections in{" "}
                {format.toUpperCase()} format.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DownloadIcon className="h-4 w-4" />
                <span>Estimated file size: ~2.5 MB</span>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/results")}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Back to Results
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-cta hover:bg-cta/90"
                size="lg"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
