import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { Loader2, Download, Search, Filter } from "lucide-react";
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
  const [uniqueFields, setUniqueFields] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
      
      // Extract unique fields for the filter dropdown
      const fields = new Set(data.map(c => c.jobField || c.role || "Unknown"));
      setUniqueFields(Array.from(fields) as string[]);
    }
  };

  useEffect(() => {
    let result = candidates;
    
    if (filterField !== "All") {
      result = result.filter(c => (c.jobField || c.role || "Unknown") === filterField);
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
  }, [filterField, searchQuery, candidates]);

  const handleDownloadCV = (cvUrl: string) => {
    if (!cvUrl) {
      toast.error('No CV/Resume available for this candidate');
      return;
    }
    window.open(`${HOST_URL}${cvUrl}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />

      <Navbar showActions={false} showUserMenu={true} />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1 relative z-10">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Applications
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Review and manage incoming candidate applications
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm animate-fade-in">
            {/* Filters */}
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
              <div className="relative min-w-[200px]">
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
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto rounded-md border border-border/50">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Candidate</th>
                    <th className="px-4 py-3 font-medium">Field</th>
                    <th className="px-4 py-3 font-medium">Applied Company</th>
                    <th className="px-4 py-3 font-medium">Applied Date</th>
                    <th className="px-4 py-3 font-medium text-right">CV/Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{candidate.name}</div>
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
                                className="h-8 shadow-sm flex items-center gap-2 border-border/50"
                                title="Download CV/Resume"
                              >
                                <Download className="h-4 w-4" />
                                <span className="text-xs">Download</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
    </div>
  );
};

export default Applications;
