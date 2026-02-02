import './App.css'
import MapComponent from './components/MapComponent'

function App() {
  return (
    <div className="app-container">
      <h1>Leaflet + OSM React TypeScript App</h1>
      <p className="description">
        This is a basic React + TypeScript application using Leaflet with OpenStreetMap tiles.
      </p>
      <MapComponent />
    </div>
  )
}

export default App
