import AgentAvatar from "./AgentAvatar";
import UserAvatar from "./UserAvatar";

interface AgentMessageProps {
  children: React.ReactNode;
}

const AgentMessage = ({ children }: AgentMessageProps) => {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex-shrink-0 mt-1">
        <AgentAvatar size="md" />
      </div>
      <div className="flex-1 max-w-[800px]">
        <div className="text-sm text-foreground leading-relaxed space-y-4">
          {children}
        </div>
      </div>
      {/* User avatar on right side for context */}
      <div className="flex-shrink-0 mt-1 opacity-0">
        <UserAvatar name="" size="md" showName={false} />
      </div>
    </div>
  );
};

export default AgentMessage;
