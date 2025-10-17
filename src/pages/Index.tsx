import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import { AppSidebar } from "@/components/AppSidebar";

export const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleQuerySubmit = (query: string) => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate(`/chat?message=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sidebar - Hover only, no toggle button */}
      {user && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <AppSidebar onSignOut={handleSignOut} />
        </div>
      )}
      
      <div className="hero-gradient min-h-screen">
        <div className="absolute inset-0 hero-radial" />
        <div className="relative z-10">
          <HeroSection onQuerySubmit={handleQuerySubmit} isAuthenticated={!!user} />
          <ProjectsSection />
        </div>
      </div>
    </div>
  );
};

export default Index;