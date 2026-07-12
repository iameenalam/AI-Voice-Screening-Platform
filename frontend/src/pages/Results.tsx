import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, TrendingUp, FileText, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cleanTranscriptText } from "@/lib/utils";
import { toast } from "sonner";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId || localStorage.getItem('currentInterviewId');
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<any>(null);

  useEffect(() => {
    if (interviewId) {
      loadInterview();
    } else {
      toast.error("Interview not found");
      navigate("/dashboard");
    }
  }, [interviewId]);

  const loadInterview = async () => {
    if (!interviewId) return;
    
    setLoading(true);
    const result = await api.getInterview(interviewId);
    setLoading(false);
    
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : result.error.error);
      navigate("/dashboard");
    } else if (result.data) {
      setInterview({
        ...result.data,
        sentimentScore: result.data.sentimentScore || 0,
        aiAnalyzed: result.data.aiAnalyzed ?? false,
        analysisCoverage: result.data.analysisCoverage ?? 0,
        confidence: result.data.confidence || 'Medium',
        redFlags: result.data.redFlags || [],
        aiSummary: result.data.aiSummary || 'Interview completed successfully. Review the transcript for details.',
        recommendations: result.data.recommendations || 'Review the interview transcript and analysis to make your decision.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const transcriptByQuestion = interview.transcript?.reduce((acc: any, entry: any) => {
    const qIndex = entry.questionIndex >= 0 ? entry.questionIndex : acc.length - 1;
    if (!acc[qIndex]) {
      acc[qIndex] = { question: '', answers: [] };
    }
    if (entry.speaker === 'AI') {
      acc[qIndex].question = entry.text;
    } else {
      acc[qIndex].answers.push(entry.text);
    }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col font-sans">
      <nav className="sticky top-0 w-full z-50 bg-white border-b border-[#E2E8F0] shadow-sm relative">
        <div className="w-full px-4 md:px-8 py-3 flex items-center justify-center">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
        </div>
      </nav>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EBFDF5] flex items-center justify-center border border-[#D1FAE5] shadow-sm">
              <CheckCircle2 className="h-8 w-8 text-[#10B981]" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#0A1128]">
              Interview Dossier Report
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              AI-generated speech evaluation metrics and transcription analysis.
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <h2 className="text-lg font-extrabold mb-4 text-[#0A1128] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#0066FF] flex-shrink-0" />
                AI Summary
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0A1128] leading-relaxed">
                  {interview.aiSummary || "Interview completed successfully. Review the transcript for details."}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#EBFDF5] border border-[#D1FAE5] rounded-xl text-left">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-[#047857] mb-1">
                      Competence Score
                    </h3>
                    {interview.aiAnalyzed ? (
                      <>
                        <p className="text-2xl font-black text-[#10B981]">
                          {interview.sentimentScore?.toFixed(2) || '0.00'}
                          <span className="text-sm font-bold text-[#047857]/60"> / 1.00</span>
                        </p>
                        {interview.analysisCoverage < 1 && (
                          <p className="text-[10px] text-[#047857]/70 mt-1 font-semibold">
                            {Math.round((interview.analysisCoverage || 0) * 100)}% of answers analyzed
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-base font-bold text-[#64748B]">Not analyzed</p>
                    )}
                  </div>

                  <div className="p-4 bg-[#E6F0FF] border border-[#B3D1FF] rounded-xl text-left">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-[#0044CC] mb-1">
                      Confidence
                    </h3>
                    <p className="text-2xl font-black text-[#0066FF]">
                      {interview.aiAnalyzed ? (interview.confidence || 'Medium') : '—'}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-amber-700 mb-1">
                      Red Flags
                    </h3>
                    <p className="text-2xl font-black text-amber-500">
                      {interview.redFlags?.length > 0 ? interview.redFlags.length : 'None'}
                    </p>
                  </div>
                </div>

                {interview.redFlags?.length > 0 && (
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-amber-700 mb-2">
                      Flagged Concerns
                    </h3>
                    <ul className="space-y-1.5">
                      {interview.redFlags.map((flag: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#78350F] font-medium leading-relaxed">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <h2 className="text-lg font-extrabold mb-4 text-[#0A1128] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0066FF] flex-shrink-0" />
                Interview Transcript
              </h2>

              <div className="space-y-6">
                {transcriptByQuestion.length > 0 ? (
                  transcriptByQuestion.map((item: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start gap-2.5 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                        <span className="text-xs font-bold text-[#0066FF] mt-0.5">Q:</span>
                        <p className="flex-1 text-xs font-bold text-[#0A1128] leading-relaxed">{cleanTranscriptText(item.question)}</p>
                      </div>
                      {item.answers.map((answer: string, aIndex: number) => (
                        <div key={aIndex} className="flex items-start gap-2.5 pl-6">
                          <span className="text-xs font-bold text-[#64748B] mt-0.5">A:</span>
                          <p className="flex-1 text-xs font-semibold text-[#475569] leading-relaxed">{cleanTranscriptText(answer)}</p>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#64748B] italic">No transcript available yet.</p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-xs text-[#0A1128] uppercase tracking-wider mb-1">Recruiter Recommendations</h3>
                  <p className="text-xs font-semibold text-[#64748B] leading-relaxed">
                    {interview.recommendations || "Review the interview transcript and analysis to make your decision."}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                onClick={() => navigate("/transcript", { state: { interviewId } })}
                variant="outline"
                className="flex-1 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] py-6 rounded-xl font-bold text-xs"
              >
                View Full Transcript
              </Button>
              <Button
                onClick={() => navigate("/download", { state: { interviewId } })}
                className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white py-6 rounded-xl font-bold text-xs"
              >
                Download Report PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
