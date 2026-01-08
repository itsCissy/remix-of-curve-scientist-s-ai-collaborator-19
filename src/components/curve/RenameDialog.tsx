import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => void;
}

const RenameDialog = ({
  open,
  onOpenChange,
  currentName,
  onConfirm,
}: RenameDialogProps) => {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleConfirm = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onConfirm(newName.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle>重命名项目</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="project-name" className="text-sm text-muted-foreground mb-2 block">
            项目名称
          </Label>
          <Input
            id="project-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入新的项目名称"
            className="w-full"
            autoFocus
          />
          {newName.trim() === "" && (
            <p className="text-xs text-destructive mt-1">项目名称不能为空</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!newName.trim() || newName.trim() === currentName}
          >
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
