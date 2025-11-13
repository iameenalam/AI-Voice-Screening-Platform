import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { 
  Bot, Clock, Zap, Shield, TrendingUp, Users, 
  Mic, Brain, BarChart3, CheckCircle2, ArrowRight,
  Sparkles, MessageSquare, FileText
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Interviews",
      description: "Human-quality voice conversations powered by advanced AI that screen candidates naturally and intelligently",
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Schedule interviews anytime, anywhere without coordination hassle. Candidates interview on their schedule",
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get transcripts, sentiment analysis, and actionable insights in real-time as interviews progress",
      gradient: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-400",
    },
    {
      icon: Shield,
      title: "ATS Integration",
      description: "Seamlessly works within your existing recruitment workflow. No disruption to your process",
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400",
    },
    {
      icon: TrendingUp,
      title: "Data-Driven Insights",
      description: "Advanced analytics and AI-powered recommendations to help you make better hiring decisions",
      gradient: "from-indigo-500/20 to-violet-500/20",
      iconColor: "text-indigo-400",
    },
    {
      icon: Users,
      title: "Scale Efficiently",
      description: "Screen hundreds of candidates simultaneously without additional resources or scheduling overhead",
      gradient: "from-rose-500/20 to-red-500/20",
      iconColor: "text-rose-400",
    },
  ];

  const stats = [
    { value: "10x", label: "Faster Screening" },
    { value: "24/7", label: "Availability" },
    { value: "95%", label: "Time Saved" },
    { value: "100+", label: "Companies Trust Us" },
  ];

  const benefits = [
    {
      icon: Brain,
      title: "Intelligent Analysis",
      description: "AI analyzes tone, sentiment, and response quality in real-time",
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "Candidates experience human-like interviews, not robotic questionnaires",
    },
    {
      icon: FileText,
      title: "Complete Transcripts",
      description: "Full interview transcripts with timestamps and speaker identification",
    },
    {
      icon: BarChart3,
      title: "Actionable Insights",
      description: "Get detailed reports with recommendations for next steps",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="pt-20 pb-20 px-4 relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow opacity-60" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow opacity-60" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Voice Screening</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="text-center mb-10 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  Automate Your First Round
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  AI Voice Interviews
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Screen candidates <span className="text-foreground font-semibold">24/7</span> directly from your ATS using 
                <span className="text-foreground font-semibold"> human-quality AI voice conversations</span>. 
                Save hours of manual screening and make faster, data-driven hiring decisions.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base md:text-lg px-8 md:px-10 py-6 md:py-7 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 font-semibold"
                onClick={() => navigate("/signup")}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-base md:text-lg px-8 md:px-10 py-6 md:py-7 border-2 hover:bg-accent/50 backdrop-blur-sm font-semibold"
                onClick={() => {
                  const element = document.getElementById("benefits");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto animate-fade-in">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 hover-lift transition-all">
                  <div className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Why Choose Vocalent?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your recruitment process with AI-powered automation that saves time and improves hiring quality
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group p-8 bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-all duration-300 card-shadow hover-lift relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-foreground transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple, intuitive workflow
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload Candidate Info",
                  description: "Extract details from CV automatically or manually enter candidate information",
                  icon: FileText,
                },
                {
                  step: "02",
                  title: "Configure Questions",
                  description: "Use AI-suggested questions tailored to the role or create custom ones",
                  icon: Brain,
                },
                {
                  step: "03",
                  title: "AI Conducts Interview",
                  description: "Natural voice conversation with real-time sentiment analysis and insights",
                  icon: Mic,
                },
                {
                  step: "04",
                  title: "Review & Download",
                  description: "Get full transcripts, AI insights, and exportable reports instantly",
                  icon: BarChart3,
                },
              ].map((item, index) => (
                <Card
                  key={item.step}
                  className="group p-8 bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-all duration-300 card-shadow hover-lift"
                >
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                        <span className="text-2xl font-bold text-primary/50 group-hover:text-primary transition-colors">
                          {item.step}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <item.icon className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="benefits" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for modern recruiters
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="p-6 bg-card/60 backdrop-blur-xl border-border/50 hover:border-primary/30 transition-all duration-300 text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Your Hiring Process?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join leading recruiters who are saving <span className="text-foreground font-semibold">10+ hours per week</span> and making 
              <span className="text-foreground font-semibold"> better hiring decisions</span> with AI-powered voice screening
            </p>
            
            <div className="flex justify-center items-center">
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-background shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105"
                onClick={() => navigate("/signup")}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
