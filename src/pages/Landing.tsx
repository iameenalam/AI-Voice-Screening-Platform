import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { Bot, Clock, Zap, Shield, TrendingUp, Users } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Interviews",
      description: "Human-quality voice conversations that screen candidates naturally",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Schedule interviews anytime, anywhere without coordination hassle",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get transcripts, sentiment analysis, and insights in real-time",
    },
    {
      icon: Shield,
      title: "ATS Integration",
      description: "Seamlessly works within your existing recruitment workflow",
    },
    {
      icon: TrendingUp,
      title: "Data-Driven Insights",
      description: "Advanced analytics to help you make better hiring decisions",
    },
    {
      icon: Users,
      title: "Scale Efficiently",
      description: "Screen hundreds of candidates without additional resources",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              Automate Your First Round
            </h1>
            <p className="text-3xl md:text-4xl mb-4 text-muted-foreground">
              24/7 AI Voice Interviews
            </p>
            <p className="text-xl mb-12 text-muted-foreground max-w-2xl mx-auto">
              Screen candidates directly from your ATS using human-quality AI voice interviews.
              Save hours of manual screening and make faster hiring decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-cta hover:bg-cta/90"
                onClick={() => navigate("/signup")}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/demo")}
              >
                Try Sample Interview
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gradient-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Vocalent?</h2>
            <p className="text-xl text-muted-foreground">
              Transform your recruitment process with AI-powered automation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 card-shadow"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes with our simple workflow
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: "01",
                title: "Upload Candidate Info",
                description: "Extract details from CV or manually enter candidate information",
              },
              {
                step: "02",
                title: "Configure Screening Questions",
                description: "Use AI-suggested questions or create custom ones for your role",
              },
              {
                step: "03",
                title: "AI Conducts Interview",
                description: "Natural voice conversation with real-time sentiment analysis",
              },
              {
                step: "04",
                title: "Review & Download Results",
                description: "Get full transcripts, insights, and exportable reports instantly",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 items-start p-6 rounded-lg bg-card/30 border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="text-4xl font-bold text-primary/30">{item.step}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-card">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading recruiters who are saving time and making better hiring decisions with Vocalent
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-cta hover:bg-cta/90"
            onClick={() => navigate("/signup")}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">
              © 2024 Vocalent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
