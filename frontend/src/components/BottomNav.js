import { Home, Map, Banknote, Backpack, Settings } from "lucide-react";

const tabs = [
  { id: "today", label: "Today", icon: Home },
  { id: "itinerary", label: "Itinerary", icon: Map },
  { id: "currency", label: "Currency", icon: Banknote },
  { id: "tools", label: "Tools", icon: Backpack },
  { id: "settings", label: "Settings", icon: Settings },
];

export const BottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-bottom"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`nav-${tab.id}-btn`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-colors duration-200 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
