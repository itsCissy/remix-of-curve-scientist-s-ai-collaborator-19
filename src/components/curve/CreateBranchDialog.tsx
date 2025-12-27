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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GitBranch } from "lucide-react";

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, description?: string) => void;
  parentBranchName?: string;
}

const CreateBranchDialog = ({
  open,
  onOpenChange,
  onConfirm,
  parentBranchName,
}: CreateBranchDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), description.trim() || undefined);
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            创建分歧分支
          </DialogTitle>
          <DialogDescription>
            从当前位置创建新分支，用于记录不同的观点或讨论方向
            {parentBranchName && (
              <span className="block mt-1">
                父分支: <strong>{parentBranchName}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">分支名称 *</Label>
            <Input
              id="branch-name"
              placeholder="例如：方案A、新观点、另一种思路"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-description">描述（可选）</Label>
            <Textarea
              id="branch-description"
              placeholder="简要描述这个分支的主要观点或目的"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              创建分支
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBranchDialog;
