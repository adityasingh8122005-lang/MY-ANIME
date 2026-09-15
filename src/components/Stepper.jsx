import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

export default function Stepper({ value, onChange, max, min = 0 }) {
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const valRef = useRef(value);

  // Sync ref when prop changes
  useEffect(() => {
    valRef.current = value;
  }, [value]);

  const increment = () => {
    if (max !== undefined && valRef.current >= max) return;
    setDirection(1);
    const newVal = valRef.current + 1;
    valRef.current = newVal;
    onChange(newVal);
  };

  const decrement = () => {
    if (valRef.current <= min) return;
    setDirection(-1);
    const newVal = valRef.current - 1;
    valRef.current = newVal;
    onChange(newVal);
  };

  const startAutoIncrement = () => {
    increment();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (max !== undefined && valRef.current >= max) {
          stopAuto();
          return;
        }
        setDirection(1);
        const newVal = valRef.current + 1;
        valRef.current = newVal;
        onChange(newVal);
      }, 75);
    }, 400);
  };

  const startAutoDecrement = () => {
    decrement();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (valRef.current <= min) {
          stopAuto();
          return;
        }
        setDirection(-1);
        const newVal = valRef.current - 1;
        valRef.current = newVal;
        onChange(newVal);
      }, 75);
    }, 400);
  };

  const stopAuto = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return stopAuto;
  }, []);

  const fillPercentage = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-full h-10 w-fit select-none overflow-hidden shadow-inner group">
      {max !== undefined && max > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 bg-accent/20 transition-all duration-300 ease-out" 
          style={{ width: `${fillPercentage}%` }}
        />
      )}

      <button 
        onPointerDown={startAutoDecrement}
        onPointerUp={stopAuto}
        onPointerLeave={stopAuto}
        disabled={value <= min}
        className="relative z-10 flex items-center justify-center w-10 h-full text-zinc-400 hover:text-white hover:bg-zinc-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95 touch-none"
      >
        <Minus size={14} />
      </button>

      <div className="relative z-10 w-12 h-full flex items-center justify-center overflow-hidden text-white font-bold text-sm tabular-nums">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={value}
            custom={direction}
            initial={(d) => ({ opacity: 0, y: d * 15, filter: 'blur(4px)' })}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={(d) => ({ opacity: 0, y: d * -15, filter: 'blur(4px)' })}
            transition={{ type: "spring", stiffness: 300, damping: 25, mass: 1 }}
            className="absolute"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <button 
        onPointerDown={startAutoIncrement}
        onPointerUp={stopAuto}
        onPointerLeave={stopAuto}
        disabled={max !== undefined && value >= max}
        className="relative z-10 flex items-center justify-center w-10 h-full text-zinc-400 hover:text-white hover:bg-zinc-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95 touch-none"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
