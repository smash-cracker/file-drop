import { cn } from "@/lib/utils";

export function PulsingIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center size-20",
        className
      )}
    >
      <div
        className="absolute w-full h-full bg-primary rounded-full opacity-0"
        style={{
          animation: "scaleIn 4s infinite cubic-bezier(.36, .11, .89, .32)",
          animationDelay: "-3s",
        }}
      />
      <div
        className="absolute w-full h-full bg-primary rounded-full opacity-0"
        style={{
          animation: "scaleIn 4s infinite cubic-bezier(.36, .11, .89, .32)",
          animationDelay: "-2s",
        }}
      />
      <div
        className="absolute w-full h-full bg-primary rounded-full opacity-0"
        style={{
          animation: "scaleIn 4s infinite cubic-bezier(.36, .11, .89, .32)",
          animationDelay: "-1s",
        }}
      />
      <div
        className="absolute w-full h-full bg-primary rounded-full opacity-0"
        style={{
          animation: "scaleIn 4s infinite cubic-bezier(.36, .11, .89, .32)",
          animationDelay: "0s",
        }}
      />
      {/* Central static circle or icon can go here if needed, but tutorial implies just rings */}
      <div className="relative z-10 bg-primary rounded-full w-4 h-4 shadow-lg" />
    </div>
  );
}
