import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export function Card({
  children,
  className,
  hoverable = false,
  glass = false,
  ...props
}) {
  const baseStyles = "rounded-lg overflow-hidden border focus-visible-ring";
  
  const backgroundStyles = glass 
    ? "glass-panel" 
    : "bg-surface-1 border-zinc-800 shadow-depth-1";
    
  const hoverStyles = hoverable
    ? "transition-normal hover:shadow-depth-2 hover:border-zinc-600 hover:-translate-y-0.5"
    : "";

  return (
    <div
      className={twMerge(clsx(baseStyles, backgroundStyles, hoverStyles, className))}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={twMerge(clsx("p-4 md:p-6", className))} {...props}>
      {children}
    </div>
  );
}
