import { useState } from 'react'

const GROUPS = {
  purpose: [
    { value: 'stations',  label: '🛸 Орбитальные станции' },
    { value: 'weather',   label: '🌤 Метеорология' },
    { value: 'noaa',      label: '🌤 NOAA' },
    { value: 'goes',      label: '🌤 GOES' },
    { value: 'resource',  label: '🌍 ДЗЗ' },
    { value: 'military',  label: '🎖 Военные' },
    { value: 'amateur',   label: '📻 Любительские' },
    { value: 'cubesat',   label: '🔬 CubeSat' },
    { value: 'debris',    label: '☄️ Мусор' },
    { value: 'education', label: '🎓 Образовательные' },
  ],
  navigation: [
    { value: 'gps',      label: '🧭 GPS (США)' },
    { value: 'glonass',  label: '🧭 ГЛОНАСС (Россия)' },
    { value: 'galileo',  label: '🧭 Galileo (ЕС)' },
    { value: 'beidou',   label: '🧭 BeiDou (Китай)' },
    { value: 'geo',      label: '🌐 GEO спутники' },
    { value: 'gorizont', label: '📡 Горизонт' },
    { value: 'raduga',   label: '📡 Радуга' },
    { value: 'molniya',  label: '📡 Молния' },
  ],
  operator: [
    { value: 'starlink',   label: '🌐 Starlink' },
    { value: 'oneweb',     label: '🌐 OneWeb' },
    { value: 'planet',     label: '🌍 Planet Labs' },
    { value: 'spire',      label: '📡 Spire' },
    { value: 'iridium',    label: '📱 Iridium NEXT' },
    { value: 'globalstar', label: '📱 Globalstar' },
  ],
}

const ORBITS = [
  { value: null,  label: 'Все' },
  { value: 'LEO', label: 'LEO' },
  { value: 'MEO', label: 'MEO' },
  { value: 'GEO', label: 'GEO' },
]

const CATEGORIES = [
  { value: 'purpose',    label: '🎯 Назначение' },
  { value: 'navigation', label: '🧭 Навигация' },
  { value: 'operator',   label: '🏢 Оператор' },
  { value: 'custom',     label: '📂 Свой файл' },
]

export default function FilterPanel({
  selectedGroups = [],
  orbitFilter,
  onGroupsChange,
  onOrbitFilterChange,
  onCustomTLE,
}) {
  const [activeCategory, setActiveCategory] = useState('purpose')
  const [customUrl, setCustomUrl] = useState('')
  const [urlStatus, setUrlStatus] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)

  function toggleGroup(value) {
    if (selectedGroups.includes(value)) {
      onGroupsChange(selectedGroups.filter(g => g !== value))
    } else {
      onGroupsChange([...selectedGroups, value])
    }
  }

  async function handleUrlLoad() {
    if (!customUrl.trim()) return
    setUrlStatus('')
    setUrlLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8000/api/satellites/custom?url=${encodeURIComponent(customUrl)}`
      )
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      if (data.satellites.length === 0) throw new Error('Спутники не найдены')
      onCustomTLE(data.satellites)
      setUrlStatus(`✅ Загружено ${data.satellites.length} спутников`)
    } catch (e) {
      setUrlStatus(`❌ ${e.message}`)
    } finally {
      setUrlLoading(false)
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const res = await fetch('http://localhost:8000/api/satellites/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: ev.target.result,
        })
        const data = await res.json()
        onCustomTLE(data.satellites)
        setUrlStatus(`✅ Загружено ${data.satellites.length} спутников`)
      } catch {
        setUrlStatus('❌ Ошибка чтения файла')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 w-64 text-white shadow-xl border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 tracking-wide uppercase">
        🛰 Фильтры
      </h2>

      {/* Категории */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${
              activeCategory === c.value
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Мультиселект групп */}
      {activeCategory !== 'custom' && (
        <>
          {selectedGroups.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-green-400">
                Выбрано: {selectedGroups.length}
              </span>
              <button
                onClick={() => onGroupsChange([])}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Сбросить
              </button>
            </div>
          )}

          <div className="space-y-1 max-h-52 overflow-y-auto pr-1 mb-4">
            {GROUPS[activeCategory].map(g => {
              const isSelected = selectedGroups.includes(g.value)
              return (
                <button
                  key={g.value}
                  onClick={() => toggleGroup(g.value)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-green-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'bg-green-400 border-green-400' : 'border-gray-500'
                  }`}>
                    {isSelected && <span className="text-gray-900 text-[8px] font-bold">✓</span>}
                  </div>
                  {g.label}
                </button>
              )
            })}
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
        </>
      )}

      {/* Свой файл */}
      {activeCategory === 'custom' && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">URL TLE файла</p>
            <input
              type="text"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlLoad()}
              placeholder="https://example.com/tle.txt"
              className="w-full text-xs bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleUrlLoad}
              disabled={urlLoading}
              className="mt-1.5 w-full text-xs bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white py-1.5 rounded-lg transition-colors"
            >
              {urlLoading ? 'Загрузка...' : '⬇️ Загрузить'}
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Или файл с диска</p>
            <input
              type="file"
              accept=".txt,.tle"
              onChange={handleFileUpload}
              className="hidden"
              id="tle-file"
            />
            <label
              htmlFor="tle-file"
              className="block w-full text-center text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              📁 Выбрать файл .txt / .tle
            </label>
          </div>

          {urlStatus && (
            <p className={`text-xs ${urlStatus.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {urlStatus}
            </p>
          )}

          <div className="border-t border-gray-700 pt-2">
            <p className="text-xs text-gray-500 mb-1">Примеры:</p>
            <button
              onClick={() => setCustomUrl('http://r4uab.ru/satonline.txt')}
              className="text-xs text-blue-400 hover:text-blue-300 underline block"
            >
              r4uab.ru/satonline.txt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}