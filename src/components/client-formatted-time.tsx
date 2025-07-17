
'use client';

import { useState, useEffect } from 'react';

interface ClientFormattedTimeProps {
  date: Date;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

export default function ClientFormattedTime({ date, options, className }: ClientFormattedTimeProps) {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    // Ensure date is a valid Date object before calling toLocaleTimeString
    if (date instanceof Date && !isNaN(date.valueOf())) {
      // The first argument to toLocaleTimeString (locales) is undefined 
      // so it uses the browser's default locale.
      setFormattedTime(date.toLocaleTimeString(undefined, options));
    } else {
      setFormattedTime("Invalid date");
    }
  }, [date, options]);

  if (formattedTime === null) {
    // Render a placeholder on the server and initial client render to avoid mismatch.
    // Using a few non-breaking spaces or an invisible character of similar width can help maintain layout.
    // Or, for simplicity, render nothing.
    return <span className={className}>&nbsp;</span>; // Placeholder to prevent layout shift as much as possible
  }

  return <span className={className}>{formattedTime}</span>;
}
