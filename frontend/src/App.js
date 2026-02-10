import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import TodayTab from "@/pages/TodayTab";
import ItineraryTab from "@/pages/ItineraryTab";
import CurrencyTab from "@/pages/CurrencyTab";
import ToolsTab from "@/pages/ToolsTab";
import SettingsTab from "@/pages/SettingsTab";
import api from "@/lib/api";

function App() {
  const [activeTab, setActiveTab] = useState("today");
  const [settings, setSettings] = useState({
    exchange_rate: 0.56,
    theme: "dark",
    reminder_minutes: 30,
  });
  const [seeded, setSeeded] = useState(false);

  // Apply theme
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  // Load settings + auto-seed
  const init = useCallback(async () => {
    try {
      const s = await api.getSettings();
      if (s && !s.error) setSettings(s);
    } catch (e) {
      console.error("Settings load error", e);
    }
    try {
      await api.seed();
    } catch (e) {
      console.error("Seed error", e);
    }
    setSeeded(true);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  if (!seeded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-4xl mb-3">旅</p>
          <p className="text-sm text-muted-foreground tracking-widest uppercase">
            Loading your journey...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dot-pattern">
      <div className="pb-20 max-w-lg mx-auto">
        {activeTab === "today" && <TodayTab settings={settings} />}
        {activeTab === "itinerary" && <ItineraryTab />}
        {activeTab === "currency" && <CurrencyTab settings={settings} />}
        {activeTab === "tools" && <ToolsTab />}
        {activeTab === "settings" && (
          <SettingsTab settings={settings} setSettings={setSettings} />
        )}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
