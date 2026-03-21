import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function SatelliteCard({ satellite, onClose }) {
  const [nextPass, setNextPass] = useState(null)
  const [loadingPass, setLoadingPass] = useState(false)

  useEffect(() => {
    if (!satellite) return

    let cancelled = false

    const timer = setTimeout(() => {
      if (!cancelled) setLoadingPass(true)
      if (!cancelled) setNextPass(null)

      axios.get(`${API_BASE}/passes/`, {
        params: {
          lat: 55.75,
          lon: 37.61,
          group: 'stations',
          hours: 24,
        }
      })
        .then(res => {
          if (!cancelled) {
            const pass = res.data.passes.find(
              p => p.norad_id === satellite.norad_id
            )
            setNextPass(pass || null)
          }
        })
        .catch(() => {
          if (!cancelled) setNextPass(null)
        })
        .finally(() => {
          if (!cancelled) setLoadingPass(false)
        })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [satellite])

  if (!satellite) return null

  const orbitColors = {
    LEO: 'text-green-400',
    MEO: 'text-blue-400',
    GEO: 'text-yellow-400',
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 w-72 text-white shadow-xl border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-base leading-tight">{satellite.name}</h3>
          <p className="text-xs text-gray-400">NORAD #{satellite.norad_id}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none ml-2"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Тип орбиты">
          <span className={`font-semibold ${orbitColors[satellite.orbit_type] || 'text-gray-300'}`}>
            {satellite.orbit_type}
          </span>
        </Row>

        <Row label="Высота">
          {satellite.altitude_km
            ? `${satellite.altitude_km.toLocaleString()} км`
            : `${Math.round(satellite.alt || 0).toLocaleString()} км`
          }
        </Row>

        <Row label="Период">
          {satellite.period_min ? `${satellite.period_min} мин` : '—'}
        </Row>

        <Row label="Наклонение">
          {satellite.inclination ? `${satellite.inclination}°` : '—'}
        </Row>

        <div className="border-t border-gray-700 pt-2 mt-2">
          <p className="text-xs text-gray-400 mb-1">Текущие координаты</p>
          <div className="flex gap-3">
            <span className="text-xs bg-gray-800 rounded px-2 py-1">
              lat: {satellite.lat?.toFixed(2)}°
            </span>
            <span className="text-xs bg-gray-800 rounded px-2 py-1">
              lon: {satellite.lon?.toFixed(2)}°
            </span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-2 mt-2">
          <p className="text-xs text-gray-400 mb-1">Следующий пролёт (Москва)</p>
          {loadingPass && (
            <p className="text-xs text-gray-500">Вычисляю...</p>
          )}
          {!loadingPass && nextPass && (
            <div className="space-y-1">
              <p className="text-xs text-green-400">
                🕐 {new Date(nextPass.aos).toLocaleTimeString('ru-RU')}
              </p>
              <p className="text-xs text-gray-300">
                Макс. угол: {nextPass.max_elevation}° · {nextPass.duration_sec}с
              </p>
            </div>
          )}
          {!loadingPass && !nextPass && (
            <p className="text-xs text-gray-500">Нет пролётов в ближайшие 24ч</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-100">{children}</span>
    </div>
  )
}