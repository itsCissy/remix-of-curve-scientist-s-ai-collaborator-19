import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import IconPicker from "./IconPicker";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("📋");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleCreate = () => {
    // Handle project creation logic here
    console.log({ projectName, projectDescription, selectedIcon });
    onOpenChange(false);
    // Reset form
    setProjectName("");
    setProjectDescription("");
    setSelectedIcon("📋");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setProjectName("");
    setProjectDescription("");
    setSelectedIcon("📋");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 bg-card border-border" hideCloseButton>
        <DialogHeader className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              New Project
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">
              Project Name<span className="text-destructive">*</span>
            </label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder=""
              className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">
              Project Description
            </label>
            <Textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder=""
              className="min-h-[100px] resize-y border-border bg-transparent focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Project Icon */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Project Icon</label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-2 border-border hover:bg-muted"
              >
                <span className="text-lg">{selectedIcon}</span>
                <span>Select Icon</span>
              </Button>
              
              {showIconPicker && (
                <IconPicker
                  selectedIcon={selectedIcon}
                  onSelect={(icon) => {
                    setSelectedIcon(icon);
                    setShowIconPicker(false);
                  }}
                  onClose={() => setShowIconPicker(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
