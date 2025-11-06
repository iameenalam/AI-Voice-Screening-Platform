import { Mic2 } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Mic2 className="h-8 w-8 text-primary" />
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </div>
      <span className="text-2xl font-bold tracking-tight">VOCALENT</span>
    </div>
  );
};
