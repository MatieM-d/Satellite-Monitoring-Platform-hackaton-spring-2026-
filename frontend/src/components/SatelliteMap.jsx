import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSatellites } from '../hooks/useSatellites'
import { getOrbitColor, getOrbitTrack } from '../utils/tle'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createSatIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 10px; height: 10px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 6px ${color};
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

function splitTrackByAntimeridian(track) {
  const segments = []
  let current = [track[0]]

  for (let i = 1; i < track.length; i++) {
    const prev = track[i - 1]
    const curr = track[i]
    if (Math.abs(curr[1] - prev[1]) > 180) {
      segments.push(current)
      current = [curr]
    } else {
      current.push(curr)
    }
  }

  if (current.length > 0) segments.push(current)
  return segments
}

export default function SatelliteMap({ group, orbitFilter, onSelectSat }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const trackLayerRef = useRef(null)
  const coverageLayerRef = useRef(null)

  const { positions, loading, error } = useSatellites(group)
  const [selectedNorad, setSelectedNorad] = useState(null)

  // 1. handleSatClick объявлен через useCallback ДО useEffect который его использует
  const handleSatClick = useCallback((sat) => {
    const map = mapInstanceRef.current
    if (!map) return

    setSelectedNorad(sat.norad_id)
    onSelectSat(sat)

    trackLayerRef.current.clearLayers()
    coverageLayerRef.current.clearLayers()

    const track = getOrbitTrack(sat.line1, sat.line2, 120, sat.period_min || 90)
    if (track.length > 1) {
      const segments = splitTrackByAntimeridian(track)
      segments.forEach(seg => {
        L.polyline(seg, {
          color: getOrbitColor(sat.orbit_type),
          weight: 1.5,
          opacity: 0.7,
          dashArray: '4 4',
        }).addTo(trackLayerRef.current)
      })
    }

    const altKm = sat.alt || 400
    const coverageRadius = Math.sqrt(
      Math.pow(altKm + 6371, 2) - Math.pow(6371, 2)
    ) * 1000

    L.circle([sat.lat, sat.lon], {
      radius: coverageRadius,
      color: getOrbitColor(sat.orbit_type),
      fillColor: getOrbitColor(sat.orbit_type),
      fillOpacity: 0.08,
      weight: 1,
      dashArray: '6 3',
    }).addTo(coverageLayerRef.current)

    map.panTo([sat.lat, sat.lon])
  }, [onSelectSat])

  // 2. Инициализация карты
  useEffect(() => {
    if (mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    trackLayerRef.current = L.layerGroup().addTo(map)
    coverageLayerRef.current = L.layerGroup().addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 3. Обновление маркеров
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const filtered = orbitFilter
      ? positions.filter(p => p.orbit_type === orbitFilter)
      : positions

    const activeIds = new Set(filtered.map(p => p.norad_id))

    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(Number(id))) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    filtered.forEach(sat => {
      const isSelected = sat.norad_id === selectedNorad
      const color = isSelected ? '#ffffff' : getOrbitColor(sat.orbit_type)
      const icon = createSatIcon(color)

      if (markersRef.current[sat.norad_id]) {
        markersRef.current[sat.norad_id].setLatLng([sat.lat, sat.lon])
        markersRef.current[sat.norad_id].setIcon(icon)
      } else {
        const marker = L.marker([sat.lat, sat.lon], { icon })
          .addTo(map)
          .on('click', () => handleSatClick(sat))
        markersRef.current[sat.norad_id] = marker
      }
    })
  }, [positions, orbitFilter, selectedNorad, handleSatClick])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/70 z-[500]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-green-400 text-sm">Загрузка спутников...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-red-900/80 text-red-200 px-4 py-2 rounded-lg text-sm">
          ⚠️ {error} — убедитесь что бэкенд запущен на порту 8000
        </div>
      )}

      <div className="absolute bottom-16 right-4 z-[500] bg-gray-900/90 rounded-lg p-3 text-xs text-gray-300 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span>LEO (низкая)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span>MEO (средняя)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>GEO (геостац.)</span>
        </div>
      </div>
    </div>
  )
}