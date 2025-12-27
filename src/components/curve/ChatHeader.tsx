import { ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  projectName: string;
}

const ChatHeader = ({ projectName }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-end px-6 py-4">
      <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        <span>{projectName}</span>
      </button>
    </div>
  );
};

export default ChatHeader;
