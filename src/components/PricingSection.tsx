import { Check, Lock, Unlock, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface PricingSectionProps {
  onBackToHome: () => void;
}
const PricingSection = ({
  onBackToHome
}: PricingSectionProps) => {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchCurrentPlan();
  }, []);
  const fetchCurrentPlan = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data
    } = await supabase.from('user_plans').select('plan_type').eq('user_id', user.id).single();
    if (data) {
      setCurrentPlan(data.plan_type);
    }
  };
  const handleSelectPlan = async (plan: 'free' | 'pro') => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to select a plan");
      return;
    }
    
    // For Pro plan, show contact email
    if (plan === 'pro') {
      toast.success(
        "To upgrade to Pro, contact us at: zaby4406@gmail.com",
        { duration: 10000 }
      );
      return;
    }
    
    setLoading(true);
    try {
      const planConfig = {
        daily_credits: 5,
        monthly_credits: 30
      };
      const {
        error
      } = await supabase.from('user_plans').update({
        plan_type: plan,
        ...planConfig
      }).eq('user_id', user.id);
      if (error) throw error;
      toast.success(`Successfully selected ${plan} plan!`);
      setCurrentPlan(plan);
    } catch (error: any) {
      toast.error(error.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };
  return <section className="hero-gradient relative min-h-screen py-20">
      <div className="absolute inset-0 hero-radial" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold text-white mb-6 zalpha-title">Choose Your Plan</h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Transform your ideas into reality with the perfect plan
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="group relative rounded-3xl p-10 overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-[2px] bg-black/90 backdrop-blur-xl rounded-3xl" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-5xl font-black text-white mb-2">Free</h3>
                <p className="text-white/70 mb-6 text-lg">Perfect for getting started</p>
                <div className="text-7xl font-black bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent mb-2">$0</div>
                <p className="text-white/50 uppercase tracking-wider text-sm font-bold">Forever free</p>
              </div>
              
              <div className="space-y-4 mb-8 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/90 font-semibold">5 credits per day</p>
                  <p className="text-white/60 text-sm">Daily message limit</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/90 font-semibold">30 credits per month</p>
                  <p className="text-white/60 text-sm">Monthly total limit</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/90 font-semibold">Basic AI Features</p>
                  <p className="text-white/60 text-sm">Standard responses</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Unlock className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/90 font-semibold">Public Projects</p>
                  <p className="text-white/60 text-sm">Visible to everyone</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 mt-1 flex-shrink-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                </div>
                <div>
                  <p className="text-white/60 font-semibold line-through">API Access</p>
                  <p className="text-white/40 text-sm">Not available</p>
                </div>
              </div>
              </div>
              
              <Button 
                onClick={() => handleSelectPlan('free')} 
                disabled={loading || currentPlan === 'free'} 
                className="w-full bg-gradient-to-r from-white/10 to-white/20 text-white hover:from-white/20 hover:to-white/30 border border-white/30 py-6 text-lg font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-white/10"
              >
                {currentPlan === 'free' ? '✓ Current Plan' : 'Get Started Free'}
              </Button>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="group relative rounded-3xl p-10 overflow-hidden transform md:scale-110 transition-all duration-500 hover:scale-[1.12] hover:shadow-2xl hover:shadow-primary/30">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl animate-pulse" />
            <div className="absolute inset-[2px] bg-gradient-to-br from-gray-950 via-black to-gray-950 rounded-3xl" />
            
            {/* Popular badge */}
            <div className="absolute -top-4 -right-4 z-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full text-sm font-black transform rotate-12 shadow-xl shadow-purple-500/50 uppercase tracking-wider animate-bounce">
              ⚡ Popular
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/50">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-5xl font-black text-white mb-2">Pro</h3>
                <p className="text-white/70 mb-6 text-lg font-medium">Unlimited power</p>
                <div className="text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">$29</div>
                <p className="text-white/50 uppercase tracking-wider text-sm font-semibold">per month</p>
              </div>
              
              <div className="space-y-4 mb-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-purple-500/30 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-bold">10 credits per day</p>
                  <p className="text-gray-600 text-sm">2x daily messages</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-bold">100 credits per month</p>
                  <p className="text-gray-600 text-sm">3x+ monthly total</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-bold">Advanced AI Features</p>
                  <p className="text-gray-600 text-sm">Premium models</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-bold">Private Projects</p>
                  <p className="text-gray-600 text-sm">Keep your work confidential</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-bold">Unlimited with API</p>
                  <p className="text-gray-600 text-sm">Use your own API key</p>
                </div>
              </div>
              </div>
              
              <Button 
                onClick={() => handleSelectPlan('pro')} 
                disabled={loading || currentPlan === 'pro'} 
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-lg font-black rounded-xl shadow-xl hover:shadow-2xl shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                {currentPlan === 'pro' ? '✓ Current Plan' : '⚡ Contact for Upgrade'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-16">
          
          <button onClick={onBackToHome} className="text-white hover:text-white/80 underline text-lg font-semibold transition-colors">
            ← Back to Home
          </button>
        </div>
      </div>
    </section>;
};
export default PricingSection;