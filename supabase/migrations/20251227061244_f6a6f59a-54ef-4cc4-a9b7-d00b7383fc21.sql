-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📋',
  description TEXT,
  author TEXT NOT NULL,
  context_path TEXT,
  selected_agents TEXT[] DEFAULT ARRAY['xtalpi'],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for chat history
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  agent_id TEXT,
  files JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required for this demo)
CREATE POLICY "Anyone can view projects" 
ON public.projects FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create projects" 
ON public.projects FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update projects" 
ON public.projects FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete projects" 
ON public.projects FOR DELETE 
USING (true);

CREATE POLICY "Anyone can view messages" 
ON public.messages FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create messages" 
ON public.messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete messages" 
ON public.messages FOR DELETE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_messages_project_id ON public.messages(project_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_projects_is_active ON public.projects(is_active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;