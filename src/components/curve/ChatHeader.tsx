import { useState } from "react";
import { ArrowLeft, GitBranch, Users, UserPlus } from "lucide-react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatHeaderProps {
  projectName: string;
  currentBranch?: Branch | null;
  collaborators?: Collaborator[];
  onShowBranchTree?: () => void;
}

const ChatHeader = ({
  projectName,
  currentBranch,
  collaborators = [],
  onShowBranchTree,
}: ChatHeaderProps) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("邀请链接已复制到剪贴板");
    } catch (err) {
      toast.error("复制失败");
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left side - Back button with branch tree */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onShowBranchTree}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{projectName}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>查看分支视图</p>
          </TooltipContent>
        </Tooltip>

        {/* Current branch indicator */}
        {currentBranch && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-accent rounded-md">
            <GitBranch className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">{currentBranch.name}</span>
            {currentBranch.is_main && (
              <span className="px-1 py-0.5 text-[10px] bg-primary/20 text-primary rounded">
                主线
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side - Collaborators */}
      <div className="flex items-center gap-3">
        {/* Collaborator count and avatars */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{collaborators.length}</span>
          </div>
          {collaborators.length > 0 && (
            <div className="flex -space-x-2">
              {collaborators.slice(0, 5).map((collab) => (
                <Tooltip key={collab.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "text-white text-xs font-medium border-2 border-background"
                      )}
                      style={{ backgroundColor: collab.avatar_color }}
                    >
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{collab.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {collaborators.length > 5 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium border-2 border-background">
                  +{collaborators.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invite button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 gap-1 text-xs"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>邀请</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>邀请协作者</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>邀请协作者</DialogTitle>
            <DialogDescription>
              分享链接邀请他人加入此项目的协作
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
                {window.location.href}
              </div>
              <Button onClick={handleCopyInviteLink} size="sm">
                复制链接
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              被邀请者打开此链接后即可加入协作
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatHeader;
