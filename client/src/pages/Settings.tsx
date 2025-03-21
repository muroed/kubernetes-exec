import { useSettingsStore } from "@/store/useSettingsStore";
import { useKubernetesStore } from "@/store/useKubernetesStore";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function Settings() {
  const { 
    darkMode, 
    setDarkMode,
    terminalFontSize, 
    setTerminalFontSize,
    autoClearTerminal,
    setAutoClearTerminal
  } = useSettingsStore();
  
  const { 
    currentContext, 
    setCurrentContext, 
    contexts,
    currentNamespace, 
    setCurrentNamespace, 
    namespaces 
  } = useKubernetesStore();

  return (
    <div className="flex-1 overflow-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Appearance</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Kubernetes Context</h3>
            <div className="mb-3 space-y-1.5">
              <Label htmlFor="context">Current Context</Label>
              <Select id="context" value={currentContext} onValueChange={setCurrentContext}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select context" />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map((ctx) => (
                    <SelectItem key={ctx} value={ctx}>{ctx}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="namespace">Default Namespace</Label>
              <Select id="namespace" value={currentNamespace} onValueChange={setCurrentNamespace}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select namespace" />
                </SelectTrigger>
                <SelectContent>
                  {namespaces.map((ns) => (
                    <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Terminal Settings</h3>
            <div className="mb-3 space-y-1.5">
              <Label htmlFor="font-size">Font Size</Label>
              <Select id="font-size" value={terminalFontSize} onValueChange={setTerminalFontSize}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">Small (12px)</SelectItem>
                  <SelectItem value="14">Medium (14px)</SelectItem>
                  <SelectItem value="16">Large (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="auto-clear" 
                checked={autoClearTerminal}
                onCheckedChange={(checked) => setAutoClearTerminal(checked as boolean)}
              />
              <Label htmlFor="auto-clear">Auto-clear terminal after exceeding 1000 lines</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
