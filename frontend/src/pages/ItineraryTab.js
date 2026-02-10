import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MapPin,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  Timer,
  Bookmark,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const TRIP_DATES = [];
for (let d = new Date("2026-02-27"); d <= new Date("2026-03-13"); d.setDate(d.getDate() + 1)) {
  TRIP_DATES.push(new Date(d).toISOString().split("T")[0]);
}

const DATE_CITY = {
  "2026-02-27": "Mumbai",
  "2026-02-28": "Osaka",
  "2026-03-01": "Osaka",
  "2026-03-02": "Osaka",
  "2026-03-03": "Osaka",
  "2026-03-04": "Kyoto",
  "2026-03-05": "Kyoto",
  "2026-03-06": "Kyoto",
  "2026-03-07": "Kyoto",
  "2026-03-08": "Tokyo",
  "2026-03-09": "Tokyo",
  "2026-03-10": "Tokyo",
  "2026-03-11": "Tokyo",
  "2026-03-12": "Tokyo",
  "2026-03-13": "Tokyo",
};

const CATEGORIES = ["food", "sightseeing", "transport", "shopping", "experience", "accommodation"];
const STATUSES = ["pending", "completed", "booked"];

const catColors = {
  food: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  sightseeing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  transport: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  shopping: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  experience: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  accommodation: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const StatusIcon = ({ status }) => {
  if (status === "completed") return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "booked") return <Bookmark size={14} className="text-blue-400" />;
  return <Timer size={14} className="text-amber-400" />;
};

const emptyForm = {
  name: "",
  date: "",
  time: "",
  location: "",
  city: "",
  category: "sightseeing",
  status: "pending",
  notes: "",
  booking_ref: "",
};

export default function ItineraryTab() {
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2026-02-28");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await api.getActivities();
      setActivities(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const dayActivities = activities
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.order - b.order);

  const searchResults = searchQuery.trim()
    ? activities.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: selectedDate, city: DATE_CITY[selectedDate] || "" });
    setDialogOpen(true);
  };

  const openEdit = (activity) => {
    setEditingId(activity.id);
    setForm({
      name: activity.name,
      date: activity.date,
      time: activity.time || "",
      location: activity.location || "",
      city: activity.city,
      category: activity.category,
      status: activity.status,
      notes: activity.notes || "",
      booking_ref: activity.booking_ref || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Activity name is required");
      return;
    }
    try {
      if (editingId) {
        await api.updateActivity(editingId, {
          ...form,
          time: form.time || null,
          location: form.location || null,
          notes: form.notes || null,
          booking_ref: form.booking_ref || null,
        });
        toast.success("Activity updated");
      } else {
        await api.createActivity({
          ...form,
          time: form.time || null,
          location: form.location || null,
          notes: form.notes || null,
          booking_ref: form.booking_ref || null,
          order: dayActivities.length,
        });
        toast.success("Activity added");
      }
      setDialogOpen(false);
      fetchActivities();
    } catch (e) {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteActivity(id);
      toast.success("Activity deleted");
      setDeleteConfirm(null);
      fetchActivities();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const toggleStatus = async (activity) => {
    const next = activity.status === "completed" ? "pending" : "completed";
    try {
      await api.updateActivity(activity.id, { status: next });
      fetchActivities();
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const getMapsUrl = (location) => {
    if (!location) return null;
    const q = location.replace(/\s+/g, "+");
    return `https://www.google.com/maps/place/${q}`;
  };

  return (
    <div className="p-4" data-testid="itinerary-tab">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Itinerary</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowSearch(!showSearch)}
            data-testid="search-toggle-btn"
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-primary text-primary-foreground"
            onClick={openAdd}
            data-testid="add-activity-btn"
          >
            <Plus size={18} />
          </Button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="mb-4 animate-fade-in">
          <Input
            placeholder="Search activities, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl"
            data-testid="search-input"
          />
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((a) => (
                <Card
                  key={a.id}
                  className="rounded-xl border-border/40 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setSelectedDate(a.date);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                >
                  <CardContent className="p-2.5 flex items-center gap-2">
                    <StatusIcon status={a.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.date} - {a.city}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Scroller */}
      <div className="mb-4 -mx-4 px-4 overflow-x-auto hide-scrollbar" data-testid="date-scroller">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {TRIP_DATES.map((date) => {
            const d = new Date(date + "T00:00:00");
            const isSelected = date === selectedDate;
            const dayNum = Math.floor((d - new Date("2026-02-27")) / 86400000) + 1;
            const city = DATE_CITY[date];
            const count = activities.filter((a) => a.date === date).length;
            return (
              <button
                key={date}
                data-testid={`date-btn-${date}`}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[64px] transition-colors duration-200 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent border border-border/40"
                }`}
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold">{d.getDate()}</span>
                <span className="text-[9px] font-medium opacity-80">
                  {city}
                </span>
                {count > 0 && (
                  <span className={`text-[8px] mt-0.5 ${isSelected ? "opacity-80" : "text-muted-foreground"}`}>
                    {count} items
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="text-xs text-muted-foreground">
            {DATE_CITY[selectedDate]} &middot; {dayActivities.length} activities
          </p>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-2 stagger-children" data-testid="activities-list">
        {dayActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-3">No activities planned</p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={openAdd}
              data-testid="add-first-activity-btn"
            >
              <Plus size={16} className="mr-1" />
              Add Activity
            </Button>
          </div>
        ) : (
          dayActivities.map((activity, i) => (
            <Card
              key={activity.id}
              data-testid={`activity-card-${i}`}
              className="rounded-xl border-border/40 animate-fade-in-up transition-shadow hover:shadow-md"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleStatus(activity)}
                    className="mt-0.5 shrink-0"
                    data-testid={`toggle-status-${i}`}
                  >
                    <StatusIcon status={activity.status} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        activity.status === "completed" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {activity.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {activity.time && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {activity.time}
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-[9px] px-1.5 py-0 h-4 font-semibold uppercase tracking-wider rounded-full border ${
                          catColors[activity.category] || ""
                        }`}
                      >
                        {activity.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 rounded-full capitalize"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    {activity.location && (
                      <a
                        href={getMapsUrl(activity.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5 hover:text-primary transition-colors active:text-primary"
                        data-testid={`maps-btn-${i}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin size={10} />
                        <span className="underline underline-offset-2">{activity.location}</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                    {activity.notes && (
                      <p className="text-[10px] text-muted-foreground/80 mt-1 italic">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(activity)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      data-testid={`edit-btn-${i}`}
                    >
                      <Pencil size={13} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(activity.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      data-testid={`delete-btn-${i}`}
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl max-h-[85vh] overflow-y-auto" data-testid="activity-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Activity" : "Add Activity"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Activity name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl"
              data-testid="form-name-input"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                    city: DATE_CITY[e.target.value] || form.city,
                  })
                }
                className="rounded-xl"
                data-testid="form-date-input"
              />
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="rounded-xl"
                placeholder="Time (optional)"
                data-testid="form-time-input"
              />
            </div>
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded-xl"
              data-testid="form-location-input"
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-xl"
              data-testid="form-city-input"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="rounded-xl" data-testid="form-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger className="rounded-xl" data-testid="form-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-xl min-h-[60px]"
              data-testid="form-notes-input"
            />
            <Input
              placeholder="Booking reference / link"
              value={form.booking_ref}
              onChange={(e) => setForm({ ...form, booking_ref: e.target.value })}
              className="rounded-xl"
              data-testid="form-booking-input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-full"
              data-testid="form-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-full"
              data-testid="form-save-btn"
            >
              {editingId ? "Save Changes" : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs rounded-2xl" data-testid="delete-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Delete Activity?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="rounded-full"
              data-testid="delete-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteConfirm)}
              className="rounded-full"
              data-testid="delete-confirm-btn"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
