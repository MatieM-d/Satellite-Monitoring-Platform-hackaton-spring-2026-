export default function FilterPanel({
  selectedGroup,
  orbitFilter,
  onGroupChange,
  onOrbitFilterChange,
}) {
  const groups = [
    { value: 'stations', label: '🛸 Станции' },
    { value: 'starlink', label: '🌐 Starlink' },
    { value: 'gps', label: '📡 GPS' },
    { value: 'weather', label: '🌤 Погода' },
    { value: 'resource', label: '🌍 ДЗЗ' },
    { value: 'debris', label: '☄️ Мусор' },
  ]

  const orbits = [
    { value: null, label: 'Все' },
    { value: 'LEO', label: 'LEO' },
    { value: 'MEO', label: 'MEO' },
    { value: 'GEO', label: 'GEO' },
  ]

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 w-56 text-white shadow-xl border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 tracking-wide uppercase">
        🛰 Фильтры
      </h2>

      {/* Группа спутников */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Группировка</p>
        <div className="space-y-1">
          {groups.map(g => (
            <button
              key={g.value}
              onClick={() => onGroupChange(g.value)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                selectedGroup === g.value
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Тип орбиты */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Тип орбиты</p>
        <div className="flex gap-1 flex-wrap">
          {orbits.map(o => (
            <button
              key={String(o.value)}
              onClick={() => onOrbitFilterChange(o.value)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                orbitFilter === o.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 border border-gray-600 hover:bg-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}