import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect, useRef } from "react";

interface OutputResult {
  command: string;
  output: string;
  error: string;
}

interface OutputTerminalProps {
  results: OutputResult[];
  onClear: () => void;
}

export default function OutputTerminal({ results, onClear }: OutputTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { terminalFontSize } = useSettingsStore();

  // Auto scroll to bottom on new results
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [results]);

  const copyToClipboard = () => {
    if (results.length === 0) return;
    
    const text = results
      .map(result => {
        let output = `$ ${result.command}\n`;
        if (result.output) output += result.output;
        if (result.error) output += result.error;
        return output;
      })
      .join('\n\n');
    
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "Terminal output has been copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy output to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-900 rounded-md border border-gray-700">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="text-white font-medium">Output</div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-400 hover:text-white h-8 px-2"
            title="Clear output"
            disabled={results.length === 0}
          >
            <i className="fas fa-trash-alt"></i>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white h-8 px-2"
            title="Copy to clipboard"
            disabled={results.length === 0}
          >
            <i className="fas fa-copy"></i>
          </Button>
        </div>
      </div>
      
      <div 
        ref={terminalRef} 
        className="flex-1 overflow-auto p-4 output-terminal"
        style={{
          fontSize: `${terminalFontSize}px`
        }}
      >
        {results.length > 0 ? (
          results.map((result, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="mb-1 text-gray-400 terminal-text flex items-center">
                <span className="text-primary mr-2">$</span>
                <span>{result.command}</span>
              </div>
              <div className="pl-4 border-l-2 border-gray-700">
                {result.output && (
                  <pre className="text-green-400 terminal-text whitespace-pre-wrap text-sm">
                    {result.output}
                  </pre>
                )}
                {result.error && (
                  <pre className="text-red-400 terminal-text whitespace-pre-wrap text-sm">
                    {result.error}
                  </pre>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              <i className="fas fa-terminal text-4xl"></i>
            </div>
            <p className="text-gray-400">No command output to display</p>
            <p className="text-gray-500 text-sm mt-2">Enter a kubectl command above to get started</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="text-gray-400 flex items-center mt-2">
            <span className="mr-1">$</span>
            <span className="w-2 h-4 bg-gray-400 inline-block cursor-blink"></span>
          </div>
        )}
      </div>
    </div>
  );
}
