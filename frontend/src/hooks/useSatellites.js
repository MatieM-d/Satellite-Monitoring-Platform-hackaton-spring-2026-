import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'
import { getSatellitePosition } from '../utils/tle'

const API_BASE = 'http://localhost:8000/api'

export function useSatellites(groups = []) {
  const [satellites, setSatellites] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const satellitesRef = useRef([])

  const groupsKey = useMemo(() => groups.join(','), [groups])

  useEffect(() => {
    if (!groups || groups.length === 0) {
      setSatellites([])
      satellitesRef.current = []
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      if (!cancelled) setLoading(true)

      try {
        const results = await Promise.all(
          groups.map(group =>
            axios.get(`${API_BASE}/satellites/`, { params: { group } })
              .then(r => r.data.satellites)
              .catch(() => [])
          )
        )

        if (!cancelled) {
          const seen = new Set()
          const merged = results.flat().filter(sat => {
            if (seen.has(sat.norad_id)) return false
            seen.add(sat.norad_id)
            return true
          })

          setSatellites(merged)
          satellitesRef.current = merged
          setError(null)
        }
      } catch {
        if (!cancelled) setError('Ошибка загрузки данных')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [groupsKey])

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