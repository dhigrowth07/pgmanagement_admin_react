import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon missing assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const LocationMarker = ({ position, onLocationChange }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const MapPicker = ({ initialPosition, onLocationChange }) => {
    // Default to Bangalore if no initial position
    const center = initialPosition ? [initialPosition.lat, initialPosition.lng] : [12.9716, 77.5946];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "8px", zIndex: 0 }}
      scrollWheelZoom={false} // Disable scroll zoom to prevent accidental zooming while scrolling page
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker 
         position={initialPosition ? [initialPosition.lat, initialPosition.lng] : null} 
         onLocationChange={onLocationChange} 
      />
    </MapContainer>
  );
};

export default MapPicker;
