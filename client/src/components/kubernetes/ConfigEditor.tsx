
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ConfigEditor() {
  const [config, setConfig] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/kubernetes/config');
      const data = await response.json();
      setConfig(JSON.stringify(data, null, 2));
    } catch (error) {
      setError('Failed to load config');
    }
  };

  const handleSave = async () => {
    try {
      // Validate JSON
      const parsedConfig = JSON.parse(config);
      
      const response = await fetch('/api/kubernetes/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedConfig),
      });

      if (response.ok) {
        setSuccess('Config saved successfully');
        setError('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save config');
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Kubernetes Config Editor</h2>
        <Button onClick={handleSave}>Save Config</Button>
      </div>
      
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
      
      <Textarea
        value={config}
        onChange={(e) => setConfig(e.target.value)}
        className="font-mono h-[400px]"
        placeholder="Loading config..."
      />
    </div>
  );
}
