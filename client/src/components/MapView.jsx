import { useEffect, useRef, useState } from 'react';

export default function MapView({ services = [], userLocation = null, height = '600px' }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(null);

    // Load Google Maps SDK
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setError('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to .env');
            return;
        }
        if (window.google?.maps) { setMapLoaded(true); return; }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => setMapLoaded(true);
        script.onerror = () => setError('Google Maps failed to load');
        document.head.appendChild(script);
    }, []);

    // Initialize the map
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
        const center = userLocation
            ? { lat: userLocation.lat, lng: userLocation.lng }
            : { lat: 28.6139, lng: 77.2090 }; // Default: New Delhi

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });
        infoWindowRef.current = new window.google.maps.InfoWindow();
    }, [mapLoaded, userLocation]);

    // User location marker
    useEffect(() => {
        if (!mapInstanceRef.current || !userLocation) return;
        new window.google.maps.Marker({
            position: { lat: userLocation.lat, lng: userLocation.lng },
            map: mapInstanceRef.current,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#7c3aed',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
            },
            title: 'Aapki location',
        });
        mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }, [userLocation, mapLoaded]);

    // Add service markers
    useEffect(() => {
        if (!mapInstanceRef.current || !mapLoaded) return;

        // Purane markers hatao
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        services.forEach((service) => {
            if (!service.location?.coordinates) return;
            const [lng, lat] = service.location.coordinates;
            if (lng === 0 && lat === 0) return;

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstanceRef.current,
                title: service.title,
                icon: {
                    url: `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
              <path d="M20 0C9 0 0 9 0 20C0 31 20 48 20 48S40 31 40 20C40 9 31 0 20 0Z" fill="#7c3aed"/>
              <circle cx="20" cy="20" r="12" fill="white"/>
              <text x="20" y="24" text-anchor="middle" font-size="11" fill="#7c3aed" font-weight="bold">${service.creditCost || service.hoursRequired || '?'}</text>
            </svg>
          `)}`,
                    anchor: new window.google.maps.Point(20, 48),
                },
            });

            marker.addListener('click', () => {
                const content = `
          <div style="max-width:220px;font-family:Arial,sans-serif;padding:4px;">
            <p style="margin:0;font-weight:bold;font-size:14px;color:#111;">${service.title}</p>
            <p style="margin:4px 0;font-size:12px;color:#666;">${service.category || ''}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
              <span style="color:#f59e0b;font-size:12px;">★ ${service.avgRating?.toFixed(1) || 'New'}</span>
              <span style="background:#ede9fe;color:#7c3aed;font-weight:bold;padding:2px 8px;border-radius:20px;font-size:13px;">
                ${service.creditCost || service.hoursRequired} credits
              </span>
            </div>
            <a href="/services/${service._id}" style="display:block;text-align:center;background:#7c3aed;color:white;padding:6px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;margin-top:8px;">
              View Service
            </a>
          </div>
        `;
                infoWindowRef.current.setContent(content);
                infoWindowRef.current.open(mapInstanceRef.current, marker);
            });

            markersRef.current.push(marker);
        });

        // Fit the map
        if (markersRef.current.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            markersRef.current.forEach((m) => bounds.extend(m.getPosition()));
            if (userLocation) bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
            mapInstanceRef.current.fitBounds(bounds);
        }
    }, [services, mapLoaded]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center bg-gray-100 rounded-2xl" style={{ height }}>
                <p className="text-4xl mb-3">🗺️</p>
                <p className="text-gray-500 text-center px-4">{error}</p>
            </div>
        );
    }

    if (!mapLoaded) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded-2xl animate-pulse" style={{ height }}>
                <div className="text-center">
                    <p className="text-4xl mb-3">🗺️</p>
                    <p className="text-gray-500">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ height }}>
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md px-3 py-2">
                <p className="text-sm font-semibold text-gray-700">
                    📍 {markersRef.current.length} services map pe
                </p>
            </div>
        </div>
    );
}
