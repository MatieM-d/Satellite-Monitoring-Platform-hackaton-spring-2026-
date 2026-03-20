import { useState } from 'react'
import SatelliteMap from './components/SatelliteMap'
import FilterPanel from './components/FilterPanel'
import SatelliteCard from './components/SatelliteCard'
import Timeline from './components/Timeline'

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState('stations')
  const [orbitFilter, setOrbitFilter] = useState(null)
  const [selectedSat, setSelectedSat] = useState(null)
  const [simTime, setSimTime] = useState(null)

  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden">

      <SatelliteMap
        group={selectedGroup}
        orbitFilter={orbitFilter}
        simTime={simTime}
        onSelectSat={setSelectedSat}
      />

      <div className="absolute top-4 left-4 z-[1000]">
        <FilterPanel
          selectedGroup={selectedGroup}
          orbitFilter={orbitFilter}
          onGroupChange={setSelectedGroup}
          onOrbitFilterChange={setOrbitFilter}
        />
      </div>

      {selectedSat && (
        <div className="absolute top-4 right-4 z-[1000]">
          <SatelliteCard
            satellite={selectedSat}
            onClose={() => setSelectedSat(null)}
          />
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
        <Timeline simTime={simTime} onTimeChange={setSimTime} />
      </div>

    </div>
  )
}