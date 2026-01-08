const CapabilitiesIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Four squares in a 2x2 grid representing matrix/capabilities with perspective */}
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      {/* Connection lines between squares - creating a network effect */}
      <line x1="10" y1="6.5" x2="14" y2="6.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="6.5" y1="10" x2="6.5" y2="14" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="21" y1="6.5" x2="21" y2="14" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="10" y1="17.5" x2="14" y2="17.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      {/* Diagonal connections for matrix effect */}
      <line x1="10" y1="6.5" x2="6.5" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="14" y1="6.5" x2="21" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
};

export default CapabilitiesIcon;

