import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const fetchPublicProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          created_at,
          user_id
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      // Fetch profiles for each project
      if (data) {
        const projectsWithProfiles = await Promise.all(
          data.map(async (project) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', project.user_id)
              .single();

            return {
              ...project,
              profiles: profile
            };
          })
        );
        setProjects(projectsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero-gradient py-20" id="projects">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 zalpha-title">Public Projects</h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Discover amazing AI-powered projects created by our community
          </p>
        </div>
        
        {loading ? (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-white/60 text-lg flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">No public projects yet</p>
              <p className="text-white/30 text-sm mt-2">Be the first to create and share a project!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="glass-container rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white line-clamp-2 flex-1">
                    {project.title}
                  </h3>
                  <Globe className="w-5 h-5 text-white/40 flex-shrink-0 ml-2" />
                </div>
                
                {project.description && (
                  <p className="text-white/70 text-sm line-clamp-3 mb-4">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-white/50 text-xs mt-auto pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      {project.profiles?.first_name || 'Anonymous'}{' '}
                      {project.profiles?.last_name || ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;
