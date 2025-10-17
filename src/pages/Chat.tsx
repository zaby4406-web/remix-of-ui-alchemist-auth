import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Zap, Wallet, Download, Code, Eye, Copy, Menu, User, Settings, BarChart3, FolderOpen, Crown, Send, Lock, Save, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast: toastHook } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [credits, setCredits] = useState({ used: 0, total: 5 });
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = "https://lknuzpoodcqrdopgyrlb.supabase.co/functions/v1/chat";

  // Preview helper: split combined HTML into parts and write into iframe
  const updatePreview = (htmlCode: string, cssCode: string, jsCode: string, iframeElement: HTMLIFrameElement) => {
    const html = htmlCode || "";
    const css = `<style>${cssCode || ""}</style>`;
    const js = `<script>${jsCode || ""}<\\/script>`;
    let output: Document | null = null;
    try {
      output = iframeElement.contentDocument || iframeElement.contentWindow?.document || null;
    } catch {
      // Cross-origin access blocked; abort safely
      return;
    }
    if (!output) return;
    output.open();
    output.write(html + css + js);
    output.close();
  };

  const splitCodeIntoParts = (code: string) => {
    // Extract inline <style> and <script> blocks if present, keep remaining as HTML
    let html = code || "";
    let css = "";
    let js = "";

    // Collect and remove <style> blocks
    html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, cssBlock: string) => {
      css += cssBlock.trim() + "\n";
      return ""; // remove from HTML
    });

    // Collect and remove <script> blocks
    html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, jsBlock: string) => {
      js += jsBlock.trim() + "\n";
      return ""; // remove from HTML
    });

    return { html: html.trim(), css: css.trim(), js: js.trim() };
  };

  useEffect(() => {
    if (showPreview && generatedCode && previewRef.current) {
      const { html, css, js } = splitCodeIntoParts(generatedCode);
      updatePreview(html, css, js, previewRef.current);
    }
  }, [generatedCode, showPreview]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);
      fetchCredits();
      fetchUserData();
    };
    checkAuth();
  }, [navigate]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

  useEffect(() => {
    if (id && user) {
      loadProject(id);
    }
  }, [id, user]);

  useEffect(() => {
    const initialMessage = searchParams.get("message");
    if (initialMessage && messages.length === 0 && !id) {
      sendMessage(initialMessage);
    }
  }, [searchParams, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // remove legacy preview writer effect that directly writes entire HTML
  // useEffect(() => {
  //   if (generatedCode && previewRef.current) {
  //     const doc = previewRef.current.contentDocument;
  //     if (doc) {
  //       doc.open();
  //       doc.write(generatedCode);
  //       doc.close();
  //     }
  //   }
  // }, [generatedCode, showPreview]);

  // Sync editor content with generated code whenever it changes
  useEffect(() => {
    setEditedCode(generatedCode);
  }, [generatedCode]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = (e.clientX - containerRect.left) / containerRect.width * 100;

      // Constrain between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const loadProject = async (projectId: string) => {
    try {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      setProjectTitle(project.title || "Untitled Project");
      setCurrentProjectId(projectId);

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("role, content")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      if (messagesData && messagesData.length > 0) {
        setMessages(messagesData as Message[]);

        const lastAssistantMsg = [...messagesData].reverse().find((m) => m.role === "assistant");
        if (lastAssistantMsg) {
          const code = extractCodeFromMessage(lastAssistantMsg.content);
          if (code) setGeneratedCode(code);
        }
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project");
    }
  };

  const saveProject = async (messagesArray: Message[]) => {
    try {
      if (!user) return;

      let projectId = currentProjectId;

      if (!projectId) {
        const firstUserMessage = messagesArray.find((m) => m.role === "user");
        const title = firstUserMessage?.content.slice(0, 50) || "Untitled Project";

        const { data: newProject, error: projectError } = await supabase.
        from("projects").
        insert({
          user_id: user.id,
          title: title
        }).
        select().
        single();

        if (projectError) throw projectError;
        projectId = newProject.id;
        setCurrentProjectId(projectId);
        setProjectTitle(title);

        navigate(`/chat/${projectId}`, { replace: true });
      }

      const messagesToSave = messagesArray.map((msg) => ({
        project_id: projectId,
        role: msg.role,
        content: msg.content
      }));

      await supabase.from("messages").delete().eq("project_id", projectId);

      const { error: messagesError } = await supabase.
      from("messages").
      insert(messagesToSave);

      if (messagesError) throw messagesError;
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const fetchCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("user_plans")
      .select("credits_used_today, daily_credits")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setCredits({ used: profile.credits_used_today || 0, total: profile.daily_credits || 5 });
    }
  };

  // Increment daily credit after a successful message
  const incrementDailyCredit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("user_plans")
      .select("credits_used_today, daily_credits")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const used = profile.credits_used_today || 0;
    const total = profile.daily_credits || 5;

    if (used < total) {
      await supabase
        .from("user_plans")
        .update({ credits_used_today: used + 1 })
        .eq("user_id", user.id);
      setCredits({ used: used + 1, total });
    }
  };

  // Add function to extract text without code blocks
  const extractTextWithoutCode = (content: string): string => {
    // Remove code blocks but keep the text
    return content.replace(/```(?:html|javascript|jsx|tsx|css)?\n[\s\S]*?```/g, '').trim();
  };

  const extractCodeFromMessage = (content: string): string => {
    const codeBlockRegex = /```(?:html|javascript|jsx|tsx|css)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      // Extract different code types
      let html = '';
      let css = '';
      let js = '';
      
      content.replace(/```(html|javascript|jsx|tsx|css)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const trimmedCode = code.trim();
        if (lang === 'css') {
          css += trimmedCode + '\n';
        } else if (lang === 'javascript' || lang === 'js') {
          js += trimmedCode + '\n';
        } else if (lang === 'html') {
          html += trimmedCode + '\n';
        } else {
          // If no language specified, try to detect
          if (trimmedCode.includes('<style>') || trimmedCode.includes('<!DOCTYPE') || trimmedCode.includes('<html')) {
            html += trimmedCode + '\n';
          } else {
            html += trimmedCode + '\n';
          }
        }
        return '';
      });
      
      // If we have separated HTML, CSS, JS, combine them properly
      if (html || css || js) {
        // Check if HTML already has full document structure
        if (html.includes('<!DOCTYPE') || html.includes('<html')) {
          // If CSS or JS exists separately, inject them
          if (css && !html.includes('<style>')) {
            html = html.replace('</head>', `<style>${css}</style>\n</head>`);
          }
          if (js && !html.includes('<script>')) {
            html = html.replace('</body>', `<script>${js}</script>\n</body>`);
          }
          return html;
        } else {
          // Build a complete HTML document
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${css ? `<style>${css}</style>` : ''}
</head>
<body>
  ${html}
  ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
        }
      }
      
      // Fallback: just join all code blocks
      return matches.map((match) => match[1]).join('\n\n');
    }

    return "";
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Check if user has credits remaining
    if (credits.used >= credits.total) {
      toast.error("You've reached your daily credit limit. Please upgrade your plan or wait until tomorrow.");
      return;
    }

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });

      const code = extractCodeFromMessage(assistantContent);
      if (code) {
        setGeneratedCode(code);
      }
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No valid session. Please sign in again.");
      }

      console.log("Sending message to AI...", { messageCount: updatedMessages.length });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: updatedMessages })
      });

      console.log("Response status:", resp.status);

      if (!resp.ok) {
        console.error("Response not OK:", resp.status, resp.statusText);
        const errorData = await resp.json().catch(() => ({}));
        
        // Handle specific error codes
        if (resp.status === 429 || errorData.code === "RATE_LIMIT") {
          toast.error("⏱️ Rate Limit Reached", {
            description: "The AI service is temporarily rate limited. Please wait 30-60 seconds and try again. Consider upgrading your plan for higher limits.",
            duration: 6000,
          });
        } else if (resp.status === 401) {
          toast.error("Authentication Error", {
            description: "Your session has expired. Please sign in again.",
          });
        } else if (resp.status === 403) {
          toast.error("Insufficient Credits", {
            description: "You've used all your daily credits. Upgrade your plan to continue.",
          });
        } else {
          toast.error("Failed to send message", {
            description: errorData.error || "Please try again in a moment.",
          });
        }
        
        // Remove the temporary message
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (!resp.body) {
        throw new Error("No response body received from server");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let hasReceivedContent = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              hasReceivedContent = true;
              upsertAssistant(content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (!hasReceivedContent) {
        throw new Error("No response received from AI. Please try again.");
      }

      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: assistantContent }];
      await saveProject(finalMessages);

      // await incrementDailyCredit(); // remove client-side credit update; backend handles credits

      setIsLoading(false);
      fetchCredits();
      
      const event = new CustomEvent('refresh-sidebar');
      window.dispatchEvent(event);
      
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove the user message if request failed
      setMessages(messages);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
      toast.error(errorMessage);
      
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startEditTitle = async () => {
    // This function is no longer used
  };

  const saveTitle = async () => {
    // This function is no longer used
  };

  const cancelEdit = () => {
    // This function is no longer used
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const copyCode = () => {
    const codeToCopy = showPreview ? generatedCode : editedCode;
    navigator.clipboard.writeText(codeToCopy);
    toast.success("Code copied to clipboard!");
  };

  const downloadCode = () => {
    const codeToDownload = showPreview ? generatedCode : editedCode;
    const blob = new Blob([codeToDownload], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const startEditingCode = () => {
    setEditedCode(generatedCode);
    setIsEditingCode(true);
  };

  const saveEditedCode = () => {
    setGeneratedCode(editedCode);
    setIsEditingCode(false);
    toast.success("Code updated!");
  };

  const cancelEditingCode = () => {
    setEditedCode("");
    setIsEditingCode(false);
  };

  const creditsPercentage = credits.used / credits.total * 100;

  const makeProjectPrivate = async () => {
    if (!currentProjectId) {
      toast.error("Please save your project first");
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_public: false })
        .eq("id", currentProjectId);

      if (error) throw error;
      
      toast.success("Project is now private");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update project visibility");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      rightPanelRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-black">
      {/* Overlay Sidebar */}
      <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'} z-10`}
          onClick={() => setIsOpen(false)}
        />
        <AppSidebar onSignOut={handleSignOut} open={isOpen} />
      </div>
      
      <div className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/95 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button */}
            <Button
              onClick={() => setIsOpen(true)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Compact Daily Credits */}
            <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/20 px-3 py-1">
              <Wallet className="h-4 w-4 text-white/80" />
              <span className="text-sm text-white/80">{credits.used} / {credits.total}</span>
              <div className="h-1 w-16 bg-white/10 rounded">
                <div className="h-1 bg-white rounded" style={{ width: `${creditsPercentage}%` }} />
              </div>
            </div>

            {/* Project Title - Display Only */}
            {currentProjectId && (
              <div className="flex items-center">
                <span className="text-base font-semibold text-white">{projectTitle}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Make Private Button - Pro Plan Feature */}
            {currentProjectId && (
              <Button
                onClick={makeProjectPrivate}
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/5"
              >
                <Lock className="h-4 w-4 mr-2" />
                Make Private
              </Button>
            )}

            {generatedCode && (
              <Button
                onClick={downloadCode}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border-2 border-white/20 hover:border-white/40">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-white text-black text-sm font-semibold">
                      {userName.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
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
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Upgrade Button - Black & White Theme */}
            <Button
              onClick={() => navigate('/pricing')}
              className="bg-white text-black hover:bg-gray-200 font-semibold">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </div>

        {/* Main Content with Resizable Panels */}
        <div className="flex-1 flex overflow-hidden min-h-0" ref={containerRef}>
          {/* Chat Area - Left Side */}
          <div
            className="flex flex-col border-r border-white/10 min-w-0"
            style={{ width: `${panelWidth}%` }}>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6 pb-6">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-center py-20">
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center">
                        <Zap className="w-8 h-8 text-black" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Start Building</h3>
                      <p className="text-white/60 max-w-md">Describe what you want to create and I'll generate the code for you</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                        msg.role === "user"
                          ? "bg-white text-black shadow-lg"
                          : "bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm"
                      }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.role === "assistant" ? extractTextWithoutCode(msg.content) : msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area - Match Home Page with Send Icon */}
            <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl flex-shrink-0">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="glass-container rounded-3xl p-8">
                    <div className="input-glass rounded-2xl p-6 flex items-center gap-4">
                      <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Zalpha AI anything..."
                        className="flex-1 text-xl bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-black text-white p-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-6 h-6" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="w-1 bg-white/10 hover:bg-white/30 cursor-col-resize transition-colors relative group"
            onMouseDown={() => setIsResizing(true)}>
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-white/20" />
          </div>

          {/* Right Panel - Preview/Code */}
          <div
            ref={rightPanelRef}
            className="flex flex-col bg-black/95 min-w-0"
            style={{ width: `${100 - panelWidth}%` }}>
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/95 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant={showPreview ? "default" : "ghost"}
                  size="sm"
                  className={showPreview ? "bg-white text-black hover:bg-white/90" : "text-white hover:bg-white/10"}
                  onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant={!showPreview ? "default" : "ghost"}
                  size="sm"
                  className={!showPreview ? "bg-white text-black hover:bg-white/90" : "text-white hover:bg-white/10"}
                  onClick={() => setShowPreview(false)}>
                  <Code className="h-4 w-4 mr-2" />
                  Code
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                {!showPreview && (
                  <>
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-white/90"
                      onClick={saveEditedCode}
                      disabled={editedCode === generatedCode}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                )}
                {showPreview && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                    onClick={copyCode}
                    disabled={!generatedCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              {showPreview ? (
                generatedCode ? (
                  <iframe
                    ref={previewRef}
                    className="w-full h-full bg-white"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/50">
                    <div className="text-center space-y-3">
                      <Eye className="h-16 w-16 mx-auto text-white/20" />
                      <p className="text-white/40">Preview will appear here</p>
                    </div>
                  </div>
                )
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <Textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="w-full min-h-[600px] bg-black/50 border border-white/10 rounded-lg p-4 text-sm text-white/90 font-mono resize-none focus-visible:ring-1 focus-visible:ring-white/20"
                      spellCheck={false}
                    />
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;