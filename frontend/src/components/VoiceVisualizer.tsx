import { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  isActive?: boolean;
  className?: string;
}

export const VoiceVisualizer = ({ isActive = false, className = "" }: VoiceVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(Array(20).fill(20));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(20).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setBars(Array(20).fill(0).map(() => Math.random() * 80 + 20));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className={`flex items-center justify-center gap-1 h-24 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-1 bg-primary rounded-full transition-all duration-100"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};
