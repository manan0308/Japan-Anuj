import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  Thermometer,
  ExternalLink,
  CheckCircle2,
  Timer,
  Bookmark,
} from "lucide-react";
import api from "@/lib/api";

const TRIP_START = new Date("2026-02-27");
const TRIP_END = new Date("2026-03-13");
const TRIP_DAYS = 15;

const DATE_CITY_MAP = {
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

function getTripDay(date) {
  const d = new Date(date);
  const diff = Math.floor((d - TRIP_START) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(diff, TRIP_DAYS));
}

function getToday() {
  const now = new Date();
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return jst.toISOString().split("T")[0];
}

function getTodayForTrip() {
  const today = getToday();
  if (today >= "2026-02-27" && today <= "2026-03-13") return today;
  return "2026-02-28"; // Default to first real day in Japan
}

function getWeatherIcon(code) {
  if (code === 0) return Sun;
  if (code <= 3) return Cloud;
  if (code <= 48) return Cloud;
  if (code <= 55) return CloudDrizzle;
  if (code <= 65) return CloudRain;
  if (code <= 75) return CloudSnow;
  if (code <= 82) return CloudRain;
  return Cloud;
}

function getWeatherLabel(code) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 75) return "Snow";
  if (code <= 82) return "Showers";
  return "Stormy";
}

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getGoogleMapsUrl(location, city) {
  if (!location) return null;
  const q = encodeURIComponent(`${location} ${city} Japan`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

const StatusIcon = ({ status }) => {
  if (status === "completed") return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "booked") return <Bookmark size={14} className="text-blue-400" />;
  return <Timer size={14} className="text-amber-400" />;
};

const CategoryPill = ({ category }) => {
  const colors = {
    food: "bg-orange-500/15 text-orange-400",
    sightseeing: "bg-blue-500/15 text-blue-400",
    transport: "bg-purple-500/15 text-purple-400",
    shopping: "bg-pink-500/15 text-pink-400",
    experience: "bg-amber-500/15 text-amber-400",
    accommodation: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors[category] || "bg-muted text-muted-foreground"}`}>
      {category}
    </span>
  );
};

export default function TodayTab({ settings }) {
  const [activities, setActivities] = useState([]);
  const [weather, setWeather] = useState(null);
  const [jstTime, setJstTime] = useState("");
  const [istTime, setIstTime] = useState("");
  const [jstDate, setJstDate] = useState("");

  const todayDate = getTodayForTrip();
  const dayNum = getTripDay(todayDate);
  const city = DATE_CITY_MAP[todayDate] || "Tokyo";

  const updateClocks = useCallback(() => {
    const now = new Date();
    const jst = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    const ist = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    const dateStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now);
    setJstTime(jst);
    setIstTime(ist);
    setJstDate(dateStr);
  }, []);

  useEffect(() => {
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, [updateClocks]);

  useEffect(() => {
    api.getActivities(todayDate).then(setActivities).catch(console.error);
    api.getWeather(city).then(setWeather).catch(console.error);
  }, [todayDate, city]);

  const now = new Date();
  const currentMinutes =
    parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(now)
        .replace(":", "")
    );

  const nextActivity = activities.find((a) => {
    if (!a.time || a.status === "completed") return false;
    const mins = parseInt(a.time.replace(":", ""));
    return mins > currentMinutes;
  });

  const getCountdown = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const nowJst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const target = new Date(nowJst);
    target.setHours(h, m, 0, 0);
    const diff = target - nowJst;
    if (diff <= 0) return "Now";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  };

  const WeatherIcon = weather?.current_weather
    ? getWeatherIcon(weather.current_weather.weathercode)
    : Sun;

  return (
    <div className="p-4 space-y-4 stagger-children" data-testid="today-tab">
      {/* Header */}
      <div className="animate-fade-in-up pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Day {dayNum} of {TRIP_DAYS}
        </p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">{city}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{jstDate}</p>
      </div>

      {/* Dual Clock */}
      <Card className="animate-fade-in-up rounded-2xl border-border/50 overflow-hidden" data-testid="dual-clock-widget">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 divide-x divide-border/50">
            <div className="p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                Japan (JST)
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight font-mono">{jstTime}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                India (IST)
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight font-mono">{istTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather + Next Up - Bento Grid */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
        {/* Weather */}
        <Card className="rounded-2xl border-border/50" data-testid="weather-widget">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Thermometer size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Weather
              </span>
            </div>
            {weather?.current_weather ? (
              <>
                <div className="flex items-center gap-2">
                  <WeatherIcon size={28} className="text-primary" />
                  <span className="text-2xl font-bold">
                    {Math.round(weather.current_weather.temperature)}°
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getWeatherLabel(weather.current_weather.weathercode)}
                </p>
                {weather.daily && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-border/50">
                    {weather.daily.time?.slice(1, 3).map((d, i) => (
                      <div key={d} className="text-center">
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(d).toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-xs font-semibold">
                          {Math.round(weather.daily.temperature_2m_max[i + 1])}°
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground animate-pulse-soft">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Next Up */}
        <Card
          className="rounded-2xl border-border/50 bg-primary/5"
          data-testid="next-up-widget"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} className="text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                Next Up
              </span>
            </div>
            {nextActivity ? (
              <>
                <p className="font-semibold text-sm leading-snug line-clamp-2">
                  {nextActivity.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime12(nextActivity.time)}
                </p>
                <p className="text-xs font-medium text-primary mt-2">
                  {getCountdown(nextActivity.time)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Timeline */}
      <div className="animate-fade-in-up" data-testid="today-timeline">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
          <Clock size={12} />
          Today's Schedule
        </h2>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No activities for today
            </p>
          ) : (
            activities.map((activity, i) => (
              <Card
                key={activity.id}
                data-testid={`timeline-activity-${i}`}
                className="rounded-xl border-border/40 transition-shadow duration-200 hover:shadow-md"
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <StatusIcon status={activity.status} />
                        <span
                          className={`text-sm font-medium leading-snug ${
                            activity.status === "completed"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {activity.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activity.time && (
                          <span className="text-[10px] font-bold font-mono bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                            {formatTime12(activity.time)}
                          </span>
                        )}
                        <CategoryPill category={activity.category} />
                      </div>
                      {activity.location && (
                        <a
                          href={getGoogleMapsUrl(activity.location, activity.city)}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`maps-link-${i}`}
                          className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5 hover:text-primary transition-colors active:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MapPin size={10} />
                          <span className="underline underline-offset-2">{activity.location}</span>
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                  {activity.notes && (
                    <p className="text-[10px] text-muted-foreground/80 mt-1.5 italic">
                      {activity.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
