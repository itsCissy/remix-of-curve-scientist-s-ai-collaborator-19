import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Bot, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Project } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface GlobalSearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (id: string) => Promise<boolean>;
  onSendToAgent?: (query: string) => void;
}

const GlobalSearchPalette = ({
  open,
  onOpenChange,
  projects,
  activeProject,
  onSelectProject,
  onSendToAgent,
}: GlobalSearchPaletteProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on search query
  const filteredProjects = searchQuery.trim()
    ? projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const hasResults = filteredProjects.length > 0;
  const showAIAction = !hasResults || searchQuery.trim().length > 0;

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setSearchQuery("");
    }
  }, [open]);

  const handleSelectProject = async (projectId: string) => {
    await onSelectProject(projectId);
    navigate("/");
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleSendToAgent = () => {
    if (onSendToAgent && searchQuery.trim()) {
      // Navigate to project page first if not already there
      if (!activeProject) {
        // If no active project, select first project or show message
        if (projects.length > 0) {
          onSelectProject(projects[0].id).then(() => {
            navigate("/");
            setTimeout(() => {
              onSendToAgent(searchQuery);
            }, 100);
          });
        }
      } else {
        navigate("/");
        setTimeout(() => {
          onSendToAgent(searchQuery);
        }, 100);
      }
      onOpenChange(false);
      setSearchQuery("");
    }
  };


  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        ref={inputRef}
        placeholder="搜索项目或向 AI 提问..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="h-12"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          {searchQuery.trim() ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">未找到匹配的项目</p>
              <p className="text-xs text-muted-foreground">按 Enter 向 AI 提问</p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">输入关键词搜索项目或向 AI 提问</p>
            </div>
          )}
        </CommandEmpty>

        {hasResults && (
          <CommandGroup heading="项目">
            {filteredProjects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.name}
                onSelect={() => handleSelectProject(project.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <span className="text-base">{project.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{project.name}</div>
                  <div className="text-xs truncate text-muted-foreground data-[selected=true]:text-white/70">
                    {project.author}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground data-[selected=true]:text-white" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showAIAction && searchQuery.trim() && (
          <CommandGroup heading={hasResults ? "AI 提问" : undefined}>
            <CommandItem
              onSelect={handleSendToAgent}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            >
              <Bot className="w-4 h-4 flex-shrink-0 text-xtalpi-blue data-[selected=true]:text-white" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground data-[selected=true]:text-white">
                  向 AI 提问: {searchQuery}
                </div>
                <div className="text-xs mt-0.5 text-muted-foreground data-[selected=true]:text-white/70">
                  按 Enter 发送
                </div>
              </div>
              <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground data-[selected=true]:text-white" />
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearchPalette;

