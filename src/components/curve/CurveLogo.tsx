const CurveLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 12l8-8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      <span className="text-lg font-semibold text-foreground">Curve</span>
    </div>
  );
};

export default CurveLogo;
