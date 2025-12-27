import { GitBranch } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MessageBranchButtonProps {
  onCreateBranch: () => void;
  className?: string;
}

const MessageBranchButton = ({
  onCreateBranch,
  className,
}: MessageBranchButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onCreateBranch}
          className={cn(
            "p-1.5 rounded-md transition-all",
            "text-muted-foreground hover:text-primary",
            "hover:bg-primary/10",
            "opacity-0 group-hover:opacity-100",
            className
          )}
        >
          <GitBranch className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>从此处创建分歧分支</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default MessageBranchButton;
