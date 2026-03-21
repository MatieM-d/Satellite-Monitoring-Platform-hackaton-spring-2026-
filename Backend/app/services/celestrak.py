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
    # Назначение
    "stations":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=TLE",
    "weather":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=WEATHER&FORMAT=TLE",
    "noaa":       "https://celestrak.org/NORAD/elements/gp.php?GROUP=NOAA&FORMAT=TLE",
    "goes":       "https://celestrak.org/NORAD/elements/gp.php?GROUP=GOES&FORMAT=TLE",
    "resource":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=RESOURCE&FORMAT=TLE",
    "military":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=MILITARY&FORMAT=TLE",
    "amateur":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=AMATEUR&FORMAT=TLE",
    "cubesat":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=CUBESAT&FORMAT=TLE",
    "debris":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=COSMOS-DEB&FORMAT=TLE",
    "education":  "https://celestrak.org/NORAD/elements/gp.php?GROUP=EDUCATION&FORMAT=TLE",
    # Навигация (MEO)
    "gps":        "https://celestrak.org/NORAD/elements/gp.php?GROUP=GPS-OPS&FORMAT=TLE",
    "glonass":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=GLO-OPS&FORMAT=TLE",
    "galileo":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=GALILEO&FORMAT=TLE",
    "beidou":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=BEIDOU&FORMAT=TLE",
    # GEO
    "geo":        "https://celestrak.org/NORAD/elements/gp.php?GROUP=GEO&FORMAT=TLE",
    "gorizont":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=GORIZONT&FORMAT=TLE",
    "raduga":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=RADUGA&FORMAT=TLE",
    "molniya":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=MOLNIYA&FORMAT=TLE",
    # Операторы
    "starlink":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=STARLINK&FORMAT=TLE",
    "oneweb":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=ONEWEB&FORMAT=TLE",
    "planet":     "https://celestrak.org/NORAD/elements/gp.php?GROUP=PLANET&FORMAT=TLE",
    "spire":      "https://celestrak.org/NORAD/elements/gp.php?GROUP=SPIRE&FORMAT=TLE",
    "iridium":    "https://celestrak.org/NORAD/elements/gp.php?GROUP=IRIDIUM-NEXT&FORMAT=TLE",
    "globalstar": "https://celestrak.org/NORAD/elements/gp.php?GROUP=GLOBALSTAR&FORMAT=TLE",
}

GROUP_META = {
    "stations":   {"label": "🛸 Орбитальные станции", "category": "purpose"},
    "weather":    {"label": "🌤 Метеорология",         "category": "purpose"},
    "noaa":       {"label": "🌤 NOAA",                 "category": "purpose"},
    "goes":       {"label": "🌤 GOES",                 "category": "purpose"},
    "resource":   {"label": "🌍 ДЗЗ",                 "category": "purpose"},
    "military":   {"label": "🎖 Военные",              "category": "purpose"},
    "amateur":    {"label": "📻 Любительские",         "category": "purpose"},
    "cubesat":    {"label": "🔬 CubeSat",              "category": "purpose"},
    "debris":     {"label": "☄️ Мусор (Космос)",       "category": "purpose"},
    "education":  {"label": "🎓 Образовательные",      "category": "purpose"},
    "gps":        {"label": "🧭 GPS (США)",            "category": "navigation"},
    "glonass":    {"label": "🧭 ГЛОНАСС (Россия)",     "category": "navigation"},
    "galileo":    {"label": "🧭 Galileo (ЕС)",         "category": "navigation"},
    "beidou":     {"label": "🧭 BeiDou (Китай)",       "category": "navigation"},
    "geo":        {"label": "🌐 GEO спутники",         "category": "navigation"},
    "gorizont":   {"label": "📡 Горизонт (Россия)",    "category": "navigation"},
    "raduga":     {"label": "📡 Радуга (Россия)",      "category": "navigation"},
    "molniya":    {"label": "📡 Молния (Россия)",      "category": "navigation"},
    "starlink":   {"label": "🌐 Starlink (SpaceX)",    "category": "operator"},
    "oneweb":     {"label": "🌐 OneWeb",               "category": "operator"},
    "planet":     {"label": "🌍 Planet Labs",          "category": "operator"},
    "spire":      {"label": "📡 Spire Global",         "category": "operator"},
    "iridium":    {"label": "📱 Iridium NEXT",         "category": "operator"},
    "globalstar": {"label": "📱 Globalstar",           "category": "operator"},
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