import { useState, useEffect, useRef } from 'react'

export default function Timeline({ simTime, onTimeChange }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef(null)

  // Текущее время симуляции (или реальное если simTime = null)
  const currentTime = simTime ? new Date(simTime) : new Date()

  // Запуск/остановка симуляции
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onTimeChange(prev => {
          const base = prev ? new Date(prev) : new Date()
          return new Date(base.getTime() + speed * 10000).getTime()
        })
      }, 100)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, onTimeChange])

  function handleReset() {
    setIsPlaying(false)
    onTimeChange(null) // возврат к реальному времени
  }

  function handleSkip(minutes) {
    const base = simTime ? new Date(simTime) : new Date()
    onTimeChange(new Date(base.getTime() + minutes * 60 * 1000).getTime())
  }

  const speeds = [1, 5, 10, 60]

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl px-5 py-3 text-white shadow-xl border border-gray-700 flex items-center gap-4">

      {/* Текущее время */}
      <div className="text-center min-w-[140px]">
        <p className="text-xs text-gray-400 mb-0.5">
          {simTime ? '⏱ Симуляция' : '🕐 Реальное время'}
        </p>
        <p className="text-sm font-mono font-semibold text-green-400">
          {currentTime.toUTCString().slice(0, 25)}
        </p>
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Перемотка назад */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleSkip(-60)}
          className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700 text-xs"
          title="-1 час"
        >
          ⏮ 1ч
        </button>
        <button
          onClick={() => handleSkip(-10)}
          className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700 text-xs"
          title="-10 минут"
        >
          ◀ 10м
        </button>
      </div>

      {/* Play / Pause */}
      <button
        onClick={() => setIsPlaying(p => !p)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors font-bold text-sm ${
          isPlaying
            ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
            : 'bg-green-500 hover:bg-green-400 text-black'
        }`}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Перемотка вперёд */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleSkip(10)}
          className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700 text-xs"
          title="+10 минут"
        >
          10м ▶
        </button>
        <button
          onClick={() => handleSkip(60)}
          className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700 text-xs"
          title="+1 час"
        >
          1ч ⏭
        </button>
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Скорость */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-1">×</span>
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              speed === s
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Сброс */}
      <button
        onClick={handleReset}
        className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-gray-700"
      >
        ↺ Сброс
      </button>
    </div>
  )
}