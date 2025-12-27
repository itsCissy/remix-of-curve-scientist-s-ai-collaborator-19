import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GitMerge, MessageSquare, FileText } from "lucide-react";

interface MergeBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBranchName: string;
  targetBranchName: string;
  sourceConclusion?: string;
  onConfirm: (mergeType: "messages" | "summary", summary?: string) => void;
}

const MergeBranchDialog = ({
  open,
  onOpenChange,
  sourceBranchName,
  targetBranchName,
  sourceConclusion,
  onConfirm,
}: MergeBranchDialogProps) => {
  const [mergeType, setMergeType] = useState<"messages" | "summary">("summary");
  const [summaryText, setSummaryText] = useState(sourceConclusion || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(mergeType, mergeType === "summary" ? summaryText : undefined);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-primary" />
            合并分支
          </DialogTitle>
          <DialogDescription>
            将 <span className="font-medium text-foreground">{sourceBranchName}</span> 的结论合并到{" "}
            <span className="font-medium text-foreground">{targetBranchName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>合并方式</Label>
            <RadioGroup
              value={mergeType}
              onValueChange={(v) => setMergeType(v as "messages" | "summary")}
              className="space-y-2"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="summary" id="summary" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="summary" className="flex items-center gap-2 cursor-pointer font-medium">
                    <FileText className="w-4 h-4 text-primary" />
                    仅合并结论摘要
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    在主线中添加一条包含分支结论的消息，保持对话简洁
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="messages" id="messages" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="messages" className="flex items-center gap-2 cursor-pointer font-medium">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    复制所有消息
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    将分支中的所有对话消息复制到主线，保留完整上下文
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {mergeType === "summary" && (
            <div className="space-y-2">
              <Label htmlFor="summary-text">结论摘要</Label>
              <Textarea
                id="summary-text"
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="输入要合并到主线的结论内容..."
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                此内容将作为一条新消息添加到主线对话中
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || (mergeType === "summary" && !summaryText.trim())}
          >
            {isSubmitting ? "合并中..." : "确认合并"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeBranchDialog;
