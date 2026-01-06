import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X as XIcon } from "lucide-react";

export type Option<T = any> = {
  value: string | number;
  label: string;
  meta?: T;
};

interface SearchableDropdownProps<T = any> {
  value?: string | number;
  inputValue?: string; // for custom typing when no selection
  onChangeInput?: (val: string) => void;
  options: Option<T>[];
  placeholder?: string;
  allowCustom?: boolean;
  onSelect: (option: Option<T> | null, isCustom: boolean, inputText: string) => void;
  customActionLabel?: (text: string) => string; // label for custom action (e.g., Create "text")
  onCustomAction?: (text: string) => void; // callback when custom action clicked
  loading?: boolean;
  disabled?: boolean;
  renderOption?: (option: Option<T>) => React.ReactNode;
  debounceMs?: number;
  className?: string;
  clearable?: boolean;
}

const SearchableDropdown = <T,>({
  value,
  inputValue,
  onChangeInput,
  options,
  placeholder = "Select...",
  allowCustom = false,
  onSelect,
  customActionLabel,
  onCustomAction,
  loading = false,
  disabled = false,
  renderOption,
  debounceMs = 150,
  className = "",
  clearable = true,
}: SearchableDropdownProps<T>) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hoverIndex, setHoverIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const displayText = useMemo(() => {
    const selected = typeof value !== "undefined" && value !== null
      ? options.find((o) => String(o.value) === String(value))
      : undefined;
    const typed = query || inputValue || "";
    // Prefer typed text only after the user actually typed something,
    // or when there is no selection at all.
    if (query.length > 0 || (typeof value === "undefined" || value === null)) {
      return typed;
    }
    // Otherwise, show selected label while focusing/clicking without clearing it.
    return selected?.label ?? typed;
  }, [value, inputValue, options, query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounce input updates to parent if provided
  const debouncedUpdate = useRef<number | null>(null);
  const handleInput = (text: string) => {
    setQuery(text);
    setOpen(true);
    // If a selection exists and the user starts typing, convert to free text mode
    if (typeof value !== "undefined" && value !== null) {
      onSelect(null, false, text);
    }
    if (onChangeInput) {
      if (debouncedUpdate.current) window.clearTimeout(debouncedUpdate.current);
      debouncedUpdate.current = window.setTimeout(() => onChangeInput(text), debounceMs);
    }
  };

  const filtered = useMemo(() => {
    const q = (query || inputValue || "").toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 50);
  }, [options, query, inputValue]);

  const handleSelect = (opt: Option<T>) => {
    onSelect(opt, false, "");
    setOpen(false);
    setQuery("");
  };

  // When opening, default hover to the first item for easier keyboard selection
  useEffect(() => {
    if (open) {
      setHoverIndex(filtered.length > 0 ? 0 : -1);
    }
  }, [open, filtered.length]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (filtered.length > 0) {
        setHoverIndex((prev) => {
          const next = prev < 0 ? 0 : (prev + 1) % filtered.length;
          return next;
        });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (filtered.length > 0) {
        setHoverIndex((prev) => {
          const next = prev < 0 ? filtered.length - 1 : (prev - 1 + filtered.length) % filtered.length;
          return next;
        });
      }
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        if (hoverIndex >= 0 && hoverIndex < filtered.length) {
          handleSelect(filtered[hoverIndex]);
        } else if (allowCustom) {
          handleCustom();
        }
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const handleCustom = () => {
    const text = query || inputValue || "";
    if (onCustomAction) {
      onCustomAction(text);
    } else {
      onSelect(null, true, text);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    if (onChangeInput) onChangeInput("");
    onSelect(null, false, "");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
          placeholder={placeholder}
          value={displayText}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {clearable && !disabled && typeof value !== "undefined" && value !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
              aria-label="Clear selection"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto dark:bg-gray-900 dark:border-gray-700">
          {loading && (
            <div className="p-3 text-sm text-gray-500">Loading...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No results</div>
          )}
          {!loading && filtered.map((opt, idx) => (
            <div
              key={String(opt.value)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${hoverIndex === idx ? 'bg-gray-100' : ''}`}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(-1)}
              onClick={() => handleSelect(opt)}
            >
              {renderOption ? renderOption(opt) : (
                <span className="text-sm text-gray-800 dark:text-gray-100">{opt.label}</span>
              )}
            </div>
          ))}
          {allowCustom && (query || inputValue) && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div
                className="px-3 py-2 cursor-pointer text-sm text-blue-600 hover:bg-blue-50"
                onClick={handleCustom}
              >
                {customActionLabel
                  ? customActionLabel(query || inputValue || "")
                  : `Create "${query || inputValue}"`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
