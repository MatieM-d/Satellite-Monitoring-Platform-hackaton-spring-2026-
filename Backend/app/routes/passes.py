from fastapi import APIRouter, Query
from app.services.celestrak import fetch_tle_group
from sgp4.api import Satrec, jday
from datetime import datetime, timezone, timedelta
import math

router = APIRouter()


@router.get("/")
async def get_passes(
    lat: float = Query(..., description="Широта точки наблюдения"),
    lon: float = Query(..., description="Долгота точки наблюдения"),
    group: str = Query(default="stations"),
    hours: int = Query(default=24, description="На сколько часов вперёд"),
    min_elevation: float = Query(default=10.0, description="Минимальный угол возвышения (°)")
):
    """Пролёты спутников над заданной точкой"""
    satellites = await fetch_tle_group(group)
    now = datetime.now(timezone.utc)
    passes = []

    for sat in satellites:
        try:
            satrec = Satrec.twoline2rv(sat["line1"], sat["line2"])
            next_pass = _find_next_pass(satrec, lat, lon, now, hours, min_elevation)
            if next_pass:
                passes.append({
                    "norad_id": sat["norad_id"],
                    "name": sat["name"],
                    "orbit_type": sat["orbit_type"],
                    **next_pass
                })
        except Exception:
            continue

    passes.sort(key=lambda x: x["aos"])
    return {
        "location": {"lat": lat, "lon": lon},
        "hours_ahead": hours,
        "count": len(passes),
        "passes": passes[:50]  # топ 50
    }


def _find_next_pass(satrec, lat, lon, start_dt, hours, min_el):
    """Ищет следующий пролёт над точкой"""
    lat_r = math.radians(lat)
    lon_r = math.radians(lon)
    Re = 6371.0

    step = timedelta(seconds=30)
    dt = start_dt
    end = start_dt + timedelta(hours=hours)

    in_pass = False
    aos_dt = None
    max_el = 0

    while dt < end:
        jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
        e, r, _ = satrec.sgp4(jd, fr)
        if e != 0:
            dt += step
            continue

        el = _elevation(r, lat_r, lon_r, jd + fr, Re)

        if el >= min_el and not in_pass:
            in_pass = True
            aos_dt = dt
            max_el = el
        elif el >= min_el and in_pass:
            max_el = max(max_el, el)
        elif el < min_el and in_pass:
            return {
                "aos": aos_dt.isoformat(),
                "los": dt.isoformat(),
                "max_elevation": round(max_el, 1),
                "duration_sec": int((dt - aos_dt).total_seconds())
            }

        dt += step

    return None


def _elevation(r, lat_r, lon_r, jd_full, Re):
    """Угол возвышения спутника над горизонтом"""
    gst = math.radians(
        (280.46061837 + 360.98564736629 * (jd_full - 2451545.0)) % 360
    )
    local_st = gst + lon_r

    obs_x = Re * math.cos(lat_r) * math.cos(local_st)
    obs_y = Re * math.cos(lat_r) * math.sin(local_st)
    obs_z = Re * math.sin(lat_r)

    dx = r[0] - obs_x
    dy = r[1] - obs_y
    dz = r[2] - obs_z

    norm = math.sqrt(dx**2 + dy**2 + dz**2)
    up_x = math.cos(lat_r) * math.cos(local_st)
    up_y = math.cos(lat_r) * math.sin(local_st)
    up_z = math.sin(lat_r)

    dot = dx * up_x + dy * up_y + dz * up_z
    return math.degrees(math.asin(dot / norm))