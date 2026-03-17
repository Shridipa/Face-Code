import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedCounter({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = parseFloat(value) || 0;
    if (start === end) return;

    const duration = 1000;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const current = Math.min((progress / duration) * (end - start) + start, end);
      setDisplayValue(current);
      if (progress < duration) requestAnimationFrame(animate);
      else setDisplayValue(end);
    };
    requestAnimationFrame(animate);
  }, [value]);

  const formatted = Number.isInteger(displayValue) ? Math.floor(displayValue) : displayValue.toFixed(1);

  return (
    <span className="font-bold">
      {formatted}{suffix}
    </span>
  );
}
