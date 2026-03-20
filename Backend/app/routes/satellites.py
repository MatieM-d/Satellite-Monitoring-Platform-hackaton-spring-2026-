from fastapi import APIRouter, HTTPException, Query
from app.services.celestrak import fetch_tle_group, fetch_all_tle, TLE_URLS
from sgp4.api import Satrec, jday
from datetime import datetime, timezone
import math

router = APIRouter()


@router.get("/groups")
async def get_groups():
    """Список доступных групп спутников"""
    return {"groups": list(TLE_URLS.keys())}


@router.get("/")
async def get_satellites(
    group: str = Query(default="stations", description="Группа спутников"),
    orbit_type: str = Query(default=None, description="Тип орбиты: LEO, MEO, GEO")
):
    """Получить список спутников с TLE данными"""
    satellites = await fetch_tle_group(group)

    if orbit_type:
        satellites = [s for s in satellites if s["orbit_type"] == orbit_type.upper()]

    return {
        "group": group,
        "count": len(satellites),
        "satellites": satellites
    }


@router.get("/positions")
async def get_positions(
    group: str = Query(default="stations"),
    timestamp: float = Query(default=None, description="Unix timestamp (по умолч. — сейчас)")
):
    """Текущие координаты всех спутников группы"""
    satellites = await fetch_tle_group(group)
    if not satellites:
        raise HTTPException(status_code=404, detail="Группа не найдена или пустая")

    if timestamp:
        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    else:
        dt = datetime.now(timezone.utc)

    yr, mo, day = dt.year, dt.month, dt.day
    hr, mn, sc = dt.hour, dt.minute, dt.second + dt.microsecond / 1e6
    jd, fr = jday(yr, mo, day, hr, mn, sc)

    positions = []
    for sat in satellites:
        try:
            satrec = Satrec.twoline2rv(sat["line1"], sat["line2"])
            e, r, v = satrec.sgp4(jd, fr)
            if e == 0:  # нет ошибки
                # ECI → lat/lon/alt
                x, y, z = r  # км
                alt = math.sqrt(x**2 + y**2 + z**2) - 6371

                # Упрощённый перевод ECI в lat/lon
                lon = math.degrees(math.atan2(y, x))
                lat = math.degrees(math.asin(z / math.sqrt(x**2 + y**2 + z**2)))

                # Поправка на вращение Земли
                gst = _greenwich_sidereal_time(jd + fr)
                lon = (lon - math.degrees(gst)) % 360
                if lon > 180:
                    lon -= 360

                positions.append({
                    "norad_id": sat["norad_id"],
                    "name": sat["name"],
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                    "alt_km": round(alt, 1),
                    "orbit_type": sat["orbit_type"],
                })
        except Exception:
            continue

    return {
        "timestamp": dt.isoformat(),
        "count": len(positions),
        "positions": positions
    }


@router.get("/{norad_id}/orbit")
async def get_orbit_track(
    norad_id: int,
    group: str = Query(default="stations"),
    steps: int = Query(default=60, description="Количество точек трека"),
    minutes: int = Query(default=90, description="Минут вперёд")
):
    """Трек орбиты спутника (точки через равные промежутки времени)"""
    satellites = await fetch_tle_group(group)
    sat = next((s for s in satellites if s["norad_id"] == norad_id), None)
    if not sat:
        raise HTTPException(status_code=404, detail="Спутник не найден")

    satrec = Satrec.twoline2rv(sat["line1"], sat["line2"])
    now = datetime.now(timezone.utc)
    track = []

    for i in range(steps):
        dt = now.replace(second=0, microsecond=0)
        from datetime import timedelta
        dt = dt + timedelta(minutes=i * minutes / steps)

        jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
        e, r, v = satrec.sgp4(jd, fr)
        if e != 0:
            continue

        x, y, z = r
        lat = math.degrees(math.asin(z / math.sqrt(x**2 + y**2 + z**2)))
        lon = math.degrees(math.atan2(y, x))
        gst = _greenwich_sidereal_time(jd + fr)
        lon = (lon - math.degrees(gst)) % 360
        if lon > 180:
            lon -= 360

        track.append({"lat": round(lat, 4), "lon": round(lon, 4)})

    return {
        "norad_id": norad_id,
        "name": sat["name"],
        "track": track
    }


def _greenwich_sidereal_time(jd_full: float) -> float:
    """Вычисляет гринвичское звёздное время (радианы)"""
    T = (jd_full - 2451545.0) / 36525.0
    gst = 280.46061837 + 360.98564736629 * (jd_full - 2451545.0) + \
          0.000387933 * T**2 - T**3 / 38710000.0
    return math.radians(gst % 360)

@router.get("/groups")
async def get_groups():
    from app.services.celestrak import GROUP_META
    return {
        "groups": [
            {"value": k, **v}
            for k, v in GROUP_META.items()
        ]
    }