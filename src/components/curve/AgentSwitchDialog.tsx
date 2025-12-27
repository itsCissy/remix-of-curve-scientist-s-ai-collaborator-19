import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Agent } from "@/lib/agents";

interface AgentSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromAgent: Agent;
  toAgent: Agent;
  messageCount: number;
  onConfirm: (keepHistory: boolean) => void;
}

const AgentSwitchDialog = ({
  open,
  onOpenChange,
  fromAgent,
  toAgent,
  messageCount,
  onConfirm,
}: AgentSwitchDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span>切换到 {toAgent.name}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              你正在从 <span className="font-medium text-foreground">{fromAgent.name}</span> 切换到{" "}
              <span className="font-medium text-foreground">{toAgent.name}</span>。
            </p>
            {messageCount > 0 && (
              <p>
                当前对话包含 <span className="font-medium text-foreground">{messageCount}</span> 条消息。
                你希望如何处理这些对话记录？
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            取消
          </AlertDialogCancel>
          {messageCount > 0 ? (
            <>
              <AlertDialogAction
                onClick={() => onConfirm(false)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                清空对话
              </AlertDialogAction>
              <AlertDialogAction onClick={() => onConfirm(true)}>
                保留对话
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={() => onConfirm(false)}>
              确认切换
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AgentSwitchDialog;
