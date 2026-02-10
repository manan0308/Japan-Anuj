import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PackageCheck,
  MessageCircle,
  AlertTriangle,
  Train,
  StickyNote,
  Plus,
  Trash2,
  ChevronDown,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const PHRASES = [
  { jp: "Konnichiwa", en: "Hello / Good afternoon", romaji: "kon-ni-chi-wa", context: "General greeting, used from late morning to evening" },
  { jp: "Arigatou gozaimasu", en: "Thank you very much", romaji: "a-ri-ga-to go-za-i-mas", context: "Polite form of thank you, use in shops and restaurants" },
  { jp: "Sumimasen", en: "Excuse me / Sorry", romaji: "su-mi-ma-sen", context: "Getting attention, apologizing, or thanking someone" },
  { jp: "Onegaishimasu", en: "Please", romaji: "o-ne-gai-shi-mas", context: "When requesting something politely" },
  { jp: "Kore o kudasai", en: "This one, please", romaji: "ko-re o ku-da-sai", context: "Point at item while saying this" },
  { jp: "Oishii desu", en: "It's delicious!", romaji: "oi-shii des", context: "Compliment the chef, always appreciated" },
  { jp: "Okaikei onegaishimasu", en: "Check please", romaji: "o-kai-kei o-ne-gai-shi-mas", context: "Ask for the bill at restaurants" },
  { jp: "Eki wa doko desu ka?", en: "Where is the station?", romaji: "e-ki wa do-ko des ka", context: "Asking for directions to train station" },
  { jp: "Ikura desu ka?", en: "How much is it?", romaji: "i-ku-ra des ka", context: "Asking price in shops" },
  { jp: "Eigo wa hanasemasu ka?", en: "Do you speak English?", romaji: "ei-go wa ha-na-se-mas ka", context: "Useful when you need help" },
  { jp: "Toire wa doko desu ka?", en: "Where is the toilet?", romaji: "toi-re wa do-ko des ka", context: "Finding restrooms" },
  { jp: "Tasukete!", en: "Help!", romaji: "ta-su-ke-te", context: "Emergency situations" },
  { jp: "Daijoubu desu", en: "I'm fine / It's okay", romaji: "dai-jo-bu des", context: "Reassuring someone or declining politely" },
  { jp: "Itadakimasu", en: "Thank you for the meal (before eating)", romaji: "i-ta-da-ki-mas", context: "Said before starting a meal" },
  { jp: "Gochisousama deshita", en: "Thank you for the meal (after eating)", romaji: "go-chi-so-sa-ma de-shi-ta", context: "Said when finishing a meal or leaving a restaurant" },
];

const EMERGENCY = {
  police: "110",
  ambulance: "119",
  embassy: "+81-3-2624-2964",
  hotels: [
    { name: "Westin Osaka", city: "Osaka", phone: "+81-6-6440-1111", address: "1-1-20 Oyodonaka, Kita-ku, Osaka" },
    { name: "Hilton Garden Inn Kyoto", city: "Kyoto", phone: "+81-75-352-6300", address: "Shijo Karasuma, Shimogyo-ku, Kyoto" },
    { name: "Grand Prince Hotel Takanawa", city: "Tokyo", phone: "+81-3-3447-1111", address: "3-13-1 Takanawa, Minato-ku, Tokyo" },
  ],
};

const TRANSIT_TIPS = [
  { title: "IC Card (Suica/ICOCA)", desc: "Rechargeable transit card. Tap in/out at gates. Also works at convenience stores and vending machines. Get at any station." },
  { title: "Train Etiquette", desc: "No phone calls. Keep volume low. Priority seats for elderly/pregnant. Stand on left side of escalators (Osaka: right side)." },
  { title: "Shinkansen Tips", desc: "Reserve seats in advance during peak times. Green cars are first class. Luggage goes above seats or behind last row." },
  { title: "Last Train", desc: "Most trains stop around midnight. Check last train times for your route. Taxis are expensive but available 24/7." },
  { title: "Google Maps Transit", desc: "Google Maps works excellently for Japan transit. Shows platform numbers and real-time delays." },
];

export default function ToolsTab() {
  const [packingItems, setPackingItems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [expandedPhrase, setExpandedPhrase] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [items, n] = await Promise.all([
        api.getPackingItems(),
        api.getNotes(),
      ]);
      setPackingItems(items);
      setNotes(n);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleItem = async (item) => {
    try {
      await api.updatePackingItem(item.id, { checked: !item.checked });
      setPackingItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
      );
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const addPackingItem = async () => {
    if (!newItemName.trim()) return;
    try {
      const item = await api.createPackingItem({ name: newItemName.trim() });
      setPackingItems((prev) => [...prev, item]);
      setNewItemName("");
      toast.success("Item added");
    } catch (e) {
      toast.error("Failed to add");
    }
  };

  const deletePackingItem = async (id) => {
    try {
      await api.deletePackingItem(id);
      setPackingItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const addNote = async () => {
    if (!newNote.title.trim()) return;
    try {
      const note = await api.createNote(newNote);
      setNotes((prev) => [note, ...prev]);
      setNewNote({ title: "", content: "" });
      toast.success("Note saved");
    } catch (e) {
      toast.error("Failed to save note");
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const checkedCount = packingItems.filter((i) => i.checked).length;

  return (
    <div className="p-4" data-testid="tools-tab">
      <div className="pt-2 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Travel utilities & reference</p>
      </div>

      <Accordion type="multiple" defaultValue={["packing"]} className="space-y-2">
        {/* Packing Checklist */}
        <AccordionItem value="packing" className="border-none">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="packing-accordion">
              <div className="flex items-center gap-2">
                <PackageCheck size={16} className="text-primary" />
                <span className="font-semibold text-sm">Packing Checklist</span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  {checkedCount}/{packingItems.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {/* Progress */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${packingItems.length ? (checkedCount / packingItems.length) * 100 : 0}%` }}
                  />
                </div>

                {/* Add item */}
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add item..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPackingItem()}
                    className="rounded-xl text-sm h-9"
                    data-testid="add-packing-input"
                  />
                  <Button
                    size="icon"
                    className="rounded-full h-9 w-9 shrink-0"
                    onClick={addPackingItem}
                    data-testid="add-packing-btn"
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Items */}
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {packingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-accent/50 group transition-colors"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item)}
                        data-testid={`packing-check-${item.id}`}
                      />
                      <span
                        className={`text-sm flex-1 ${
                          item.checked ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.name}
                      </span>
                      <button
                        onClick={() => deletePackingItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 transition-opacity"
                        data-testid={`delete-packing-${item.id}`}
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Japanese Phrases */}
        <AccordionItem value="phrases" className="border-none">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="phrases-accordion">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-primary" />
                <span className="font-semibold text-sm">Japanese Phrases</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="px-4 pb-4 pt-0 space-y-1">
                {PHRASES.map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => setExpandedPhrase(expandedPhrase === i ? null : i)}
                    className="w-full text-left p-2 rounded-xl hover:bg-accent/50 transition-colors"
                    data-testid={`phrase-${i}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{phrase.jp}</p>
                        <p className="text-xs text-muted-foreground">{phrase.en}</p>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-muted-foreground transition-transform duration-200 ${
                          expandedPhrase === i ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {expandedPhrase === i && (
                      <div className="mt-2 pt-2 border-t border-border/30 animate-fade-in">
                        <p className="text-xs font-mono text-primary">{phrase.romaji}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{phrase.context}</p>
                      </div>
                    )}
                  </button>
                ))}
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Emergency Info */}
        <AccordionItem value="emergency" className="border-none">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="emergency-accordion">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-vermilion" />
                <span className="font-semibold text-sm">Emergency Info</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <a href="tel:110" className="block" data-testid="call-police-btn">
                    <Card className="rounded-xl border-border/40 hover:border-primary/30 transition-colors">
                      <CardContent className="p-3 text-center">
                        <Phone size={16} className="mx-auto mb-1 text-red-400" />
                        <p className="text-lg font-bold">110</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Police</p>
                      </CardContent>
                    </Card>
                  </a>
                  <a href="tel:119" className="block" data-testid="call-ambulance-btn">
                    <Card className="rounded-xl border-border/40 hover:border-primary/30 transition-colors">
                      <CardContent className="p-3 text-center">
                        <Phone size={16} className="mx-auto mb-1 text-red-400" />
                        <p className="text-lg font-bold">119</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Ambulance</p>
                      </CardContent>
                    </Card>
                  </a>
                  <a href={`tel:${EMERGENCY.embassy}`} className="block" data-testid="call-embassy-btn">
                    <Card className="rounded-xl border-border/40 hover:border-primary/30 transition-colors">
                      <CardContent className="p-3 text-center">
                        <Phone size={16} className="mx-auto mb-1 text-blue-400" />
                        <p className="text-[10px] font-bold leading-tight">Embassy</p>
                        <p className="text-[9px] text-muted-foreground">India</p>
                      </CardContent>
                    </Card>
                  </a>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hotel Contacts</p>
                  {EMERGENCY.hotels.map((hotel) => (
                    <div key={hotel.name} className="p-2 rounded-xl bg-accent/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{hotel.name}</p>
                          <p className="text-[10px] text-muted-foreground">{hotel.city}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                            <MapPin size={8} />
                            {hotel.address}
                          </p>
                        </div>
                        <a
                          href={`tel:${hotel.phone}`}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0"
                          data-testid={`call-hotel-${hotel.city.toLowerCase()}`}
                        >
                          <Phone size={14} className="text-primary" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Transit Guide */}
        <AccordionItem value="transit" className="border-none">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="transit-accordion">
              <div className="flex items-center gap-2">
                <Train size={16} className="text-primary" />
                <span className="font-semibold text-sm">Transit Guide</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {TRANSIT_TIPS.map((tip, i) => (
                  <div key={i} className="p-2 rounded-xl bg-accent/30">
                    <p className="text-sm font-semibold">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <a
                    href="https://www.google.com/maps/@35.6762,139.6503,12z"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="google-maps-link"
                  >
                    <Button variant="outline" size="sm" className="rounded-full text-xs">
                      <ExternalLink size={12} className="mr-1" />
                      Google Maps
                    </Button>
                  </a>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Trip Notes */}
        <AccordionItem value="notes" className="border-none">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="notes-accordion">
              <div className="flex items-center gap-2">
                <StickyNote size={16} className="text-primary" />
                <span className="font-semibold text-sm">Trip Notes</span>
                <span className="text-[10px] text-muted-foreground ml-1">{notes.length}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {/* Add note */}
                <div className="space-y-2">
                  <Input
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className="rounded-xl text-sm h-9"
                    data-testid="note-title-input"
                  />
                  <Textarea
                    placeholder="Write your note..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="rounded-xl text-sm min-h-[80px]"
                    data-testid="note-content-input"
                  />
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={addNote}
                    data-testid="save-note-btn"
                  >
                    <Plus size={14} className="mr-1" />
                    Save Note
                  </Button>
                </div>

                {/* Notes list */}
                {notes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    {notes.map((note) => (
                      <div key={note.id} className="p-2 rounded-xl bg-accent/30 group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{note.title}</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-0.5">
                              {note.content}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            data-testid={`delete-note-${note.id}`}
                          >
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
