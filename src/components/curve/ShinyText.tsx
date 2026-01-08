import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  speed?: number; // in seconds
  delay?: number; // in seconds
  spread?: number; // in degrees
  textColor?: string;
  shineColor?: string;
  direction?: "left" | "right";
  className?: string;
}

const ShinyText = ({
  text,
  speed = 2,
  delay = 0,
  spread = 120,
  textColor = "#475569",
  shineColor = "#A2A8B7",
  direction = "left",
  className,
}: ShinyTextProps) => {
  // Calculate the gradient angle based on direction and spread
  const gradientAngle = direction === "left" ? spread : 180 - spread;
  
  // Create the gradient for the shine effect
  const shineGradient = `linear-gradient(
    ${gradientAngle}deg,
    ${textColor} 0%,
    ${textColor} 40%,
    ${shineColor} 50%,
    ${textColor} 60%,
    ${textColor} 100%
  )`;

  const animationStyle: CSSProperties = {
    backgroundImage: shineGradient,
    backgroundSize: "200% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    animation: `shiny-text-animation ${speed}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
  };

  return (
    <>
      <style>
        {`
          @keyframes shiny-text-animation {
            0% {
              background-position: ${direction === "left" ? "200%" : "-100%"} 0;
            }
            100% {
              background-position: ${direction === "left" ? "-100%" : "200%"} 0;
            }
          }
        `}
      </style>
      <span className={cn("inline-block", className)} style={animationStyle}>
        {text}
      </span>
    </>
  );
};

export default ShinyText;



