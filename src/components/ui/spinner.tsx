import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-block h-4 w-4", className)}>
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          className="absolute left-[46.5%] top-[4.4%] h-[24%] w-[8%] rounded-full bg-current opacity-[0.15]"
          style={{
            transform: `rotate(${i * 30}deg)`,
            transformOrigin: "center 190%",
            animation: "ios-spinner 1.2s linear infinite",
            animationDelay: `${-1.2 + (i * 0.1)}s`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ios-spinner {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}} />
    </div>
  );
}
