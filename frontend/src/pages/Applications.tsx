import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, Download, Search, Filter, Send, Mail, 
  CheckCircle2, Clock, Users, Sparkles, Plus, X, 
  Copy, RefreshCw, ChevronRight, Check, Menu
} from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [filterField, setFilterField] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [uniqueFields, setUniqueFields] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<any>(null);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
            Invited
          </span>
        );
      case 'interviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
            Screened
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-wider">
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
    setSelectedCandidates(prev => prev.length === appliedIds.length ? [] : appliedIds);
  };

  const handleInviteNavigation = (candidate?: any) => {
    if (candidate) {
      navigate("/screening-setup", {
        state: {
          candidateId: candidate._id,
          role: candidate.jobField || candidate.role || 'Role Undefined',
          name: candidate.name || 'Candidate',
          cvUrl: candidate.cvUrl
        }
      });
    } else {
      if (selectedCandidates.length === 0) {
        toast.error("No candidates selected");
        return;
      }
      navigate("/screening-setup", {
        state: {
          candidateIds: selectedCandidates,
          role: 'Multiple Roles',
          name: `Batch Invite (${selectedCandidates.length} Candidates)`,
          isBatch: true
        }
      });
    }
  };

  const handleResendEmail = async (candidate: any) => {
    const result = await api.resendInterviewEmail(candidate._id);
    if (result.error) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.error || 'Failed to resend email';
      toast.error(errMsg);
    } else if (result.data) {
      toast.success(result.data.message || 'Email resent successfully!');
    }
  };

  const handleCopyLink = (candidate: any) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/interview/${candidate.interviewToken}`;
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex font-sans">
      <Sidebar 
        isOpenMobile={isMobileMenuOpen} 
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar matching mock */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-4 flex items-center justify-between shrink-0 gap-4 md:hidden">
          <button 
            className="text-[#64748B] hover:text-[#0A1128]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0A1128]">
              Candidate Pool
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Review CV extractions, issue interview invites, and track screening submissions.
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload-cv")}
            className="w-full sm:w-auto bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-6 px-6 rounded-xl text-sm shadow-sm flex items-center justify-center"
          >
            Add New Candidate
          </Button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center gap-4 h-24">
                  <div className="w-12 h-12 rounded-xl bg-slate-100"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    <div className="h-6 w-8 bg-slate-200 rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm h-[500px]">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
                <div className="h-10 w-[160px] bg-slate-100 rounded-xl"></div>
                <div className="h-10 w-[140px] bg-slate-100 rounded-xl"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-100"></div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Summary Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Applied</span>
                  <span className="text-2xl font-black text-[#0A1128]">{appliedCount}</span>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E6F0FF] flex items-center justify-center text-[#0066FF]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Invited</span>
                  <span className="text-2xl font-black text-[#0A1128]">{invitedCount}</span>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#10B981]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Screened</span>
                  <span className="text-2xl font-black text-[#0A1128]">{interviewedCount}</span>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
            {/* Filter controls row */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-3 py-2 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative min-w-[160px]">
                  <Filter className="absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                  <select
                    className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]"
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value)}
                  >
                    <option value="All">All Job Fields</option>
                    {uniqueFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>

                <div className="relative min-w-[140px]">
                  <Users className="absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                  <select
                    className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="invited">Invited</option>
                    <option value="interviewed">Screened</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Batch invitation actions bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllApplied}
                  className="border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold px-3 py-1.5 rounded-lg text-[#475569]"
                >
                  {selectedCandidates.length > 0 ? "Deselect All" : `Select All Applied (${appliedCount})`}
                </Button>
                {selectedCandidates.length > 0 && (
                  <span className="text-xs font-bold text-[#0066FF]">
                    {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>

              {selectedCandidates.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => handleInviteNavigation()}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white gap-2 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Batch Invites ({selectedCandidates.length})
                </Button>
              )}
            </div>

            {/* Candidates Main Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] text-[#64748B] text-xs font-extrabold uppercase border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox"
                        className="rounded border-[#E2E8F0] accent-[#0066FF]"
                        checked={selectedCandidates.length > 0 && selectedCandidates.length === filteredCandidates.filter(c => (c.status || 'applied') === 'applied').length}
                        onChange={selectAllApplied}
                      />
                    </th>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Job Field</th>
                    <th className="px-6 py-4">Origin</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Uploaded</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          {(candidate.status || 'applied') === 'applied' && (
                            <input 
                              type="checkbox"
                              className="rounded border-[#E2E8F0] accent-[#0066FF]"
                              checked={selectedCandidates.includes(candidate._id)}
                              onChange={() => toggleSelectCandidate(candidate._id)}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0A1128]">{candidate.name}</span>
                            {candidate.isExternal && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wide">
                                Recruiter CV
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#64748B]">{candidate.email}</div>
                        </td>
                        <td className="px-6 py-4 text-[#475569] font-medium">
                          {candidate.jobField || candidate.role || "Not specified"}
                        </td>
                        <td className="px-6 py-4 text-[#64748B]">
                          {candidate.appliedCompany === "All" ? "Multiple Jobs" : (candidate.appliedCompany || "CV Upload")}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(candidate.status || 'applied')}
                        </td>
                        <td className="px-6 py-4 text-[#64748B] text-xs font-semibold">
                          {candidate.createdAt ? formatDistanceToNow(new Date(candidate.createdAt), { addSuffix: true }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {candidate.cvUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadCV(candidate.cvUrl)}
                                className="h-8 w-8 p-0 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                                title="Download Resume/CV"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}

                            {(candidate.status || 'applied') === 'applied' && (
                              <Button
                                size="sm"
                                onClick={() => handleInviteNavigation(candidate)}
                                className="h-8 bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Invite
                              </Button>
                            )}

                            {candidate.status === 'invited' && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendEmail(candidate)}
                                  className="h-8 px-2.5 border-[#E2E8F0] text-[#0066FF] hover:bg-[#E6F0FF] flex items-center gap-1 text-xs font-bold rounded-lg"
                                  title="Resend Invite Email"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  Resend
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(candidate)}
                                  className="h-8 w-8 p-0 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] rounded-lg"
                                  title="Copy Invite URL Link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}

                            {candidate.status === 'interviewed' && candidate.interviewId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/results", { state: { interviewId: candidate.interviewId } })}
                                className="h-8 px-3 border-[#10B981] text-[#10B981] hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 rounded-lg"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Results
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#64748B] italic">
                        No candidates found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          </>
        )}
        </div>
      </main>

    </div>
  );
};

export default Applications;
