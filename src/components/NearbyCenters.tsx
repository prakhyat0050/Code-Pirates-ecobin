import { useState } from 'react';
import { LocateFixed, MapPin, Navigation, Search, Loader2, ExternalLink } from 'lucide-react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function NearbyCenters() {
  const [city, setCity] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Location is not supported by this browser. Search by city instead.');
      return;
    }
    setLocating(true);
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setMessage('Location permission was not available. Search by city instead.');
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const target = location
    ? `${location.latitude},${location.longitude}`
    : city.trim();
  const mapsUrl = target
    ? `https://www.google.com/maps/search/recycling+centre+e-waste+collection+centre+near+${encodeURIComponent(target)}`
    : '';

  return (
    <section className="mt-10 bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-2">
            <MapPin className="w-4 h-4" />
            Find nearby centres
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Give waste a better next stop</h2>
          <p className="text-gray-500 mt-1 max-w-xl">Search for recycling, e-waste, battery, and collection centres near you.</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">India-ready search</div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={city}
            onChange={(event) => { setCity(event.target.value); setLocation(null); setMessage(''); }}
            placeholder="Enter your city or area"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-60 transition-colors"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          Use my location
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-amber-700">{message}</p>}

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href={mapsUrl || '#'}
          onClick={(event) => { if (!mapsUrl) event.preventDefault(); }}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${mapsUrl ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          <Navigation className="w-4 h-4" />
          Open nearby results
          <ExternalLink className="w-4 h-4" />
        </a>
        {location && <span className="text-sm text-emerald-700">Location detected. Results are opening around you.</span>}
      </div>
    </section>
  );
}
