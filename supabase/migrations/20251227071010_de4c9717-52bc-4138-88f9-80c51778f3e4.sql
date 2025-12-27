-- Create collaborators table for temporary user identification
CREATE TABLE public.collaborators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '匿名用户',
    avatar_color TEXT NOT NULL DEFAULT '#3B82F6',
    browser_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, browser_id)
);

-- Enable RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaborators
CREATE POLICY "Anyone can view collaborators" ON public.collaborators FOR SELECT USING (true);
CREATE POLICY "Anyone can create collaborators" ON public.collaborators FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update collaborators" ON public.collaborators FOR UPDATE USING (true);

-- Create branches table for conversation branching
CREATE TABLE public.branches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    branch_point_message_id UUID,
    name TEXT NOT NULL DEFAULT '主线',
    description TEXT,
    created_by UUID REFERENCES public.collaborators(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_main BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- RLS policies for branches
CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Anyone can create branches" ON public.branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update branches" ON public.branches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete branches" ON public.branches FOR DELETE USING (true);

-- Add branch_id and collaborator_id to messages table
ALTER TABLE public.messages 
ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
ADD COLUMN collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_messages_branch_id ON public.messages(branch_id);
CREATE INDEX idx_branches_project_id ON public.branches(project_id);
CREATE INDEX idx_branches_parent ON public.branches(parent_branch_id);
CREATE INDEX idx_collaborators_project ON public.collaborators(project_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaborators;