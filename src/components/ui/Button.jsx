import React from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  icon: Icon,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-md transition-normal focus-visible-ring disabled:opacity-50 disabled:pointer-events-none select-none min-h-[44px] md:min-h-0";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-depth-1 hover:shadow-depth-2 active:bg-primary-dark",
    secondary: "bg-surface-2 hover:bg-surface-3 text-zinc-100 border border-zinc-800 hover:border-zinc-700 active:bg-surface-1",
    ghost: "bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white",
    icon: "bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg",
    premium: "bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-primary text-white shadow-depth-2 hover:shadow-depth-3 border border-white/10 relative overflow-hidden"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-body-s",
    md: "px-4 py-2 text-body-m",
    lg: "px-6 py-3 text-body-l",
    icon: "w-[44px] h-[44px] md:w-10 md:h-10 p-2"
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className={clsx("h-5 w-5", children ? "mr-2" : "")} />}
      {children}
    </button>
  );
}
