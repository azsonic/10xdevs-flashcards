import { useState, useEffect, type FormEvent, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  disabled: boolean;
}

/**
 * Controlled search input with clear button and submit functionality.
 * Allows searching flashcards by front or back content.
 * Implements debouncing to prevent triggering search on every keystroke.
 */
export function SearchInput({ value, onChange, onSubmit, disabled }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const hadFocus = useRef(false);
  const lastParentValue = useRef(value);
  const isClearing = useRef(false);
  const isMounted = useRef(false);

  // Sync with parent value changes
  useEffect(() => {
    // Don't sync if we're in the middle of clearing
    if (isClearing.current) {
      return;
    }

    const parentValueChanged = lastParentValue.current !== value;
    lastParentValue.current = value;

    // If parent just changed to empty (Clear Search was clicked)
    if (parentValueChanged && value === "") {
      isClearing.current = true; // Prevent duplicate triggers
      setLocalValue("");
      hadFocus.current = false;
      return;
    }

    // Otherwise, only sync if user doesn't have focus
    if (!hadFocus.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  // Trigger search when debounced value changes
  useEffect(() => {
    // Don't trigger during clearing process
    if (isClearing.current) {
      return;
    }

    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  // Restore focus after re-render if user was typing (but not if clearing)
  useEffect(() => {
    // Mark as mounted after first render
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (!isClearing.current && hadFocus.current && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
    // Reset isClearing after a short delay to ensure all effects have processed
    const timeout = setTimeout(() => {
      isClearing.current = false;
    }, 100);
    return () => clearTimeout(timeout);
  });

  const handleChange = (newValue: string) => {
    hadFocus.current = true;
    setLocalValue(newValue);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    hadFocus.current = false;
    onChange(localValue.trim());
    onSubmit(localValue.trim());
  };

  const handleClear = () => {
    isClearing.current = true;
    hadFocus.current = false;
    setLocalValue("");
    // Also directly clear the input element
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange("");
  };

  const handleFocus = () => {
    hadFocus.current = true;
  };

  const handleBlur = () => {
    hadFocus.current = false;
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search flashcards..."
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur
              handleClear();
            }}
            disabled={disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
