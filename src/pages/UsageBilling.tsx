import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Menu, Zap, CreditCard, TrendingUp, Search, Moon, Sun, Download, Calendar, BarChart3, Activity } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

export const UsageBilling = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState("overview");
  const [usage, setUsage] = useState({
    credits_used_today: 0,
    daily_credits: 5,
    credits_used_month: 0,
    monthly_credits: 150,
    plan_type: "free",
  });

  // Mock historical data for charts (in production, this would come from database)
  const [dailyUsageData] = useState([
    { date: "Mon", credits: 3 },
    { date: "Tue", credits: 5 },
    { date: "Wed", credits: 2 },
    { date: "Thu", credits: 4 },
    { date: "Fri", credits: 5 },
    { date: "Sat", credits: 1 },
    { date: "Sun", credits: 3 },
  ]);

  const [monthlyUsageData] = useState([
    { month: "Jan", credits: 120 },
    { month: "Feb", credits: 95 },
    { month: "Mar", credits: 140 },
    { month: "Apr", credits: 110 },
    { month: "May", credits: 135 },
    { month: "Jun", credits: 125 },
  ]);

  useEffect(() => {
    fetchUsageData();
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      // Cmd/Ctrl + D for dark mode toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        toggleTheme();
      }
      // Cmd/Ctrl + E for export
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme]);

  const fetchUsageData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: userPlan } = await supabase
        .from("user_plans")
        .select("credits_used_today, daily_credits, credits_used_month, monthly_credits, plan_type")
        .eq("user_id", user.id)
        .single();

      if (userPlan) {
        setUsage({
          credits_used_today: userPlan.credits_used_today || 0,
          daily_credits: userPlan.daily_credits || 5,
          credits_used_month: userPlan.credits_used_month || 0,
          monthly_credits: userPlan.monthly_credits || 150,
          plan_type: userPlan.plan_type || "free",
        });
      }
    } catch (error) {
      console.error("Error fetching usage data:", error);
      toast.error("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleExport = () => {
    const exportData = {
      usage,
      dailyUsageData,
      monthlyUsageData,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Usage report exported!");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const dailyPercentage = (usage.credits_used_today / usage.daily_credits) * 100;
  const monthlyPercentage = (usage.credits_used_month / usage.monthly_credits) * 100;

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Sidebar */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <AppSidebar onSignOut={handleSignOut} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header with Search and Theme Toggle */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Usage & Billing</h1>
                <p className={theme === "dark" ? "text-white/60" : "text-gray-600"}>
                  Monitor your credit usage and manage your subscription
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className={theme === "dark" ? "border-white/10" : "border-gray-200"}
                  title="Export (Cmd+E)"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  size="icon"
                  className={theme === "dark" ? "border-white/10" : "border-gray-200"}
                  title="Toggle Theme (Cmd+D)"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search usage data... (Press Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
              />
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className={`mb-6 p-3 rounded-lg text-xs ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
            <span className="font-semibold">Keyboard Shortcuts:</span>{" "}
            <kbd className="px-2 py-1 bg-black/20 rounded">⌘K</kbd> Search{" "}
            <kbd className="px-2 py-1 bg-black/20 rounded ml-2">⌘D</kbd> Toggle Theme{" "}
            <kbd className="px-2 py-1 bg-black/20 rounded ml-2">⌘E</kbd> Export
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className={theme === "dark" ? "bg-white/5" : "bg-gray-200"}>
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <Activity className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="billing">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Current Plan Card */}
                <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="capitalize">{usage.plan_type} Plan</CardTitle>
                        <CardDescription>Your current subscription plan</CardDescription>
                      </div>
                      <Button
                        onClick={() => navigate("/pricing")}
                        className={theme === "dark" ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Usage Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Daily Usage */}
                  <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}>
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Daily Usage</CardTitle>
                          <CardDescription>Resets every 24 hours</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={theme === "dark" ? "text-white/80" : "text-gray-600"}>Credits Used</span>
                          <span className="font-semibold text-lg">
                            {usage.credits_used_today} / {usage.daily_credits}
                          </span>
                        </div>
                        <Progress value={dailyPercentage} className="h-3" />
                        <p className={`text-xs ${theme === "dark" ? "text-white/60" : "text-gray-500"}`}>
                          {usage.daily_credits - usage.credits_used_today} credits remaining today
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Usage */}
                  <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Monthly Usage</CardTitle>
                          <CardDescription>Resets on the 1st of each month</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={theme === "dark" ? "text-white/80" : "text-gray-600"}>Credits Used</span>
                          <span className="font-semibold text-lg">
                            {usage.credits_used_month} / {usage.monthly_credits}
                          </span>
                        </div>
                        <Progress value={monthlyPercentage} className="h-3" />
                        <p className={`text-xs ${theme === "dark" ? "text-white/60" : "text-gray-500"}`}>
                          {usage.monthly_credits - usage.credits_used_month} credits remaining this month
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{usage.credits_used_today}</div>
                      <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>Today's Usage</p>
                    </CardContent>
                  </Card>
                  <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{Math.round(dailyUsageData.reduce((a, b) => a + b.credits, 0) / 7)}</div>
                      <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>Weekly Avg</p>
                    </CardContent>
                  </Card>
                  <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{usage.credits_used_month}</div>
                      <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>Month's Usage</p>
                    </CardContent>
                  </Card>
                  <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-500">{Math.round((1 - monthlyPercentage / 100) * 100)}%</div>
                      <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>Remaining</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {/* Daily Usage Chart */}
                <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                  <CardHeader>
                    <CardTitle>Daily Usage Trend</CardTitle>
                    <CardDescription>Your credit usage over the past 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dailyUsageData}>
                        <defs>
                          <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#e5e7eb"} />
                        <XAxis dataKey="date" stroke={theme === "dark" ? "#666" : "#9ca3af"} />
                        <YAxis stroke={theme === "dark" ? "#666" : "#9ca3af"} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                            borderRadius: "8px"
                          }}
                        />
                        <Area type="monotone" dataKey="credits" stroke="#8884d8" fillOpacity={1} fill="url(#colorCredits)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Usage Chart */}
                <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                  <CardHeader>
                    <CardTitle>Monthly Usage History</CardTitle>
                    <CardDescription>Your credit consumption over the past 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyUsageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#e5e7eb"} />
                        <XAxis dataKey="month" stroke={theme === "dark" ? "#666" : "#9ca3af"} />
                        <YAxis stroke={theme === "dark" ? "#666" : "#9ca3af"} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                            borderRadius: "8px"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="credits" fill="#82ca9d" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Usage Insights */}
                <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                  <CardHeader>
                    <CardTitle>Usage Insights</CardTitle>
                    <CardDescription>Key metrics and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Peak Usage Days</p>
                          <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
                            You typically use more credits on Tuesdays and Fridays
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Efficiency Score</p>
                          <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
                            You're using {Math.round((usage.credits_used_month / usage.monthly_credits) * 100)}% of your monthly allocation - good pacing!
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Recommendation</p>
                          <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
                            {monthlyPercentage > 80 ? "Consider upgrading to Pro plan for unlimited credits" : "Your current plan fits your usage well"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <Card className={theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Billing Information</CardTitle>
                        <CardDescription>Manage payment methods and invoices</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {usage.plan_type === "free" ? (
                      <div className="text-center py-12">
                        <div className="mb-4">
                          <div className={`inline-flex p-3 rounded-full ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}>
                            <CreditCard className="h-8 w-8" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Billing Information</h3>
                        <p className={`mb-6 ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
                          You're currently on the free plan
                        </p>
                        <Button
                          onClick={() => navigate("/pricing")}
                          className={theme === "dark" ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade to Premium
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className={theme === "dark" ? "text-white/60" : "text-gray-600"}>
                          Billing management coming soon
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageBilling;