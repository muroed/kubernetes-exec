import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardEvent } from "react";

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (command: string) => void;
  isAuthenticated: boolean;
  onAuthClick: () => void;
}

export default function CommandInput({
  value,
  onChange,
  onExecute,
  isAuthenticated,
  onAuthClick,
}: CommandInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onExecute(value);
    }
  };

  return (
    <div className="relative mb-4">
      <div
        className="flex items-center terminal-text bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md overflow-hidden"
      >
        <div className="flex-none pl-3 py-2.5 text-gray-500 dark:text-gray-400">$</div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder="Enter kubectl command..."
          className="flex-1 py-2.5 px-2 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 terminal-text"
        />
        <Button
          onClick={() => onExecute(value)}
          className="rounded-none"
          disabled={!value}
        >
          <i className="fas fa-play mr-2"></i>Execute
        </Button>
      </div>
      
      {/* Authentication overlay removed */}
    </div>
  );
}
