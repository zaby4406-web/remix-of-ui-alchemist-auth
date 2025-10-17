import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Eye, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  title: string;
  created_at: string;
  is_public: boolean;
}

export const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id, title, created_at, is_public")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleRenameProject = async () => {
    if (!selectedProject || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ title: newTitle.trim() })
        .eq("id", selectedProject.id);

      if (error) throw error;
      
      toast.success("Project renamed successfully");
      setRenameDialogOpen(false);
      setSelectedProject(null);
      setNewTitle("");
      fetchProjects();
    } catch (error) {
      console.error("Error renaming project:", error);
      toast.error("Failed to rename project");
    }
  };

  const handleTogglePublic = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_public: !currentStatus })
        .eq("id", projectId);

      if (error) throw error;
      
      toast.success(`Project is now ${!currentStatus ? 'public' : 'private'}`);
      fetchProjects();
    } catch (error) {
      console.error("Error updating project visibility:", error);
      toast.error("Failed to update project visibility");
    }
  };

  const openRenameDialog = (project: Project) => {
    setSelectedProject(project);
    setNewTitle(project.title);
    setRenameDialogOpen(true);
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

      {/* Sidebar - Hover only, no toggle button */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <AppSidebar onSignOut={handleSignOut} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Manage Projects</h1>
            <p className="text-white/60">View and manage all your AI-generated projects</p>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="mb-6 bg-white text-black hover:bg-gray-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-white/60">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 border border-white/10 rounded-xl">
              <p className="text-white/60 mb-4">No projects yet</p>
              <Button onClick={() => navigate("/")} className="bg-white text-black hover:bg-gray-200">
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-white/10 rounded-xl p-6 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                      <p className="text-white/60 text-sm">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Label htmlFor={`public-${project.id}`} className="text-sm text-white/60">
                          {project.is_public ? 'Public' : 'Private'}
                        </Label>
                        <Switch
                          id={`public-${project.id}`}
                          checked={project.is_public}
                          onCheckedChange={() => handleTogglePublic(project.id, project.is_public)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/chat/${project.id}`)}
                        className="hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openRenameDialog(project)}
                        className="hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProject(project.id)}
                        className="hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-black/95 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Rename Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Enter a new name for your project
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Project name"
            className="bg-white/5 border-white/10 text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRenameProject();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              className="border-white/10 text-white/80 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameProject}
              className="bg-white text-black hover:bg-gray-200"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;