import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { getSatellitePosition } from '../utils/tle'

const API_BASE = 'http://localhost:8000/api'

export function useSatellites(group = 'stations') {
  const [satellites, setSatellites] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const satellitesRef = useRef([])

  // Загрузка TLE данных
  useEffect(() => {
    let cancelled = false

    // Задержка чтобы избежать синхронного setState в effect
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(true)

      axios.get(`${API_BASE}/satellites/`, { params: { group } })
        .then(res => {
          if (!cancelled) {
            setSatellites(res.data.satellites)
            satellitesRef.current = res.data.satellites
            setError(null)
          }
        })
        .catch(err => {
          if (!cancelled) {
            setError('Ошибка загрузки данных')
            console.error(err)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [group])

  const updatePositions = useCallback((simTime = null) => {
    const sats = satellitesRef.current
    if (sats.length === 0) return

    const date = simTime ? new Date(simTime) : new Date()
    const updated = sats
      .map(sat => {
        const pos = getSatellitePosition(sat.line1, sat.line2, date)
        if (!pos) return null
        return { ...sat, ...pos }
      })
      .filter(Boolean)

    setPositions(updated)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => updatePositions(), 100)
    const interval = setInterval(() => updatePositions(), 5000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [updatePositions, satellites])

  return { satellites, positions, loading, error, updatePositions }
}