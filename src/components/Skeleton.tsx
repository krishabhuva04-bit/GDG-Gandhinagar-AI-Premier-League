import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export default function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  let baseClass = "animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 relative overflow-hidden border border-white/5";
  
  if (variant === "circle") {
    baseClass += " rounded-full";
  } else if (variant === "text") {
    baseClass += " rounded h-4";
  } else {
    baseClass += " rounded-2xl";
  }

  return (
    <div className={`${baseClass} ${className}`}>
      {/* Dynamic shimmer glow sweep sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </div>
  );
}
