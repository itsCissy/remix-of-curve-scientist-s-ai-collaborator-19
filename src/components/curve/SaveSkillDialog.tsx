import { useState } from "react";
import { Wand2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

interface SaveSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, description: string) => void;
  defaultContent?: string;
}

const SaveSkillDialog = ({
  open,
  onOpenChange,
  onConfirm,
  defaultContent,
}: SaveSkillDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), description.trim());
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setName("");
      setDescription("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" strokeWidth={1.5} />
            存为技能
          </DialogTitle>
          <DialogDescription>
            将当前回答保存为可复用的科研技能模版
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill-name">技能名称</Label>
            <Input
              id="skill-name"
              placeholder="输入技能名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill-description">技能描述（可选）</Label>
            <Textarea
              id="skill-description"
              placeholder="简要描述该技能的用途..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {defaultContent && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1.5">内容预览</p>
              <p className="text-sm text-foreground line-clamp-3">
                {defaultContent.slice(0, 150)}
                {defaultContent.length > 150 && "..."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-9 bg-white text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-9 bg-[#123aff] hover:bg-[#123aff]/90 text-white"
            >
              <Wand2 className="w-4 h-4 mr-1" strokeWidth={1.5} />
              保存技能
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSkillDialog;




