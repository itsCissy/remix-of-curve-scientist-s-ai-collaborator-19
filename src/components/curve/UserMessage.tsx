import UserAvatar from "./UserAvatar";

interface UserMessageProps {
  content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end items-start gap-3 animate-fade-in">
      <div className="max-w-[600px] bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
      <div className="flex-shrink-0">
        <UserAvatar name="" size="md" showName={false} />
      </div>
    </div>
  );
};

export default UserMessage;
