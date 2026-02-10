import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Moon,
  Sun,
  Download,
  Upload,
  Calendar,
  DollarSign,
  Bell,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function SettingsTab({ settings, setSettings }) {
  const [rateInput, setRateInput] = useState(String(settings.exchange_rate));
  const [importText, setImportText] = useState("");

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await api.updateSettings(updated);
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
    }
  };

  const handleRateSave = () => {
    const val = parseFloat(rateInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid exchange rate");
      return;
    }
    updateSetting("exchange_rate", val);
  };

  const handleExportJson = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tabi-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const handleImportJson = async () => {
    try {
      const data = JSON.parse(importText);
      await api.importData(data);
      toast.success("Data imported successfully. Refresh to see changes.");
      setImportText("");
    } catch (e) {
      toast.error("Invalid JSON or import failed");
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        await api.importData(data);
        toast.success("Data imported from file. Refresh to see changes.");
      } catch (err) {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadIcs = () => {
    const url = api.getIcsUrl();
    window.open(url, "_blank");
    toast.success("Calendar file downloading...");
  };

  return (
    <div className="p-4 space-y-4" data-testid="settings-tab">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Customize your experience</p>
      </div>

      {/* Theme Toggle */}
      <Card className="rounded-2xl border-border/50" data-testid="theme-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === "dark" ? (
                <Moon size={18} className="text-primary" />
              ) : (
                <Sun size={18} className="text-primary" />
              )}
              <div>
                <Label className="text-sm font-semibold">Dark Mode</Label>
                <p className="text-[10px] text-muted-foreground">Toggle between themes</p>
              </div>
            </div>
            <Switch
              checked={settings.theme === "dark"}
              onCheckedChange={(checked) => updateSetting("theme", checked ? "dark" : "light")}
              data-testid="theme-toggle"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate */}
      <Card className="rounded-2xl border-border/50" data-testid="exchange-rate-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            <Label className="text-sm font-semibold">Exchange Rate</Label>
          </div>
          <p className="text-[10px] text-muted-foreground">1 JPY = ? INR</p>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="rounded-xl"
              data-testid="exchange-rate-input"
            />
            <Button
              onClick={handleRateSave}
              className="rounded-full"
              data-testid="save-rate-btn"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reminder */}
      <Card className="rounded-2xl border-border/50" data-testid="reminder-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-primary" />
              <div>
                <Label className="text-sm font-semibold">Reminder Time</Label>
                <p className="text-[10px] text-muted-foreground">Before each event</p>
              </div>
            </div>
            <Select
              value={String(settings.reminder_minutes)}
              onValueChange={(v) => updateSetting("reminder_minutes", parseInt(v))}
            >
              <SelectTrigger className="w-24 rounded-xl" data-testid="reminder-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Export */}
      <Card className="rounded-2xl border-border/50" data-testid="calendar-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <Label className="text-sm font-semibold">Calendar Sync</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Download .ics file to add the entire trip to your calendar app
          </p>
          <Button
            variant="outline"
            className="rounded-full w-full"
            onClick={handleDownloadIcs}
            data-testid="download-ics-btn"
          >
            <Download size={14} className="mr-2" />
            Download Calendar File (.ics)
          </Button>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card className="rounded-2xl border-border/50" data-testid="export-import-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-primary" />
            <Label className="text-sm font-semibold">Backup & Restore</Label>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-full flex-1"
              onClick={handleExportJson}
              data-testid="export-json-btn"
            >
              <Download size={14} className="mr-1" />
              Export JSON
            </Button>
            <label className="flex-1">
              <Button
                variant="outline"
                className="rounded-full w-full"
                asChild
              >
                <span>
                  <Upload size={14} className="mr-1" />
                  Import JSON
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                data-testid="import-file-input"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="rounded-2xl border-border/50" data-testid="about-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-muted-foreground" />
            <Label className="text-sm font-semibold">About Tabi</Label>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tabi (旅) is your personal Japan trip companion for the Feb 27 – Mar 13, 2026 journey
            across Osaka, Kyoto, and Tokyo. Built with care for an unforgettable adventure.
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">v1.0.0</p>
        </CardContent>
      </Card>
    </div>
  );
}
