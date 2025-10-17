import { useState } from "react";
import { Send, Loader2, User, Settings, BarChart3, FolderOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeroSectionProps {
  onQuerySubmit: (query: string) => void;
  isAuthenticated: boolean;
}

const HeroSection = ({ onQuerySubmit, isAuthenticated }: HeroSectionProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuerySubmit(query);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <section className="hero-gradient relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 hero-radial" />
      
      {/* Profile Icon - Top Right Corner */}
      {isAuthenticated && (
        <div className="absolute top-8 right-8 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border-2 border-white/20 hover:border-white/40 bg-black/50 backdrop-blur-sm">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-white text-black text-sm font-semibold">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-black/95 border-white/10 backdrop-blur-xl">
              <DropdownMenuItem
                onClick={() => navigate('/projects')}
                className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                <FolderOpen className="h-4 w-4 mr-2" />
                Manage Projects
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/pricing')}
                className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage & Billing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className="container mx-auto px-6 text-center relative z-10 !bg-none !bg-cover !bg-center">
        <div className="mb-16 mt-8">
          <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tight zalpha-title">
            Zalpha AI
          </h1>
          <div className="text-3xl md:text-5xl font-light max-w-4xl mx-auto">
            <span className="text-white/60">Transform your</span>
            <span className="idea-text mx-3 font-extrabold uppercase tracking-wider">Idea</span>
            <span className="text-white/60">into</span>
            <span className="reality-text mx-3 font-extrabold uppercase tracking-wider">Reality</span>
            <span className="text-white/60">with AI</span>
          </div>
        </div>
        
        <div className="glass-container rounded-3xl p-8 max-w-4xl mx-auto mb-16 mt-8">
          <div className="input-glass rounded-2xl p-6 flex items-center gap-4">
            <Input
              type="text"
              placeholder="Ask Zalpha AI anything..."
              className="flex-1 text-xl bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={false}
              className="bg-black text-white p-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              {false ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
        
        <div>
          <p className="text-white/60 text-sm">Scroll to explore projects</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;