import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TypeWriterProps {
  text: string;
  typingSpeed?: number; // in ms
  pauseDuration?: number; // in ms
  deletingSpeed?: number; // in ms
  cursorBlinkDuration?: number; // in seconds
  cursorCharacter?: string;
  showCursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

const TypeWriter = ({
  text,
  typingSpeed = 75,
  pauseDuration = 1500,
  deletingSpeed = 50,
  cursorBlinkDuration = 0.5,
  cursorCharacter = "_",
  showCursor = true,
  className,
  onComplete,
}: TypeWriterProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  // 使用 useRef 保存 onComplete，避免依赖变化导致 effect 重新执行
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      setIsComplete(true);
      onCompleteRef.current?.();
      return;
    }

    let index = 0;
    setDisplayedText("");
    setIsComplete(false);

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [text, typingSpeed]);

  return (
    <span className={cn("inline", className)}>
      {displayedText}
      {showCursor && !isComplete && (
        <span
          className="inline-block animate-blink"
          style={{
            animationDuration: `${cursorBlinkDuration}s`,
          }}
        >
          {cursorCharacter}
        </span>
      )}
      <style>
        {`
          @keyframes blink {
            0%, 49% {
              opacity: 1;
            }
            50%, 100% {
              opacity: 0;
            }
          }
          .animate-blink {
            animation: blink ${cursorBlinkDuration}s infinite;
          }
        `}
      </style>
    </span>
  );
};

export default TypeWriter;

