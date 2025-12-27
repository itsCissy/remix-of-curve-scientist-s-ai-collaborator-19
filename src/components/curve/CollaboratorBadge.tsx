import { Collaborator } from "@/hooks/useBranches";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CollaboratorBadgeProps {
  collaborator: Collaborator;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const CollaboratorBadge = ({
  collaborator,
  size = "md",
  showName = false,
  className,
}: CollaboratorBadgeProps) => {
  const sizeClasses = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-7 h-7 text-xs",
    lg: "w-9 h-9 text-sm",
  };

  const initial = collaborator.name.charAt(0).toUpperCase();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-2", className)}>
          <div
            className={cn(
              "rounded-full flex items-center justify-center text-white font-medium",
              sizeClasses[size]
            )}
            style={{ backgroundColor: collaborator.avatar_color }}
          >
            {initial}
          </div>
          {showName && (
            <span className="text-sm text-foreground">{collaborator.name}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{collaborator.name}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default CollaboratorBadge;
