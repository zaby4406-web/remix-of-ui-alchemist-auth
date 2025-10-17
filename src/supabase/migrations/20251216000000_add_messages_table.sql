-- Create messages table for chat history
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX messages_project_id_idx ON public.messages(project_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages are viewable by project owner or if project is public
CREATE POLICY "Users can view messages from their projects or public projects" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = messages.project_id 
    AND (projects.user_id = auth.uid() OR projects.is_public = true)
  )
);

-- Users can insert messages to their own projects
CREATE POLICY "Users can insert messages to their own projects" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = messages.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Users can update messages in their own projects
CREATE POLICY "Users can update messages in their own projects" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = messages.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Users can delete messages from their own projects
CREATE POLICY "Users can delete messages from their own projects" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = messages.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();