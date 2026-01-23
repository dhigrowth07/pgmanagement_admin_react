import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Input, Spin, Empty } from "antd";
import { Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Hide Leaflet attribution
const style = document.createElement('style');
style.textContent = `
  .leaflet-control-attribution {
    display: none !important;
  }
`;
document.head.appendChild(style);

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
      map.flyTo(position, 15); // Zoom level 15 for better view
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);

  // Default to Bangalore if no initial position
  const center = initialPosition ? [initialPosition.lat, initialPosition.lng] : [12.9716, 77.5946];

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search function
  const handleSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // Use backend proxy endpoint to avoid CORS issues
      const apiUrl = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiUrl}/api/v1/attendance/geocode?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include auth token
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500); // 500ms debounce
  };

  // Handle selecting a search result
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    onLocationChange({ lat, lng });
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <>
    {/* Search Input */}
      <div className="mb- relative" ref={resultsRef}>
        <Input
          placeholder="Search for a location (e.g., 'Bangalore', 'MG Road')"
          value={searchQuery}
          onChange={handleSearchInputChange}
          prefix={<Search size={16} className="text-gray-400" />}
          suffix={isSearching ? <Spin size="small" /> : null}
          className="w-full"
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        
        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
            {isSearching ? (
              <div className="p-4 text-center">
                <Spin size="small" />
                <span className="ml-2 text-gray-500">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="py-1">
                {searchResults.map((result, index) => (
                  <li
                    key={result.place_id || index}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-start">
                      <Search size={14} className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {result.display_name.split(',').slice(0, 2).join(',')}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {result.display_name}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchQuery.trim().length >= 3 ? (
              <div className="p-4">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="No locations found" 
                  className="my-2"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

    <div className="relative">
      

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "300px", width: "100%", borderRadius: "8px", zIndex: 0 }}
        scrollWheelZoom={false} // Disable scroll zoom to prevent accidental zooming while scrolling page
        attributionControl={false} // Hide attribution control
      >
        <TileLayer
          attribution=''
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          position={initialPosition ? [initialPosition.lat, initialPosition.lng] : null} 
          onLocationChange={onLocationChange} 
        />
      </MapContainer>
    </div>
    </>
  );
};

export default MapPicker;
