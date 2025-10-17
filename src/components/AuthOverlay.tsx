import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChainBackground from "./ChainBackground";

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthOverlay = ({ isOpen, onClose, onAuthSuccess }: AuthOverlayProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      onAuthSuccess();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!formData.termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (error) throw error;

      toast.success("Account created! Please check your email to verify.");
      onAuthSuccess();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSignUp(false);
      resetForm();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-500 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{ 
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <ChainBackground isActive={isOpen} />
      
      <div 
        className={`bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-12 max-w-lg w-full mx-4 relative transition-transform duration-500 ${
          isOpen ? 'translate-y-0' : 'translate-y-12'
        }`}
        style={{ boxShadow: '0 50px 100px rgba(0, 0, 0, 0.5)' }}
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {!isSignUp ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-white/60">Sign in to your Zalpha AI account</p>
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-6">
              <Input 
                type="email" 
                placeholder="Email address" 
                className="w-full px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <Input 
                type="password" 
                placeholder="Password" 
                className="w-full px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-black py-4 rounded-xl font-semibold text-lg hover:bg-gray-100"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-white/60">
                Don't have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(true)}
                  className="text-white hover:underline font-semibold"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Join Zalpha AI</h2>
              <p className="text-white/60">Create your account to get started</p>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  type="text" 
                  placeholder="First Name" 
                  className="px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
                <Input 
                  type="text" 
                  placeholder="Last Name" 
                  className="px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <Input 
                type="email" 
                placeholder="Email address" 
                className="w-full px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <Input 
                type="password" 
                placeholder="Create Password" 
                className="w-full px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <Input 
                type="password" 
                placeholder="Confirm Password" 
                className="w-full px-4 py-4 rounded-xl text-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => setFormData({...formData, termsAccepted: checked as boolean})}
                />
                <Label htmlFor="terms" className="text-white/80 text-sm cursor-pointer">
                  I agree to the <span className="text-white underline">Terms of Service</span> and <span className="text-white underline">Privacy Policy</span>
                </Label>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-black py-4 rounded-xl font-semibold text-lg hover:bg-gray-100"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-white/60">
                Already have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(false)}
                  className="text-white hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthOverlay;
