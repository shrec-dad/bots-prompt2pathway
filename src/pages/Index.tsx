// Multi-Bot Platform Welcome Page
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Bot, Workflow } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // ✅ Auto-redirect to admin dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background-soft to-muted/20">
      <div className="max-w-2xl mx-auto text-center px-6">
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow">
          <Bot className="h-10 w-10 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Multi-Bot Platform
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Professional bot management with visual building tools
          </p>
          <div className="flex gap-4">
            <a
              href="/admin"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-all duration-200 shadow-colored"
            >
              <Bot className="h-5 w-5 mr-2" />
              Enter Admin Dashboard
            </a>
            <a
              href="/admin/builder"
              className="inline-flex items-center px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <Workflow className="h-5 w-5 mr-2" />
              Try Bot Builder
            </a>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-xl bg-card border border-border/50 hover:shadow-medium transition-all">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-teal mb-4 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">5 Bot Types</h3>
            <p className="text-sm text-muted-foreground">
              Lead Qualifier, Appointment Booking, Customer Support, Waitlist, and Social Media bots
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border/50 hover:shadow-medium transition-all">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange mb-4 flex items-center justify-center">
              <Workflow className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Visual Builder</h3>
            <p className="text-sm text-muted-foreground">
              Drag-and-drop interface to create complex bot flows without coding
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border/50 hover:shadow-medium transition-all">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-pink to-accent-purple mb-4 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Production Ready</h3>
            <p className="text-sm text-muted-foreground">
              Full-featured platform with embeddable widgets, analytics, and CRM integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
