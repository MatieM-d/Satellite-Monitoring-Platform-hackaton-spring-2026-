import httpx
from datetime import datetime, timezone

# Категории спутников с CelesTrak
SATELLITE_GROUPS = {
    "stations":    "https://celestrak.org/SOCRATES/query.php",
    "iss":         "https://celestrak.org/satcat/tle.php?CATNR=25544",
    "starlink":    "https://celestrak.org/SOCRATES/query.php",
    "gps":         "https://celestrak.org/gnss/gps/gps-ops.txt",
    "weather":     "https://celestrak.org/weather/weather.txt",
    "noaa":        "https://celestrak.org/weather/noaa.txt",
    "resource":    "https://celestrak.org/resource/resource.txt",
    "stations":    "https://celestrak.org/stations/stations.txt",
}

TLE_URLS = {
    "stations":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=TLE",
    "starlink":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=STARLINK&FORMAT=TLE",
    "gps":        "https://celestrak.org/NORAD/elements/gp.php?GROUP=GPS-OPS&FORMAT=TLE",
    "navigation": "https://celestrak.org/NORAD/elements/gp.php?GROUP=GLONASS&FORMAT=TLE",
    "weather":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=WEATHER&FORMAT=TLE",
    "resource":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=RESOURCE&FORMAT=TLE",
    "military":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=MILITARY&FORMAT=TLE",
    "amateur":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=AMATEUR&FORMAT=TLE",
    "debris":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=COSMOS-DEB&FORMAT=TLE",
    "oneweb":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=ONEWEB&FORMAT=TLE",
    "planet":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=PLANET&FORMAT=TLE",
    "spire":      "https://celestrak.org/NORAD/elements/gp.php?GROUP=SPIRE&FORMAT=TLE",
}

# Метаданные групп для фронтенда
GROUP_META = {
    # Назначение
    "stations":   {"label": "🛸 Орбитальные станции", "category": "purpose"},
    "starlink":   {"label": "🌐 Starlink",             "category": "operator"},
    "oneweb":     {"label": "🌐 OneWeb",               "category": "operator"},
    "planet":     {"label": "🌍 Planet Labs",          "category": "operator"},
    "spire":      {"label": "📡 Spire",                "category": "operator"},
    "gps":        {"label": "🧭 GPS",                  "category": "purpose"},
    "navigation": {"label": "🧭 Навигация",            "category": "purpose"},
    "weather":    {"label": "🌤 Метео",                "category": "purpose"},
    "resource":   {"label": "🌍 ДЗЗ",                 "category": "purpose"},
    "military":   {"label": "🎖 Военные",              "category": "purpose"},
    "amateur":    {"label": "📻 Любительские",         "category": "purpose"},
    "debris":     {"label": "☄️ Космический мусор",    "category": "purpose"},
}

# Простой in-memory кэш
_cache: dict = {}

def _parse_tle(raw: str) -> list[dict]:
    """Парсит сырой TLE текст в список спутников"""
    lines = [l.strip() for l in raw.strip().splitlines() if l.strip()]
    satellites = []

    i = 0
    while i < len(lines):
        # Формат: NAME / LINE1 / LINE2
        if i + 2 < len(lines) and lines[i+1].startswith("1 ") and lines[i+2].startswith("2 "):
            name = lines[i]
            line1 = lines[i+1]
            line2 = lines[i+2]

            # Базовые параметры из TLE
            try:
                inclination = float(line2[8:16])
                mean_motion = float(line2[52:63])  # об/день
                period_min = 1440 / mean_motion    # минут
                # Приблизительная высота орбиты (км)
                mu = 398600.4418
                import math
                a = (mu / (mean_motion * 2 * math.pi / 86400) ** 2) ** (1/3)
                altitude = round(a - 6371, 1)

                orbit_type = "LEO"
                if altitude > 35000:
                    orbit_type = "GEO"
                elif altitude > 8000:
                    orbit_type = "MEO"

                satellites.append({
                    "name": name,
                    "line1": line1,
                    "line2": line2,
                    "norad_id": int(line1[2:7]),
                    "inclination": round(inclination, 2),
                    "period_min": round(period_min, 2),
                    "altitude_km": altitude,
                    "orbit_type": orbit_type,
                })
            except Exception:
                pass  # пропускаем битые TLE

            i += 3
        else:
            i += 1

    return satellites


async def fetch_tle_group(group: str) -> list[dict]:
    """Получает TLE данные для группы спутников"""
    if group not in TLE_URLS:
        return []

    # Проверяем кэш
    cache_key = f"tle_{group}"
    if cache_key in _cache:
        cached_at, data = _cache[cache_key]
        age = (datetime.now(timezone.utc) - cached_at).seconds
        if age < 3600:  # кэш на час
            return data

    url = TLE_URLS[group]
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            satellites = _parse_tle(resp.text)
            _cache[cache_key] = (datetime.now(timezone.utc), satellites)
            return satellites
        except Exception as e:
            print(f"[CelesTrak] Ошибка получения {group}: {e}")
            return []


async def fetch_all_tle() -> list[dict]:
    """Получает все группы спутников"""
    import asyncio
    groups = list(TLE_URLS.keys())
    results = await asyncio.gather(*[fetch_tle_group(g) for g in groups])
    
    seen = set()
    all_sats = []
    for group_sats in results:
        for sat in group_sats:
            if sat["norad_id"] not in seen:
                seen.add(sat["norad_id"])
                all_sats.append(sat)
    return all_sats