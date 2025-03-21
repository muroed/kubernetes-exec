import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KeyboardEvent } from "react";
import { Server } from "lucide-react";

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (command: string) => void;
  isAuthenticated: boolean;
  onAuthClick: () => void;
  selectedPod?: string | null;
}

export default function CommandInput({
  value,
  onChange,
  onExecute,
  isAuthenticated,
  onAuthClick,
  selectedPod
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
        {selectedPod && (
          <Badge variant="outline" className="mr-2 flex items-center gap-1 py-1 px-2">
            <Server className="h-3 w-3" />
            <span className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-xs">
              {selectedPod}
            </span>
          </Badge>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder={selectedPod ? "Enter command to run in pod..." : "Enter kubectl command..."}
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
