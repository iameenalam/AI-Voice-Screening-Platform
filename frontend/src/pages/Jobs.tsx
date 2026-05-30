import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Menu, Plus, Briefcase, Trash2, Edit2, X, CheckCircle2, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from 'react-markdown';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const result = await api.getJobs();
    setLoading(false);
    if (result.data) {
      setJobs(result.data);
    } else if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to load jobs');
    }
  };

  const handleOpenModal = (job: any = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        department: job.department || "",
        description: job.description || "",
      });
    } else {
      setEditingJob(null);
      setFormData({ title: "", department: "", description: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Job title is required");

    let result;
    if (editingJob) {
      result = await api.updateJob(editingJob._id, formData);
    } else {
      result = await api.createJob(formData);
    }

    if (result.data) {
      toast.success(`Job ${editingJob ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      loadJobs();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to save job');
    }
  };

  const toggleStatus = async (job: any) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    const result = await api.updateJob(job._id, { status: newStatus });
    if (result.data) {
      toast.success(`Job marked as ${newStatus}`);
      loadJobs();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job opening?")) return;
    const result = await api.deleteJob(id);
    if (result.data) {
      toast.success("Job deleted successfully");
      loadJobs();
    } else {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0F172A] flex font-sans">
      <Sidebar 
        isOpenMobile={isMobileMenuOpen} 
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-4 flex items-center justify-between shrink-0 gap-4">
          <button 
            className="md:hidden text-[#64748B] hover:text-[#0A1128]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-[#64748B]">
            <Button onClick={() => handleOpenModal()} className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> New Opening
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0A1128]">Job Openings</h1>
              <p className="text-sm text-[#64748B] mt-1">Manage the roles you are actively hiring for.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 h-[220px] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-5 w-16 bg-slate-100 rounded-md"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-slate-100 rounded-md"></div>
                      <div className="h-8 w-8 bg-slate-100 rounded-md"></div>
                    </div>
                  </div>
                  <div>
                    <div className="h-6 w-3/4 bg-slate-200 rounded mb-3"></div>
                    <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="w-16 h-16 bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#0066FF] mb-6">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-[#0A1128] mb-2">No Job Openings Yet</h3>
              <p className="text-sm text-[#64748B] mb-8">Create your first job opening to allow candidates to apply specifically for this role.</p>
              <Button onClick={() => handleOpenModal()} className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold px-6 py-6 rounded-xl text-sm flex items-center gap-2 shadow-sm">
                <Plus className="h-5 w-5" /> Create First Job
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <Card key={job._id} className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${job.status === 'open' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                      {job.status}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(job)} className="text-[#94A3B8] hover:text-[#0A1128] transition-colors p-1"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(job._id)} className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#0A1128] line-clamp-1">{job.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1 mb-4 font-medium">
                    <Building2 className="h-3 w-3" /> {job.department || 'General'}
                  </div>
                  <div className="text-sm text-[#475569] mb-6 flex-1 overflow-hidden relative">
                    <div className="prose prose-sm prose-slate max-w-none text-[#475569] line-clamp-4">
                      <ReactMarkdown>{job.description || 'No description provided.'}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
                    <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleStatus(job)}
                      className={`h-8 text-xs font-bold ${job.status === 'open' ? 'text-[#EF4444] border-[#FEE2E2] hover:bg-[#FEF2F2]' : 'text-[#10B981] border-[#D1FAE5] hover:bg-[#ECFDF5]'}`}
                    >
                      {job.status === 'open' ? 'Close Opening' : 'Reopen'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-[#0A1128]">
                {editingJob ? "Edit Job Opening" : "Create New Job Opening"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Job Title</Label>
                <Input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="bg-[#F8FAFC] border-none rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Department / Team</Label>
                <Input 
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Engineering"
                  className="bg-[#F8FAFC] border-none rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Brief Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="What are the key requirements?"
                  className="bg-[#F8FAFC] border-none rounded-xl min-h-[120px] resize-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold">
                  {editingJob ? "Save Changes" : "Create Job"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
