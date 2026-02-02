# Map API - React TypeScript Google Maps Integration

A basic React + TypeScript application that integrates with Google Maps API. This project provides a clean foundation for building map-based applications with modern web technologies.

## Features

- ⚛️ React 19 with TypeScript
- 🗺️ Google Maps JavaScript API integration
- ⚡ Vite for fast development and building
- 🎨 Modern, responsive UI
- 🔒 Secure API key management via environment variables

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Google Maps API key (see setup instructions below)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Marc22/map-api.git
cd map-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Google Maps API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Create an API key
5. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
6. Add your API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
map-api/
├── src/
│   ├── components/
│   │   └── MapComponent.tsx    # Google Maps component
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Application styles
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── .env.example                 # Example environment variables
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

## Customization

### Changing the Default Map Location

Edit `src/components/MapComponent.tsx` and modify the `center` prop default value:

```typescript
center = { lat: YOUR_LATITUDE, lng: YOUR_LONGITUDE }
```

### Adjusting Map Zoom Level

Modify the `zoom` prop in `MapComponent.tsx` (default is 12).

## Future Enhancements

This basic application can be extended with:

- 📍 Custom markers and info windows
- 🛣️ Direction and routing features
- 🔍 Place search and autocomplete
- 🎨 Custom map styling
- 📱 Mobile-responsive controls
- 🌍 Geolocation support

## Technologies Used

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) - Map integration
- [@googlemaps/js-api-loader](https://www.npmjs.com/package/@googlemaps/js-api-loader) - Official Google Maps loader

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
