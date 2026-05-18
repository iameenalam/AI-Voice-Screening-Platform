import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { Loader2, Download, Search, Filter, Send, Mail, CheckCircle2, Clock, Users, Sparkles, Plus, X, Copy, Link, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HOST_URL = API_BASE_URL.replace('/api', '');

const Applications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [filterField, setFilterField] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [uniqueFields, setUniqueFields] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<any>(null); // single candidate or null for batch
  const [inviteQuestions, setInviteQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const result = await api.getCandidates();
    setLoading(false);

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to load applications');
    } else if (result.data) {
      const data = result.data;
      setCandidates(data);
      setFilteredCandidates(data);
      
      const fields = new Set(data.map(c => c.jobField || c.role || "Unknown"));
      setUniqueFields(Array.from(fields) as string[]);
    }
  };

  useEffect(() => {
    let result = candidates;
    
    if (filterField !== "All") {
      result = result.filter(c => (c.jobField || c.role || "Unknown") === filterField);
    }

    if (filterStatus !== "All") {
      result = result.filter(c => (c.status || "applied") === filterStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.name?.toLowerCase() || "").includes(query) ||
        (c.email?.toLowerCase() || "").includes(query) ||
        (c.appliedCompany?.toLowerCase() || "").includes(query)
      );
    }
    
    setFilteredCandidates(result);
  }, [filterField, filterStatus, searchQuery, candidates]);

  const handleDownloadCV = async (cvUrl: string) => {
    if (!cvUrl) {
      toast.error('No CV/Resume available for this candidate');
      return;
    }
    
    try {
      toast.loading("Downloading CV...", { id: "download-cv" });
      const isAbsoluteUrl = cvUrl.startsWith('http://') || cvUrl.startsWith('https://');
      let fetchUrl = isAbsoluteUrl ? cvUrl : `${HOST_URL}${cvUrl}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cvUrl.split('/').pop()?.split('?')[0] || 'Candidate_CV.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download complete", { id: "download-cv" });
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download CV", { id: "download-cv" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Mail className="h-3 w-3" />
            Invited
          </span>
        );
      case 'interviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Interviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="h-3 w-3" />
            Applied
          </span>
        );
    }
  };

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const selectAllApplied = () => {
    const appliedIds = filteredCandidates
      .filter(c => (c.status || 'applied') === 'applied')
      .map(c => c._id);
    setSelectedCandidates(appliedIds);
  };

  const openInviteModal = (candidate?: any) => {
    setInviteTarget(candidate || null);
    setInviteQuestions([
      "Tell me about your experience with this role.",
      "Describe a challenge you faced in a team setting.",
      "Why are you interested in this position?",
      "What are your strengths and weaknesses?",
      "Where do you see yourself in 5 years?",
    ]);
    setShowInviteModal(true);
  };

  const generateQuestionsForRole = async (role: string) => {
    setGenerating(true);
    const result = await api.generateQuestions(role);
    setGenerating(false);
    if (result.data?.questions) {
      setInviteQuestions(result.data.questions);
    }
  };

  const handleSendInvite = async () => {
    if (inviteQuestions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setSending(true);

    if (inviteTarget) {
      // Single invite
      const result = await api.sendInterviewInvite(inviteTarget._id, inviteQuestions);
      setSending(false);

      if (result.error) {
        const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to send';
        toast.error(errMsg);
      } else if (result.data) {
        if (result.data.emailFailed) {
          toast.warning(`Interview created but email failed. Link: ${result.data.interviewLink}`);
        } else {
          toast.success(result.data.message || 'Interview invitation sent!');
        }
        setShowInviteModal(false);
        loadApplications();
      }
    } else {
      // Batch invite
      const ids = selectedCandidates.length > 0 ? selectedCandidates : [];
      if (ids.length === 0) {
        toast.error("No candidates selected");
        setSending(false);
        return;
      }

      const result = await api.batchSendInvites(ids, inviteQuestions);
      setSending(false);

      if (result.error) {
        const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed';
        toast.error(errMsg);
      } else if (result.data) {
        toast.success(result.data.message || 'Invitations sent!');
        setShowInviteModal(false);
        setSelectedCandidates([]);
        loadApplications();
      }
    }
  };

  const handleResendEmail = async (candidate: any) => {
    const result = await api.resendInterviewEmail(candidate._id);
    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to resend email';
      toast.error(errMsg);
      // If the error response includes interviewLink, show copy option
      const errData = result.error as any;
      if (errData?.interviewLink || (result as any)?.data?.interviewLink) {
        const link = errData?.interviewLink || (result as any)?.data?.interviewLink;
        handleCopyLink(link);
      }
    } else if (result.data) {
      toast.success(result.data.message || 'Email resent successfully!');
    }
  };

  const handleCopyLink = (linkOrCandidate: any) => {
    let link: string;
    if (typeof linkOrCandidate === 'string') {
      link = linkOrCandidate;
    } else {
      // Build link from candidate token
      const baseUrl = window.location.origin;
      link = `${baseUrl}/interview/${linkOrCandidate.interviewToken}`;
    }
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Interview link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const appliedCount = candidates.filter(c => (c.status || 'applied') === 'applied').length;
  const invitedCount = candidates.filter(c => c.status === 'invited').length;
  const interviewedCount = candidates.filter(c => c.status === 'interviewed').length;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />

      <Navbar showActions={false} showUserMenu={true} />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1 relative z-10">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Candidate Pool
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Review, manage, and send interview invitations to candidates
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
          <Card className="p-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appliedCount}</p>
                <p className="text-xs text-muted-foreground">Applied</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitedCount}</p>
                <p className="text-xs text-muted-foreground">Invited</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{interviewedCount}</p>
                <p className="text-xs text-muted-foreground">Interviewed</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm animate-fade-in">
            {/* Filters + Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                >
                  <option value="All">All Fields</option>
                  {uniqueFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              <div className="relative min-w-[140px]">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="invited">Invited</option>
                  <option value="interviewed">Interviewed</option>
                </select>
              </div>
            </div>

            {/* Batch Actions Bar */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllApplied}
                  className="border-border/50 text-xs"
                >
                  Select All Applied ({appliedCount})
                </Button>
                {selectedCandidates.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedCandidates.length} selected
                  </span>
                )}
              </div>
              {selectedCandidates.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => openInviteModal()}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Invites ({selectedCandidates.length})
                </Button>
              )}
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto rounded-md border border-border/50">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">
                      <input 
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedCandidates.length > 0 && selectedCandidates.length === filteredCandidates.filter(c => (c.status || 'applied') === 'applied').length}
                        onChange={selectAllApplied}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Candidate</th>
                    <th className="px-4 py-3 font-medium">Field</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Applied</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          {(candidate.status || 'applied') === 'applied' && (
                            <input 
                              type="checkbox"
                              className="rounded border-border"
                              checked={selectedCandidates.includes(candidate._id)}
                              onChange={() => toggleSelectCandidate(candidate._id)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-foreground">{candidate.name}</div>
                            {candidate.isExternal && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Manually uploaded by recruiter">
                                Recruiter Upload
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {candidate.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {candidate.jobField || candidate.role || "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {candidate.appliedCompany === "All" ? "Multiple" : (candidate.appliedCompany || "Direct Upload")}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(candidate.status || 'applied')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {candidate.createdAt ? formatDistanceToNow(new Date(candidate.createdAt), { addSuffix: true }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {candidate.cvUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadCV(candidate.cvUrl)}
                                className="h-8 shadow-sm flex items-center gap-1.5 border-border/50"
                                title="Download CV/Resume"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span className="text-xs hidden sm:inline">CV</span>
                              </Button>
                            )}
                            {(candidate.status || 'applied') === 'applied' && (
                              <Button
                                size="sm"
                                onClick={() => openInviteModal(candidate)}
                                className="h-8 shadow-sm flex items-center gap-1.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background"
                                title="Send Interview Invitation"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span className="text-xs hidden sm:inline">Invite</span>
                              </Button>
                            )}
                            {candidate.status === 'invited' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendEmail(candidate)}
                                  className="h-8 shadow-sm flex items-center gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                  title="Resend Interview Email"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span className="text-xs hidden sm:inline">Resend</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(candidate)}
                                  className="h-8 shadow-sm flex items-center gap-1.5 border-border/50"
                                  title="Copy Interview Link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="text-xs hidden sm:inline">Link</span>
                                </Button>
                              </>
                            )}
                            {candidate.status === 'interviewed' && candidate.interviewId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/results", { state: { interviewId: candidate.interviewId } })}
                                className="h-8 shadow-sm flex items-center gap-1.5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                                title="View Results"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-xs hidden sm:inline">Results</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No candidates found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Interview Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50 shadow-2xl p-6 animate-fade-in custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {inviteTarget 
                    ? `Send Interview to ${inviteTarget.name}` 
                    : `Send Interview to ${selectedCandidates.length} Candidates`
                  }
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure interview questions before sending the invitation
                </p>
              </div>
            </div>

            {/* AI Generate */}
            {inviteTarget && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateQuestionsForRole(inviteTarget.jobField || inviteTarget.role || '')}
                  disabled={generating}
                  className="gap-2"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 text-primary" />Generate AI Questions for {inviteTarget.jobField || inviteTarget.role || 'this role'}</>
                  )}
                </Button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <Label className="text-sm font-medium">Interview Questions</Label>
              {inviteQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg group">
                  <span className="text-sm text-muted-foreground mt-0.5">{i + 1}.</span>
                  <p className="flex-1 text-sm">{q}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInviteQuestions(inviteQuestions.filter((_, idx) => idx !== i))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Custom Question */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">Add Custom Question</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter your custom question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="bg-input min-h-[60px] flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newQuestion.trim()) {
                      setInviteQuestions([...inviteQuestions, newQuestion.trim()]);
                      setNewQuestion("");
                    }
                  }}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={sending || inviteQuestions.length === 0}
                className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background gap-2"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4" />Send Interview Invitation</>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Applications;
