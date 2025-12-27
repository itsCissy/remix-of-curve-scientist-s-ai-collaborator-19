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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, inheritContext?: boolean) => void;
  parentBranchName?: string;
}

const CreateBranchDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: CreateBranchDialogProps) => {
  const [name, setName] = useState("");
  const [inheritContext, setInheritContext] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), inheritContext);
    setName("");
    setInheritContext(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            创建新分支
          </DialogTitle>
          <DialogDescription>
            从当前会话创建一个新的分支进行探索
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">分支名称</Label>
            <Input
              id="branch-name"
              placeholder="输入分支名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="inherit-context" className="text-sm font-medium">
                携带历史上下文
              </Label>
              <p className="text-xs text-muted-foreground">
                开启后，新分支将继承父分支的对话历史
              </p>
            </div>
            <Switch
              id="inherit-context"
              checked={inheritContext}
              onCheckedChange={setInheritContext}
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
              <Plus className="w-4 h-4 mr-1" />
              创建分支
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBranchDialog;
