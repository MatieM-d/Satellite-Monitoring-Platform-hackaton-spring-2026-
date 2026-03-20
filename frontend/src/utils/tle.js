import * as satellite from 'satellite.js'

/**
 * Получить текущие координаты спутника из TLE
 */
export function getSatellitePosition(tle1, tle2, date = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2)
    const positionAndVelocity = satellite.propagate(satrec, date)
    const positionEci = positionAndVelocity.position

    if (!positionEci) return null

    const gmst = satellite.gstime(date)
    const positionGd = satellite.eciToGeodetic(positionEci, gmst)

    return {
      lat: satellite.degreesLat(positionGd.latitude),
      lon: satellite.degreesLong(positionGd.longitude),
      alt: positionGd.height, // км
    }
  } catch {
    return null
  }
}

/**
 * Получить трек орбиты — массив точек
 */
export function getOrbitTrack(tle1, tle2, steps = 100, periodMin = 90) {
  const track = []
  const now = Date.now()
  const stepMs = (periodMin * 60 * 1000) / steps

  for (let i = 0; i < steps; i++) {
    const date = new Date(now + i * stepMs)
    const pos = getSatellitePosition(tle1, tle2, date)
    if (pos) track.push([pos.lat, pos.lon])
  }

  return track
}

/**
 * Определить тип орбиты по высоте
 */
export function getOrbitType(altKm) {
  if (altKm > 35000) return 'GEO'
  if (altKm > 8000) return 'MEO'
  return 'LEO'
}

/**
 * Цвет маркера по типу орбиты
 */
export function getOrbitColor(orbitType) {
  switch (orbitType) {
    case 'GEO': return '#f59e0b'  // жёлтый
    case 'MEO': return '#3b82f6'  // синий
    case 'LEO': return '#10b981'  // зелёный
    default:    return '#6b7280'  // серый
  }
}