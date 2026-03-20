import { useState } from 'react'

const GROUPS = {
  purpose: [
    { value: 'stations',   label: '🛸 Орбитальные станции' },
    { value: 'gps',        label: '🧭 GPS' },
    { value: 'navigation', label: '🧭 Навигация (ГЛОНАСС)' },
    { value: 'weather',    label: '🌤 Метеорология' },
    { value: 'resource',   label: '🌍 ДЗЗ' },
    { value: 'military',   label: '🎖 Военные' },
    { value: 'amateur',    label: '📻 Любительские' },
    { value: 'debris',     label: '☄️ Космический мусор' },
  ],
  operator: [
    { value: 'starlink',   label: '🌐 Starlink (SpaceX)' },
    { value: 'oneweb',     label: '🌐 OneWeb' },
    { value: 'planet',     label: '🌍 Planet Labs' },
    { value: 'spire',      label: '📡 Spire Global' },
  ],
}

const ORBITS = [
  { value: null,  label: 'Все' },
  { value: 'LEO', label: 'LEO' },
  { value: 'MEO', label: 'MEO' },
  { value: 'GEO', label: 'GEO' },
]

export default function FilterPanel({
  selectedGroup,
  orbitFilter,
  onGroupChange,
  onOrbitFilterChange,
}) {
  const [activeCategory, setActiveCategory] = useState('purpose')

  const categories = [
    { value: 'purpose',  label: '🎯 Назначение' },
    { value: 'operator', label: '🏢 Оператор' },
  ]

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 w-60 text-white shadow-xl border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 tracking-wide uppercase">
        🛰 Фильтры
      </h2>

      {/* Переключатель категорий */}
      <div className="flex gap-1 mb-3">
        {categories.map(c => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`flex-1 text-xs px-2 py-1.5 rounded-lg transition-colors ${
              activeCategory === c.value
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Список групп */}
      <div className="mb-4 space-y-1 max-h-52 overflow-y-auto pr-1">
        {GROUPS[activeCategory].map(g => (
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

      {/* Тип орбиты */}
      <div className="border-t border-gray-700 pt-3">
        <p className="text-xs text-gray-400 mb-2">Тип орбиты</p>
        <div className="flex gap-1 flex-wrap">
          {ORBITS.map(o => (
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