import { Plus, MoreVertical, LogOut, Zap, User, Trash2, Edit2, MessageSquare, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider } from
"@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  created_at: string;
}

interface AppSidebarProps {
  onSignOut: () => void;
  // Allow parent to control open state (e.g., overlay toggle)
  open?: boolean;
}

export function AppSidebar({ onSignOut, open }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchUserData();

    // Listen for refresh event from Chat page
    const handleRefresh = () => {
      fetchProjects();
    };

    window.addEventListener('refresh-sidebar', handleRefresh);

    return () => {
      window.removeEventListener('refresh-sidebar', handleRefresh);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Sync internal hover state with controlled open prop when provided
  useEffect(() => {
    if (typeof open === 'boolean') {
      setIsOpen(open);
    }
  }, [open]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
      const { data: profile } = await supabase.
      from("profiles").
      select("first_name, last_name").
      eq("user_id", user.id).
      single();

      if (profile) {
        setUserName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User");
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.
      from("projects").
      select("id, title, created_at").
      eq("user_id", user.id).
      order("created_at", { ascending: false }).
      limit(10);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    onSignOut();
  };

  const handleNewChat = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.
      from("projects").
      delete().
      eq("id", projectId);

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
      const { error } = await supabase.
      from("projects").
      update({ title: newTitle.trim() }).
      eq("id", selectedProject.id);

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

  const openRenameDialog = (project: Project) => {
    setSelectedProject(project);
    setNewTitle(project.title);
    setRenameDialogOpen(true);
  };

  const handleMouseEnter = () => {
    if (typeof open === 'boolean' && open) return; // disable hover when controlled open
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (typeof open === 'boolean' && open) return; // keep open under overlay control
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <>
      {/* Hover trigger area at left edge (disabled when open is controlled true) */}
      {!(typeof open === 'boolean' && open) &&
      <div
        className="fixed left-0 top-0 w-2 h-screen z-40"
        onMouseEnter={handleMouseEnter} />

      }

      <SidebarProvider className="!w-28 !h-full">
        <Sidebar
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            ${(typeof open === 'boolean' ? open : isOpen) ? 'translate-x-0' : '-translate-x-full'}
            w-80 transition-transform duration-300 ease-in-out
            bg-black/95 backdrop-blur-xl
            border-r border-white/10
            shadow-2xl shadow-black/50
            fixed left-0 top-0 h-screen z-50
          `}>

          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="w-full text-left group flex items-center gap-3">

                <img
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/Airbrush-Image-Enhancer-1760458191016-1760458665720.jpg"
                  alt="Zalpha AI Logo"
                  className="w-10 h-10 object-contain" />

                <h2 className="text-2xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  Zalpha AI
                </h2>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="px-4 py-4 space-y-2 flex-shrink-0">
              <Button
                onClick={handleNewChat}
                className="w-full bg-white hover:bg-gray-200 text-black font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">

                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                New Chat
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className={`w-full justify-start text-white/80 hover:text-white hover:bg-white/10 ${location.pathname === '/' ? 'bg-white/10 text-white' : ''}`}>

                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>

            {/* Recent Chats Section with Scrollbar */}
            <div className="flex-1 px-4 min-h-0">
              <div className="text-white/60 px-2 mb-2 text-xs uppercase tracking-wider font-semibold">
                Recent Chats
              </div>
              <ScrollArea className="h-full pr-2">
                {loading ?
                <div className="text-white/40 text-sm px-4 py-8 text-center">
                    Loading...
                  </div> :
                projects.length === 0 ?
                <div className="text-white/40 text-sm px-4 py-8 text-center">
                    No chats yet
                  </div> :

                <div className="space-y-1 pb-4">
                    {projects.map((project) =>
                  <div
                    key={project.id}
                    className="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10 cursor-pointer"
                    onClick={() => navigate(`/chat/${project.id}`)}>

                        <MessageSquare className="h-4 w-4 text-white/70 flex-shrink-0" />
                        <span className="flex-1 text-sm text-white/80 truncate group-hover:text-white">
                          {project.title}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all duration-200">
                              <MoreVertical className="h-4 w-4 text-white/60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/95 border-white/10 backdrop-blur-xl">
                            <DropdownMenuItem
                          onClick={() => openRenameDialog(project)}
                          className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">

                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">

                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  )}
                  </div>
                }
              </ScrollArea>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 p-4 space-y-3 flex-shrink-0">
              {/* Upgrade Button */}
              <Button
                onClick={() => navigate('/pricing')}
                className="w-full bg-white hover:bg-gray-200 text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">

                <Zap className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Upgrade Plan
              </Button>

              {/* Profile & Sign Out */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 group hover:bg-white/10 transition-all duration-300">
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarFallback className="bg-white text-black text-sm font-semibold">
                    {userName.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  title="Sign Out">

                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </Sidebar>
      </SidebarProvider>

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
            }} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              className="border-white/10 text-white/80 hover:bg.White/5">

              Cancel
            </Button>
            <Button
              onClick={handleRenameProject}
              className="bg.White text-black hover:bg-gray-200">

              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}