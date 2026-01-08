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
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void;
}

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  projectName,
  onConfirm,
}: DeleteConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">确认删除项目</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            您确定要删除项目 <span className="font-medium text-foreground">"{projectName}"</span> 吗？
            <br />
            <span className="text-sm text-slate-500 mt-2 block">
              此操作不可撤销，项目中的所有数据、对话记录和配置将被永久删除。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="px-4">取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="px-4"
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
