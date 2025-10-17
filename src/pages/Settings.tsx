import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
  });
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    project_updates: true,
    marketing_emails: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setProfile(prev => ({ ...prev, email: user.email || "" }));

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(prev => ({
          ...prev,
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          username: profileData.username || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        className="fixed top-4 left-4 z-50 text-white/80 hover:text-white hover:bg-white/10"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </Button>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-white/60">Manage your account settings and preferences</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-white/60">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Settings */}
              <div className="border border-white/10 rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-white/80">First Name</Label>
                      <Input
                        id="first_name"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-white/80">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-white/80">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white/80">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-white/5 border-white/10 text-white/60 mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="border border-white/10 rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_notifications" className="text-white/80">Email Notifications</Label>
                      <p className="text-sm text-white/60">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="project_updates" className="text-white/80">Project Updates</Label>
                      <p className="text-sm text-white/60">Get notified about project changes</p>
                    </div>
                    <Switch
                      id="project_updates"
                      checked={preferences.project_updates}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, project_updates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing_emails" className="text-white/80">Marketing Emails</Label>
                      <p className="text-sm text-white/60">Receive product updates and tips</p>
                    </div>
                    <Switch
                      id="marketing_emails"
                      checked={preferences.marketing_emails}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, marketing_emails: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;