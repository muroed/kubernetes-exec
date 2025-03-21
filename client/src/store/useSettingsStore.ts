import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  terminalFontSize: string;
  setTerminalFontSize: (fontSize: string) => void;
  autoClearTerminal: boolean;
  setAutoClearTerminal: (autoClear: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      setDarkMode: (darkMode) => set({ darkMode }),
      
      terminalFontSize: '14',
      setTerminalFontSize: (fontSize) => set({ terminalFontSize: fontSize }),
      
      autoClearTerminal: true,
      setAutoClearTerminal: (autoClear) => set({ autoClearTerminal: autoClear }),
    }),
    {
      name: 'kubecli-settings',
    }
  )
);
