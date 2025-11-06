import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, TrendingUp, Users, Plus } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  const recentInterviews = [
    {
      name: "Ali Khan",
      role: "Frontend Developer",
      status: "Completed",
      sentiment: 0.72,
      date: "2 hours ago",
    },
    {
      name: "Sarah Ahmed",
      role: "Product Manager",
      status: "In Progress",
      sentiment: 0.65,
      date: "5 hours ago",
    },
    {
      name: "Omar Hassan",
      role: "Backend Engineer",
      status: "Completed",
      sentiment: 0.81,
      date: "1 day ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button onClick={() => navigate("/upload-cv")} className="bg-cta hover:bg-cta/90">
            <Plus className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your AI screening interviews and view insights
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Users,
              label: "Total Interviews",
              value: "24",
              trend: "+12%",
            },
            {
              icon: CheckCircle2,
              label: "Completed",
              value: "18",
              trend: "+8%",
            },
            {
              icon: Clock,
              label: "In Progress",
              value: "6",
              trend: "+2%",
            },
            {
              icon: TrendingUp,
              label: "Avg. Sentiment",
              value: "0.73",
              trend: "+0.05",
            },
          ].map((stat, index) => (
            <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm card-shadow">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-green-500">{stat.trend}</span>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Interviews</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {recentInterviews.map((interview, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => navigate("/results")}
              >
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{interview.name}</h3>
                  <p className="text-sm text-muted-foreground">{interview.role}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Sentiment</p>
                    <p className="font-semibold text-green-500">
                      +{interview.sentiment}
                    </p>
                  </div>

                  <div className="text-center min-w-[120px]">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2 justify-center">
                      {interview.status === "Completed" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">In Progress</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-muted-foreground">{interview.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
