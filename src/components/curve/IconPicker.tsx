interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const scientificIcons = [
  // Science & Lab
  "🔬", "🧪", "⚗️", "🧬", "💊", "💉",
  "🧫", "🦠", "🧲", "⚛️", "🔭", "📡",
  // Data & Analysis
  "📊", "📈", "📉", "🗂️", "📋", "📁",
  // Chemistry
  "⚗️", "🧪", "💎", "🪨", "🧂", "🌡️",
  // Tech & Tools
  "💻", "🖥️", "⚙️", "🛠️", "🔧", "📐",
  // Research
  "📝", "📄", "📑", "🔍", "🔎", "💡",
  // Bio
  "🧬", "🦴", "🫀", "🧠", "👁️", "🦷",
  // Symbols
  "✨", "⭐", "🌟", "💫", "🔥", "⚡",
  // Status
  "✅", "🎯", "🚀", "🏆", "🎨", "🔮",
];

const IconPicker = ({ selectedIcon, onSelect, onClose }: IconPickerProps) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Picker */}
      <div className="absolute left-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-[260px]">
        <div className="text-xs text-muted-foreground mb-2 px-1">选择项目图标</div>
        <div className="grid grid-cols-6 gap-1">
          {scientificIcons.map((icon, index) => (
            <button
              key={index}
              onClick={() => onSelect(icon)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg hover:bg-muted transition-colors ${
                selectedIcon === icon ? "bg-primary/10 ring-2 ring-primary/50" : ""
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default IconPicker;
