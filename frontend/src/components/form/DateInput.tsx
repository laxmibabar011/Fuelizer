import React, { useRef, useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "./dateinput-calendar-google.css";
import { Calendar } from "lucide-react";

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
}

const DateInput: React.FC<DateInputProps> = ({ id, value, onChange, required, label }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedDate = value ? new Date(value) : undefined;

  const handleDaySelect = (date?: Date) => {
    if (date) {
      // Use local date string to avoid timezone issues
      const local = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
      onChange(local);
      setShowCalendar(false);
    }
  };

  useEffect(() => {
    if (!showCalendar) return;
    const handleClick = (e: MouseEvent) => {
      const calendar = document.getElementById(`calendar-popup-${id}`);
      if (calendar && !calendar.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCalendar, id]);

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={id} className="block mb-1 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800"
          required={required}
          autoComplete="off"
          onFocus={() => setShowCalendar(false)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 bg-white border border-gray-200 rounded-full shadow hover:bg-gray-100 transition-all cursor-pointer"
          onClick={() => setShowCalendar((v) => !v)}
          aria-label="Open calendar"
          style={{ outline: "none" }}
        >
          <Calendar className="h-5 w-5 text-blue-500" />
        </button>
      </div>
      {showCalendar && (
        <div
          id={`calendar-popup-${id}`}
          className="custom-calendar-popup absolute z-50 mt-2 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-max min-w-[260px] max-w-[350px]"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            defaultMonth={selectedDate}
            styles={{
              months: { display: 'flex', justifyContent: 'center' },
              caption: { fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb', marginBottom: '0.5rem' },
              nav: { color: '#2563eb', fontWeight: 'bold' },
              table: { width: '100%' },
              head_row: { fontWeight: 'bold', color: '#2563eb', fontSize: '1rem' },
              cell: { padding: '0.5rem', borderRadius: '0.75rem', transition: 'background 0.2s' },
              day_selected: { backgroundColor: '#2563eb', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.15)', fontWeight: 'bold' },
              day: { borderRadius: '0.75rem', fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' },
              day_today: { border: '2px solid #2563eb', background: '#e0e7ff', color: '#2563eb', fontWeight: 'bold' },
              day_outside: { color: '#cbd5e1', opacity: 0.6 },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DateInput;
