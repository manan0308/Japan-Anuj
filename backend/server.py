from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# --- Models ---
class ActivityCreate(BaseModel):
    date: str
    time: Optional[str] = None
    name: str
    location: Optional[str] = None
    city: str
    category: str
    status: str = "pending"
    booking_ref: Optional[str] = None
    notes: Optional[str] = None
    order: int = 0


class ActivityUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    name: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    booking_ref: Optional[str] = None
    notes: Optional[str] = None
    order: Optional[int] = None


class ExpenseCreate(BaseModel):
    amount_jpy: float
    category: str
    note: Optional[str] = None
    date: str


class PackingItemCreate(BaseModel):
    name: str
    checked: bool = False


class NoteCreate(BaseModel):
    title: str
    content: str = ""


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class SettingsUpdate(BaseModel):
    exchange_rate: float = 0.56
    theme: str = "dark"
    reminder_minutes: int = 30


class ConversionCreate(BaseModel):
    from_amount: float
    to_amount: float
    rate: float


# --- Activities ---
@api_router.post("/activities/reorder")
async def reorder_activities(updates: List[dict]):
    for item in updates:
        await db.activities.update_one(
            {"id": item["id"]},
            {"$set": {"order": item["order"]}}
        )
    return {"message": "Reordered"}


@api_router.get("/activities")
async def get_activities(date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    activities = await db.activities.find(query, {"_id": 0}).sort([("date", 1), ("order", 1)]).to_list(1000)
    return activities


@api_router.post("/activities")
async def create_activity(data: ActivityCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.activities.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, data: ActivityUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.activities.update_one({"id": activity_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    updated = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    return updated


@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str):
    result = await db.activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Deleted"}


# --- Expenses ---
@api_router.get("/expenses")
async def get_expenses():
    return await db.expenses.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.post("/expenses")
async def create_expense(data: ExpenseCreate):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.expenses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Deleted"}


# --- Packing Items ---
@api_router.get("/packing-items")
async def get_packing_items():
    return await db.packing_items.find({}, {"_id": 0}).to_list(1000)


@api_router.post("/packing-items")
async def create_packing_item(data: PackingItemCreate):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.packing_items.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/packing-items/{item_id}")
async def update_packing_item(item_id: str, data: dict):
    await db.packing_items.update_one({"id": item_id}, {"$set": data})
    updated = await db.packing_items.find_one({"id": item_id}, {"_id": 0})
    return updated


@api_router.delete("/packing-items/{item_id}")
async def delete_packing_item(item_id: str):
    result = await db.packing_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted"}


# --- Notes ---
@api_router.get("/notes")
async def get_notes():
    return await db.notes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.post("/notes")
async def create_note(data: NoteCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.notes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/notes/{note_id}")
async def update_note(note_id: str, data: NoteUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.notes.update_one({"id": note_id}, {"$set": update_data})
    updated = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return updated


@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    result = await db.notes.delete_one({"id": note_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Deleted"}


# --- Settings ---
@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        default = {"id": "default", "exchange_rate": 0.56, "theme": "dark", "reminder_minutes": 30}
        await db.settings.insert_one(default)
        default.pop("_id", None)
        return default
    return settings


@api_router.put("/settings")
async def update_settings(data: SettingsUpdate):
    update_data = data.model_dump()
    update_data["id"] = "default"
    await db.settings.update_one(
        {"id": "default"},
        {"$set": update_data},
        upsert=True
    )
    return update_data


# --- Conversions ---
@api_router.get("/conversions")
async def get_conversions():
    return await db.conversions.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)


@api_router.post("/conversions")
async def create_conversion(data: ConversionCreate):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.conversions.insert_one(doc)
    doc.pop("_id", None)
    return doc


# --- Weather ---
CITY_COORDS = {
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Osaka": {"lat": 34.6937, "lon": 135.5023},
    "Kyoto": {"lat": 35.0116, "lon": 135.7681},
    "Tokyo": {"lat": 35.6762, "lon": 139.6503},
}


@api_router.get("/weather/{city}")
async def get_weather(city: str):
    coords = CITY_COORDS.get(city)
    if not coords:
        raise HTTPException(status_code=404, detail="City not found")
    try:
        async with httpx.AsyncClient(timeout=10) as http_client:
            resp = await http_client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "current_weather": True,
                    "daily": "temperature_2m_max,temperature_2m_min,weathercode",
                    "timezone": "Asia/Tokyo",
                    "forecast_days": 3,
                },
            )
            return resp.json()
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return {"error": "Weather data unavailable"}


# --- Seed Data ---
def _seed_activities():
    """Return the complete 14-day itinerary as a list of activity dicts."""
    days = [
        ("2026-02-27", "Mumbai", [
            (None, "Flight to Tokyo (Narita)", "Mumbai Airport", "transport", "booked", None),
        ]),
        ("2026-02-28", "Osaka", [
            (None, "Flight to Osaka", "Kansai International Airport", "transport", "booked", None),
            (None, "Check in to Westin Osaka", "Westin Osaka", "accommodation", "booked", None),
            ("17:00", "Osaka Aquarium Kaiyukan", "Osaka Aquarium Kaiyukan", "sightseeing", "booked", None),
            (None, "Osaka Harbour walk", "Tempozan Harbour Village", "sightseeing", "pending", None),
            ("20:00", "Dinner at Pizza423 Umeda", "Pizza423 Umeda", "food", "booked", None),
        ]),
        ("2026-03-01", "Osaka", [
            (None, "Breakfast at hotel", "Westin Osaka", "food", "pending", None),
            (None, "Lunch at Mitsuka Bozu Hotarugaike", "Mitsuka Bozu Hotarugaike", "food", "pending", None),
            (None, "Cup Noodles Museum Ikeda", "Cup Noodles Museum Osaka Ikeda", "sightseeing", "pending", None),
            (None, "Dinner at Makabi/Pizza423 Umeda", "Pizza423 Umeda", "food", "pending", None),
        ]),
        ("2026-03-02", "Osaka", [
            (None, "Breakfast at hotel", "Westin Osaka", "food", "pending", None),
            (None, "Osaka Castle Park", "Osaka Castle Park", "sightseeing", "pending", None),
            (None, "Udon making workshop", "Osaka", "experience", "pending", "Pending booking"),
            (None, "Shopping at Shinsaibashi and Pokemon Center", "Shinsaibashi", "shopping", "pending", None),
            (None, "Roam around Dotonbori, eat okonomiyaki", "Dotonbori", "food", "pending", "Options - Oko, Shinise Okonomiyaki Osaka Botejyu Hon Ten"),
        ]),
        ("2026-03-03", "Osaka", [
            (None, "Breakfast at hotel", "Westin Osaka", "food", "pending", None),
            (None, "Visit Namba Yasaka Jinja", "Namba Yasaka Jinja", "sightseeing", "pending", None),
            (None, "Visit Kuromon Ichiba Market and Sennichimae Doguyasuji", "Kuromon Ichiba Market", "sightseeing", "pending", None),
            (None, "Lunch at Genji Soba Namba", "Genji Soba Namba", "food", "pending", None),
            (None, "Roam around Nakazakicho", "Nakazakicho", "sightseeing", "pending", None),
            (None, "Dinner TBD Umeda", "Umeda", "food", "pending", "Option - Gyozaclub Rocklee"),
        ]),
        ("2026-03-04", "Kyoto", [
            (None, "Breakfast at hotel and checkout", "Westin Osaka", "food", "pending", None),
            ("11:00", "Train to Kyoto", "Osaka Station", "transport", "booked", None),
            (None, "Check in to Hilton Garden Inn Kyoto", "Hilton Garden Inn Kyoto Shijo Karasuma", "accommodation", "booked", None),
            (None, "Visit Ginkaku-ji", "Ginkaku-ji", "sightseeing", "pending", None),
            (None, "Lunch TBD", "Kyoto", "food", "pending", "Nanoya"),
            (None, "Visit Kiyomizu-dera and Yasaka Shrine", "Kiyomizu-dera", "sightseeing", "pending", None),
            (None, "Roam around Gion street", "Gion", "sightseeing", "pending", None),
            (None, "Dinner at Chao Chao Gyoza Shijo Kawaramachi", "Chao Chao Gyoza Shijo Kawaramachi", "food", "pending", None),
        ]),
        ("2026-03-05", "Kyoto", [
            (None, "Hokuei day trip", "Hokuei", "sightseeing", "pending", "Pending booking"),
        ]),
        ("2026-03-06", "Kyoto", [
            (None, "Visit Fushimi Inari", "Fushimi Inari Taisha", "sightseeing", "pending", None),
            (None, "Lunch TBD", "Kyoto", "food", "pending", None),
            ("14:00", "Matcha brewing experience", "Kyoto", "experience", "booked", None),
            ("15:30", "TeamLab Borderless Kyoto", "teamLab Borderless Kyoto", "experience", "booked", None),
            (None, "Dinner TBD", "Kyoto", "food", "pending", "Option - Nanuki"),
        ]),
        ("2026-03-07", "Kyoto", [
            (None, "Visit Otagi Nenbutsu-ji and Adashino Nenbutsu-ji", "Otagi Nenbutsu-ji", "sightseeing", "pending", None),
            (None, "Lunch TBD", "Kyoto", "food", "pending", "Option - UZU Ramen"),
            (None, "Relax at speakeasy", "Kyoto", "experience", "pending", "Option - Bar Rocking Chair, no reservations"),
            (None, "Dinner at Trattoria Macedonia Yuki (tentative)", "Trattoria Macedonia Yuki", "food", "pending", "Pending booking"),
        ]),
        ("2026-03-08", "Tokyo", [
            ("11:00", "Train to Tokyo", "Kyoto Station", "transport", "booked", None),
            (None, "Check in to Grand Prince Hotel Takanawa", "Grand Prince Hotel Takanawa", "accommodation", "booked", None),
            (None, "Lunch at L'Antica Pizzeria da Michele", "L'Antica Pizzeria da Michele Tokyo", "food", "pending", None),
            (None, "Nakano Broadway for watches", "Nakano Broadway", "shopping", "pending", None),
            (None, "Metropolitan Govt Building for city view", "Tokyo Metropolitan Government Building", "sightseeing", "pending", None),
            (None, "Roam around Shinjuku", "Shinjuku", "sightseeing", "pending", None),
            (None, "Dinner at Masaka Izakaya", "Masaka Izakaya", "food", "pending", None),
        ]),
        ("2026-03-09", "Tokyo", [
            (None, "Visit Senso-ji temple and Asakusa street food", "Senso-ji", "sightseeing", "pending", None),
            (None, "Lunch at Sushi Uogashi Nihon-Ichi Atre Akihabara", "Sushi Uogashi Nihon-Ichi Akihabara", "food", "pending", None),
            (None, "Visit Akihabara for anime shops and electronics", "Akihabara", "shopping", "pending", None),
            (None, "Dinner at T's TanTan Tokyo Station", "T's TanTan Tokyo Station", "food", "pending", None),
        ]),
        ("2026-03-10", "Tokyo", [
            (None, "Day trip to Gotemba Premium Outlets with Fuji view", "Gotemba Premium Outlets", "shopping", "pending", None),
            (None, "Dinner TBD", "Tokyo", "food", "pending", None),
        ]),
        ("2026-03-11", "Tokyo", [
            (None, "Visit Ginza, start at Onitsuka Tiger store", "Ginza Onitsuka Tiger", "shopping", "pending", None),
            (None, "Lunch TBD", "Ginza", "food", "pending", None),
            (None, "Dinner TBD", "Tokyo", "food", "pending", None),
        ]),
        ("2026-03-12", "Tokyo", [
            (None, "Harajuku, Meiji Shrine and local shopping", "Meiji Shrine Harajuku", "sightseeing", "pending", None),
            ("12:00", "Lunch at L'Atelier de Joel Robuchon", "L'Atelier de Joel Robuchon Tokyo", "food", "booked", None),
            (None, "Buffer time, vibes and chill", "Tokyo", "experience", "pending", None),
            (None, "Dinner TBD", "Tokyo", "food", "pending", None),
        ]),
        ("2026-03-13", "Tokyo", [
            (None, "Depart for BOM", "Narita Airport", "transport", "booked", None),
        ]),
    ]

    activities = []
    for date, city, items in days:
        for order, (time, name, location, category, status, notes) in enumerate(items):
            activities.append({
                "id": str(uuid.uuid4()),
                "date": date,
                "time": time,
                "name": name,
                "location": location,
                "city": city,
                "category": category,
                "status": status,
                "booking_ref": None,
                "notes": notes,
                "order": order,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
    return activities


def _seed_packing():
    items = [
        "Passport", "JR Pass", "Power adaptor (Type A)", "Travel insurance docs",
        "Cash (JPY)", "Credit/debit cards", "Phone charger", "Portable battery pack",
        "Comfortable walking shoes", "Umbrella/rain jacket", "Toiletries", "Medications",
        "Sunglasses", "Camera", "Luggage lock", "IC Card (Suica/ICOCA)",
        "Pocket WiFi / eSIM", "Copy of hotel bookings", "Day pack/backpack",
        "Warm layers (Feb/Mar)", "Neck pillow", "Reusable water bottle",
    ]
    return [
        {"id": str(uuid.uuid4()), "name": name, "checked": False,
         "created_at": datetime.now(timezone.utc).isoformat()}
        for name in items
    ]


@api_router.post("/seed")
async def seed_data():
    count = await db.activities.count_documents({})
    if count > 0:
        return {"message": "Data already exists", "count": count}

    activities = _seed_activities()
    packing = _seed_packing()

    if activities:
        await db.activities.insert_many(activities)
    if packing:
        await db.packing_items.insert_many(packing)

    return {"message": f"Seeded {len(activities)} activities and {len(packing)} packing items"}


# --- Export / Import ---
@api_router.get("/export")
async def export_data():
    activities = await db.activities.find({}, {"_id": 0}).to_list(1000)
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    packing = await db.packing_items.find({}, {"_id": 0}).to_list(1000)
    notes = await db.notes.find({}, {"_id": 0}).to_list(1000)
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    conversions = await db.conversions.find({}, {"_id": 0}).to_list(1000)
    return {
        "activities": activities,
        "expenses": expenses,
        "packing_items": packing,
        "notes": notes,
        "settings": settings,
        "conversions": conversions,
    }


@api_router.post("/import")
async def import_data(data: dict):
    if "activities" in data:
        await db.activities.delete_many({})
        if data["activities"]:
            await db.activities.insert_many(data["activities"])
    if "expenses" in data:
        await db.expenses.delete_many({})
        if data["expenses"]:
            await db.expenses.insert_many(data["expenses"])
    if "packing_items" in data:
        await db.packing_items.delete_many({})
        if data["packing_items"]:
            await db.packing_items.insert_many(data["packing_items"])
    if "notes" in data:
        await db.notes.delete_many({})
        if data["notes"]:
            await db.notes.insert_many(data["notes"])
    if "settings" in data and data["settings"]:
        await db.settings.update_one(
            {"id": "default"}, {"$set": data["settings"]}, upsert=True
        )
    return {"message": "Imported successfully"}


# --- ICS Calendar ---
@api_router.get("/ics")
async def generate_ics(date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    activities = await db.activities.find(query, {"_id": 0}).sort([("date", 1), ("order", 1)]).to_list(1000)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Tabi//Trip//EN",
        "CALSCALE:GREGORIAN",
    ]

    for act in activities:
        date_str = act["date"].replace("-", "")
        time_val = act.get("time")
        if time_val:
            time_str = time_val.replace(":", "") + "00"
        else:
            time_str = "090000"

        maps_link = ""
        if act.get("location"):
            loc = act["location"].replace(" ", "+")
            maps_link = f"https://maps.google.com/?q={loc}"

        desc = (act.get("notes") or "") + ("\\n" + maps_link if maps_link else "")

        lines.extend([
            "BEGIN:VEVENT",
            f"DTSTART;TZID=Asia/Tokyo:{date_str}T{time_str}",
            f"DURATION:PT1H",
            f"SUMMARY:{act['name']}",
            f"LOCATION:{act.get('location', '')}",
            f"DESCRIPTION:{desc}",
            f"UID:{act['id']}@tabi",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")
    content = "\r\n".join(lines)

    return PlainTextResponse(
        content=content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=tabi-trip.ics"},
    )


# --- App Setup ---
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
