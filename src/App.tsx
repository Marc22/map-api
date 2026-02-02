import './App.css'
import MapComponent from './components/MapComponent'

function App() {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="app-container">
      <h1>Google Maps React TypeScript App</h1>
      {apiKey ? (
        <>
          <p className="description">
            This is a basic React + TypeScript application integrated with Google Maps API.
          </p>
          <MapComponent apiKey={apiKey} />
        </>
      ) : (
        <div className="warning">
          <h2>⚠️ API Key Required</h2>
          <p>
            Please add your Google Maps API key to the <code>.env</code> file:
          </p>
          <pre>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</pre>
        </div>
      )}
    </div>
  )
}

export default App
