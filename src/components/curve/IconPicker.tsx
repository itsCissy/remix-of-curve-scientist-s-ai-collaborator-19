interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const icons = [
  "📋", "📝", "📄", "📁", "📂", "🗂️",
  "🔬", "🧪", "⚗️", "🧬", "💊", "💉",
  "🎯", "🎨", "🎭", "🎪", "🎢", "🎡",
  "🚀", "✨", "💡", "🔥", "⚡", "💫",
  "💜", "💙", "💚", "💛", "🧡", "❤️",
  "🐷", "🐱", "🐶", "🐰", "🦊", "🐻",
  "📦", "📊", "📈", "📉", "🗃️", "🗄️",
  "✏️", "🖊️", "🖋️", "✒️", "📌", "📍",
  "🔍", "🔎", "🔒", "🔓", "🔑", "🗝️",
  "⚙️", "🛠️", "🔧", "🔨", "⛏️", "🪛",
  "🌟", "⭐", "🌙", "☀️", "🌈", "🌊",
  "🎵", "🎶", "🎤", "🎧", "🎼", "🎹",
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
      <div className="absolute left-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-3 w-[280px]">
        <div className="grid grid-cols-6 gap-1">
          {icons.map((icon, index) => (
            <button
              key={index}
              onClick={() => onSelect(icon)}
              className={`w-10 h-10 flex items-center justify-center rounded-md text-xl hover:bg-muted transition-colors ${
                selectedIcon === icon ? "bg-primary/10 ring-1 ring-primary" : ""
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
