-- Create file_assets table to store file metadata
CREATE TABLE public.file_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'unknown',
  category TEXT NOT NULL DEFAULT 'data',
  content TEXT,
  size TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching other tables pattern)
CREATE POLICY "Anyone can view file assets" 
ON public.file_assets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create file assets" 
ON public.file_assets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update file assets" 
ON public.file_assets 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete file assets" 
ON public.file_assets 
FOR DELETE 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_file_assets_project_id ON public.file_assets(project_id);
CREATE INDEX idx_file_assets_branch_id ON public.file_assets(branch_id);
CREATE INDEX idx_file_assets_message_id ON public.file_assets(message_id);
CREATE INDEX idx_file_assets_category ON public.file_assets(category);

-- Enable realtime for file_assets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_assets;