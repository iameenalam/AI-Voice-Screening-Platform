import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, TrendingUp, Users, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completed: 0,
    inProgress: 0,
    avgSentiment: 0,
  });
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const result = await api.getDashboardStats();
    setLoading(false);

    if (result.error) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : (result.error as any)?.error || "Something went wrong";
      toast.error(errorMessage);
    } else if (result.data) {
      // Ensure stats are properly set with defaults
      setStats({
        totalInterviews: result.data.stats?.totalInterviews || 0,
        completed: result.data.stats?.completed || 0,
        inProgress: result.data.stats?.inProgress || 0,
        avgSentiment: result.data.stats?.avgSentiment || 0,
      });
      setRecentInterviews(result.data.recentInterviews || []);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ✅ Responsive Navbar */}
      <Navbar showActions actionLabel="New Interview" showUserMenu />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your AI screening interviews and view insights
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1">
                  {stats.totalInterviews}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Total Interviews
                </p>
              </Card>

              <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 text-green-500">
                  {stats.completed}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Completed
                </p>
              </Card>

              <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 text-yellow-500">
                  {stats.inProgress}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  In Progress
                </p>
              </Card>

              <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 text-blue-500">
                  {stats.avgSentiment.toFixed(2)}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Avg. Sentiment
                </p>
              </Card>
            </div>

            {/* Recent Interviews */}
            <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Recent Interviews
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-accent/50 transition"
                >
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {recentInterviews.length > 0 ? (
                  recentInterviews.map((interview, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-accent/30 rounded-lg hover:bg-accent/50 border border-border/30 hover:border-border/50 transition-all cursor-pointer"
                      onClick={() =>
                        navigate("/results", {
                          state: { interviewId: interview.id },
                        })
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 text-sm md:text-base truncate">
                          {interview.candidateName}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {interview.candidateRole}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="text-center">
                          <p className="text-xs md:text-sm text-muted-foreground mb-1">
                            Sentiment
                          </p>
                          <p className="font-semibold text-green-500 text-sm md:text-base">
                            +{interview.sentiment?.toFixed(2) || "0.00"}
                          </p>
                        </div>

                        <div className="text-center min-w-[100px] sm:min-w-[120px]">
                          <p className="text-xs md:text-sm text-muted-foreground mb-1">
                            Status
                          </p>
                          <div className="flex items-center gap-2 justify-center">
                            {interview.status === "completed" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                                <span className="text-xs md:text-sm font-medium">
                                  Completed
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                                <span className="text-xs md:text-sm font-medium">
                                  In Progress
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right min-w-[80px] sm:min-w-[100px]">
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {interview.createdAt
                              ? formatDistanceToNow(
                                  new Date(interview.createdAt),
                                  { addSuffix: true }
                                )
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No interviews yet. Start screening candidates!
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
