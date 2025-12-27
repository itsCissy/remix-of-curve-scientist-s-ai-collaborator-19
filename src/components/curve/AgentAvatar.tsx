interface AgentAvatarProps {
  size?: "sm" | "md" | "lg";
}

const AgentAvatar = ({ size = "md" }: AgentAvatarProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-primary/20`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5 text-primary"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" className="fill-primary/10" />
        <path
          d="M8 14s1.5 2 4 2 4-2 4-2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    </div>
  );
};

export default AgentAvatar;
