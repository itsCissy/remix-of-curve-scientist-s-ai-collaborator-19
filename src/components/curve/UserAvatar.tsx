interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const UserAvatar = ({ name, size = "md", showName = true }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden`}
      >
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {showName && (
        <span className="text-sm text-foreground font-medium">{name}</span>
      )}
    </div>
  );
};

export default UserAvatar;
