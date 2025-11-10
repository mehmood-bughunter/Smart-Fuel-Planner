/// <reference types="google.maps" />
// Add this block at the very top of the file to declare global objects for TypeScript
// The 'google' types are provided by the reference directive above.
// The 'aistudio' types are assumed to be pre-configured and globally available by the execution environment.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import {
  FuelType,
  Location,
  TripData,
  TripResult,
  FuelStation,
  TripHistoryEntry,
  MonthlyExpense,
} from './types';
import {
  DEFAULT_MILEAGE,
  MOCKED_FUEL_PRICES,
  ECO_DRIVING_TIPS,
  MOCKED_FUEL_STATIONS,
  INITIAL_TRIP_DATA,
  DEFAULT_MAP_CENTER,
  SPEED_RANGE_OPTIONS, // Import new constant
} from './constants';

// Utility for Base64 encoding/decoding - not used in this specific app, but good practice to include if needed for media parts
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to check if Google Maps API is loaded
const checkGoogleMapsLoaded = (callback: () => void) => {
  if (window.google && window.google.maps) {
    callback();
  }
};

// Custom gradients for styling
const gradientBg = 'bg-gradient-to-br from-blue-700 to-green-500';
const cardBg = 'bg-gray-800 shadow-lg rounded-xl p-4';
const buttonGradient = 'bg-gradient-to-r from-blue-600 to-green-400 hover:from-blue-700 hover:to-green-500';

enum Page {
  SPLASH,
  HOME,
  RESULTS,
  MAP,
  HISTORY,
}

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // Show splash for 3 seconds
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in">
      <div className="text-6xl mb-4 animate-bounce-slow">🚗</div>
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-green-300 animate-pulse-slow">
        Smart Fuel Planner
      </h1>
      <p className="text-lg text-gray-400 mt-2 animate-fade-in-delay">Save While You Drive</p>
    </div>
  );
};

const HomePage: React.FC<{
  onPlanTrip: (tripData: TripData) => void;
  setLoading: (loading: boolean) => void;
  googleMapsInitialized: boolean;
}> = ({
  onPlanTrip,
  setLoading,
  googleMapsInitialized,
}) => {
  const [tripData, setTripData] = useState<TripData>(INITIAL_TRIP_DATA);
  const [startLocationInput, setStartLocationInput] = useState<string>('');
  const [destinationInput, setDestinationInput] = useState<string>('');
  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const initAutocomplete = useCallback(() => {
    if (!window.google || !window.google.maps || !googleMapsInitialized) return;

    if (startInputRef.current) {
      startAutocompleteRef.current = new google.maps.places.Autocomplete(
        startInputRef.current,
        { types: ['geocode'] }
      );
      startAutocompleteRef.current.addListener('place_changed', () => {
        const place = startAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location && place.formatted_address) {
          setTripData((prev) => ({
            ...prev,
            startLocation: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.formatted_address,
            },
          }));
          setStartLocationInput(place.formatted_address);
        }
      });
    }

    if (destInputRef.current) {
      destAutocompleteRef.current = new google.maps.places.Autocomplete(
        destInputRef.current,
        { types: ['geocode'] }
      );
      destAutocompleteRef.current.addListener('place_changed', () => {
        const place = destAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location && place.formatted_address) {
          setTripData((prev) => ({
            ...prev,
            destination: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.formatted_address,
            },
          }));
          setDestinationInput(place.formatted_address);
        }
      });
    }
  }, [googleMapsInitialized]);

  useEffect(() => {
    if (googleMapsInitialized) {
      initAutocomplete();
    }
  }, [googleMapsInitialized, initAutocomplete]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTripData((prev) => ({
      ...prev,
      [name]: name === 'averageMileage' ? parseFloat(value) : value,
    }));
  };

  const handlePlanTrip = async () => {
    if (
      !tripData.carModel ||
      !tripData.averageMileage ||
      !tripData.startLocation.name ||
      !tripData.destination.name ||
      !tripData.startLocation.lat ||
      !tripData.destination.lat
    ) {
      alert('Please fill all trip details!');
      return;
    }
    setLoading(true);
    onPlanTrip(tripData);
  };

  const isFormValid = tripData.carModel &&
    tripData.averageMileage > 0 &&
    tripData.startLocation.lat !== 0 &&
    tripData.destination.lat !== 0 &&
    googleMapsInitialized;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Plan Your Journey</h2>

      <div className={`${cardBg} w-full max-w-md space-y-4`}>
        <div>
          <label htmlFor="carModel" className="block text-gray-300 text-sm font-bold mb-2">Car Model</label>
          <input
            type="text"
            id="carModel"
            name="carModel"
            value={tripData.carModel}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Tesla Model 3"
            aria-label="Car Model"
          />
        </div>

        <div>
          <label htmlFor="fuelType" className="block text-gray-300 text-sm font-bold mb-2">Fuel Type</label>
          <select
            id="fuelType"
            name="fuelType"
            value={tripData.fuelType}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Fuel Type"
          >
            {Object.values(FuelType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="averageMileage" className="block text-gray-300 text-sm font-bold mb-2">
            Average Mileage ({tripData.fuelType === FuelType.EV ? 'km/kWh' : 'km/l'})
          </label>
          <input
            type="number"
            id="averageMileage"
            name="averageMileage"
            value={tripData.averageMileage}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 15 (for km/l) or 6 (for km/kWh)"
            aria-label={`Average Mileage in ${tripData.fuelType === FuelType.EV ? 'km per kWh' : 'km per liter'}`}
          />
        </div>

        {/* New: Preferred Driving Speed Range */}
        <div>
          <label htmlFor="preferredSpeedRange" className="block text-gray-300 text-sm font-bold mb-2">
            Preferred Driving Speed
          </label>
          <select
            id="preferredSpeedRange"
            name="preferredSpeedRange"
            value={tripData.preferredSpeedRange || ''}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Preferred Driving Speed Range"
          >
            <option value="">Select preference (Optional)</option>
            {SPEED_RANGE_OPTIONS.map((speed) => (
              <option key={speed} value={speed}>{speed}</option>
            ))}
          </select>
        </div>


        <div>
          <label htmlFor="startLocation" className="block text-gray-300 text-sm font-bold mb-2">Starting Location</label>
          <input
            ref={startInputRef}
            type="text"
            id="startLocation"
            name="startLocation"
            value={startLocationInput}
            onChange={(e) => {
              setStartLocationInput(e.target.value);
              setTripData((prev) => ({ ...prev, startLocation: { ...prev.startLocation, name: e.target.value } }));
            }}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Karachi, Pakistan"
            aria-label="Starting Location"
            disabled={!googleMapsInitialized}
          />
        </div>

        <div>
          <label htmlFor="destination" className="block text-gray-300 text-sm font-bold mb-2">Destination</label>
          <input
            ref={destInputRef}
            type="text"
            id="destination"
            name="destination"
            value={destinationInput}
            onChange={(e) => {
              setDestinationInput(e.target.value);
              setTripData((prev) => ({ ...prev, destination: { ...prev.destination, name: e.target.value } }));
            }}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Lahore, Pakistan"
            aria-label="Destination"
            disabled={!googleMapsInitialized}
          />
        </div>

        <button
          onClick={handlePlanTrip}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold ${buttonGradient} transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={!isFormValid}
          aria-label="Plan My Trip"
        >
          Plan My Trip
        </button>
      </div>
    </div>
  );
};

const ResultsPage: React.FC<{
  tripResult: TripResult;
  onViewMap: () => void;
  onSaveTrip: (tripResult: TripResult) => void;
  onBackToHome: () => void;
}> = ({ tripResult, onViewMap, onSaveTrip, onBackToHome }) => {
  const [currentEcoTip, setCurrentEcoTip] = useState<string>('');

  useEffect(() => {
    // Select a random eco tip on component mount or tripResult change
    const randomIndex = Math.floor(Math.random() * ECO_DRIVING_TIPS.length);
    setCurrentEcoTip(ECO_DRIVING_TIPS[randomIndex]);
  }, [tripResult]);

  const handleSmartSaveMode = () => {
    alert('Smart Save Mode suggests the best time to refuel based on price trends or station deals. (Feature coming soon!)');
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-4">Trip Results</h2>

      {/* Trip Summary Card */}
      <div className={`${cardBg} w-full max-w-md animate-slide-up-delay-1`}>
        <h3 className="text-xl font-semibold text-white mb-2">Trip Summary</h3>
        <p className="text-gray-300">Car Model: <span className="text-green-300">{tripResult.tripData.carModel}</span></p>
        <p className="text-gray-300">Fuel Type: <span className="text-green-300">{tripResult.tripData.fuelType}</span></p>
        {tripResult.tripData.preferredSpeedRange && (
          <p className="text-gray-300">Preferred Speed: <span className="text-green-300">{tripResult.tripData.preferredSpeedRange}</span></p>
        )}
        <p className="text-gray-300">Start: <span className="text-green-300">{tripResult.tripData.startLocation.name}</span></p>
        <p className="text-gray-300">Destination: <span className="text-green-300">{tripResult.tripData.destination.name}</span></p>
        <p className="text-gray-300">Trip Distance: <span className="text-green-300">{tripResult.distanceKm.toFixed(2)} km</span></p>
        <p className="text-gray-300">Estimated Cost: <span className="text-green-300">PKR {tripResult.estimatedCost.toFixed(2)}</span></p>
        <p className="text-gray-300">Estimated Time: <span className="text-green-300">{tripResult.estimatedTime}</span></p>
      </div>

      {/* Eco Driving Tips Card */}
      <div className={`${cardBg} w-full max-w-md animate-slide-up-delay-2`}>
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
          <span className="material-icons text-green-400 mr-2">eco</span> Eco Driving Tip
        </h3>
        <p className="text-gray-300 italic">"{currentEcoTip}"</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-4 w-full max-w-md">
        <button
          onClick={onViewMap}
          className={`py-3 px-4 rounded-lg text-white font-bold ${buttonGradient} transition-all duration-300 ease-in-out transform hover:scale-105 animate-slide-up-delay-3`}
          aria-label="View Nearby Fuel Stations"
        >
          <span className="material-icons align-middle mr-2">local_gas_station</span>
          View Nearby Fuel Stations
        </button>
        <button
          onClick={() => onSaveTrip(tripResult)}
          className={`py-3 px-4 rounded-lg text-white font-bold ${buttonGradient} transition-all duration-300 ease-in-out transform hover:scale-105 animate-slide-up-delay-4`}
          aria-label="Save Trip"
        >
          <span className="material-icons align-middle mr-2">save</span>
          Save Trip
        </button>
        <button
          onClick={handleSmartSaveMode}
          className={`py-3 px-4 rounded-lg text-white font-bold ${buttonGradient} transition-all duration-300 ease-in-out transform hover:scale-105 animate-slide-up-delay-5`}
          aria-label="Smart Save Mode"
        >
          <span className="material-icons align-middle mr-2">lightbulb</span>
          Smart Save Mode
        </button>
        <button
          onClick={onBackToHome}
          className="py-3 px-4 rounded-lg bg-gray-700 text-gray-200 font-bold hover:bg-gray-600 transition-colors duration-300 animate-slide-up-delay-6"
          aria-label="Plan New Trip"
        >
          <span className="material-icons align-middle mr-2">add_road</span>
          Plan New Trip
        </button>
      </div>
    </div>
  );
};

const MapPage: React.FC<{ tripResult: TripResult; onBack: () => void }> = ({ tripResult, onBack }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: DEFAULT_MAP_CENTER, // Default to a central location
        zoom: 12,
        mapId: 'DEMO_MAP_ID', // Using a generic mapId for basic functionality
        disableDefaultUI: true, // Customize controls
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        styles: [
          // Dark theme styles for Google Maps
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }],
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }],
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }],
          },
          {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }],
          },
        ],
      });
    }

    const map = mapInstance.current;
    if (map) {
      // Clear existing markers and polylines
      // (This assumes markers and polylines are managed internally,
      // a more robust solution would store references to clear them explicitly)
      // For simplicity, we'll just draw new ones each time props change.

      // Draw route
      if (tripResult.routePath.length > 0) {
        const flightPath = new google.maps.Polyline({
          path: tripResult.routePath,
          geodesic: true,
          strokeColor: '#34D399', // Electric Green
          strokeOpacity: 0.8,
          strokeWeight: 5,
        });
        flightPath.setMap(map);

        const bounds = new google.maps.LatLngBounds();
        tripResult.routePath.forEach(point => bounds.extend(point));
        map.fitBounds(bounds);
      } else {
        // If no route, center on start location or default
        map.setCenter(tripResult.tripData.startLocation.lat ?
          { lat: tripResult.tripData.startLocation.lat, lng: tripResult.tripData.startLocation.lng } :
          DEFAULT_MAP_CENTER
        );
        map.setZoom(12);
      }

      // Add fuel station markers
      let cheapestStation: FuelStation | null = null;
      tripResult.nearbyStations.forEach((station) => {
        if (!cheapestStation || station.fuelPrice < cheapestStation.fuelPrice) {
          cheapestStation = station;
        }
      });

      tripResult.nearbyStations.forEach((station) => {
        const isCheapest = station.id === cheapestStation?.id;
        const marker = new google.maps.Marker({
          position: { lat: station.location.lat, lng: station.location.lng },
          map: map,
          title: station.name,
          icon: {
            url: isCheapest ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
        });

        const infoWindowContent = `
          <div class="text-gray-900">
            <h4 class="font-bold">${station.name}</h4>
            <p>Price: PKR ${station.fuelPrice.toFixed(2)}</p>
            <p>Distance: ${station.distanceKm?.toFixed(1) || 'N/A'} km</p>
            ${isCheapest ? '<p class="text-green-600 font-bold">Cheapest Option!</p>' : ''}
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
          content: infoWindowContent,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    }
  }, [tripResult]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-4 z-10 animate-fade-in">Nearby Fuel Stations</h2>
      <div
        ref={mapRef}
        className="w-full h-[60vh] rounded-xl shadow-2xl z-0 animate-slide-up-delay-1"
        aria-label="Google Map showing trip route and nearby fuel stations"
      ></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mt-6 animate-slide-up-delay-2">
        {tripResult.nearbyStations.map((station) => (
          <div key={station.id} className={`${cardBg} flex items-center justify-between`}>
            <div>
              <p className="font-semibold text-white">{station.name}</p>
              <p className="text-gray-400 text-sm">{station.location.name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg text-green-400 font-bold">PKR {station.fuelPrice.toFixed(2)}</p>
              <p className="text-gray-300 text-sm">{station.distanceKm?.toFixed(1) || 'N/A'} km</p>
              {station.id === tripResult.nearbyStations.reduce((prev, curr) => (prev.fuelPrice < curr.fuelPrice ? prev : curr), tripResult.nearbyStations[0])?.id && (
                <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded-full mt-1">Cheapest</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-8 py-3 px-6 rounded-lg bg-gray-700 text-gray-200 font-bold hover:bg-gray-600 transition-colors duration-300 z-10 animate-slide-up-delay-3"
        aria-label="Back to Results"
      >
        <span className="material-icons align-middle mr-2">arrow_back</span>
        Back to Results
      </button>
    </div>
  );
};

const HistoryPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tripHistory, setTripHistory] = useState<TripHistoryEntry[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('tripHistory');
    if (storedHistory) {
      const parsedHistory: TripHistoryEntry[] = JSON.parse(storedHistory);
      setTripHistory(parsedHistory);
      calculateMonthlyExpenses(parsedHistory);
    }
  }, []);

  const calculateMonthlyExpenses = (history: TripHistoryEntry[]) => {
    const monthly: { [key: string]: number } = {};
    history.forEach((trip) => {
      const date = new Date(trip.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthly[monthYear] = (monthly[monthYear] || 0) + trip.estimatedCost;
    });

    const expenses: MonthlyExpense[] = Object.keys(monthly).map((month) => ({
      month,
      cost: monthly[month],
    }));
    setMonthlyExpenses(expenses.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())); // Sort chronologically
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-4">Trip History & Expenses</h2>

      {tripHistory.length === 0 ? (
        <p className="text-gray-400 text-lg">No trips saved yet. Plan a trip and save it!</p>
      ) : (
        <div className="w-full max-w-4xl space-y-8">
          {/* Monthly Expenses Chart */}
          <div className={`${cardBg} animate-slide-up-delay-1`}>
            <h3 className="text-xl font-semibold text-white mb-4">Monthly Fuel Expenses</h3>
            <div className="w-full h-48 flex items-end justify-around space-x-2">
              {monthlyExpenses.length > 0 ? (
                monthlyExpenses.map((data, index) => (
                  <div key={data.month} className="flex flex-col items-center h-full justify-end">
                    <div
                      className="w-8 bg-green-500 rounded-t-md transition-all duration-500 ease-out transform hover:scale-x-110"
                      style={{ height: `${(data.cost / Math.max(...monthlyExpenses.map(m => m.cost))) * 90 + 10}%` }} // Scale to max 90% of container height, min 10%
                      title={`PKR ${data.cost.toFixed(2)}`}
                    ></div>
                    <p className="text-xs text-gray-400 mt-1">{data.month}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No monthly data to display.</p>
              )}
            </div>
          </div>

          {/* Trip Log */}
          <div className={`${cardBg} animate-slide-up-delay-2`}>
            <h3 className="text-xl font-semibold text-white mb-4">Saved Trips</h3>
            <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {tripHistory.map((trip) => (
                <div key={trip.id} className="border-b border-gray-700 last:border-b-0 py-3">
                  <p className="text-green-300 font-medium">{trip.carModel} - {trip.date}</p>
                  <p className="text-gray-300 text-sm">{trip.startLocationName} to {trip.destinationName}</p>
                  <p className="text-gray-400 text-xs">Distance: {trip.distanceKm.toFixed(2)} km | Cost: PKR {trip.estimatedCost.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-8 py-3 px-6 rounded-lg bg-gray-700 text-gray-200 font-bold hover:bg-gray-600 transition-colors duration-300 animate-slide-up-delay-3"
        aria-label="Back to Home"
      >
        <span className="material-icons align-middle mr-2">home</span>
        Back to Home
      </button>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-6 min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
    <p className="ml-4 text-xl text-gray-300 animate-pulse">Calculating your journey...</p>
  </div>
);

const ConfigurationRequiredScreen: React.FC<{
  genAIKeyNeeded: boolean;
  googleMapsKeyNeeded: boolean;
  onSelectGenAIKey: () => Promise<void>;
}> = ({ genAIKeyNeeded, googleMapsKeyNeeded, onSelectGenAIKey }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen text-center animate-fade-in">
      <h2 className="text-3xl font-bold text-red-400 mb-6">Configuration Required</h2>

      {genAIKeyNeeded && (
        <div className={`${cardBg} w-full max-w-md space-y-4 mb-6`}>
          <p className="text-lg text-gray-300">
            A GenAI API key is required to use this application.
          </p>
          <p className="text-sm text-gray-400">
            Please select your API key through the prompt.
            <br />
            For more information on billing, visit{' '}
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              ai.google.dev/gemini-api/docs/billing
            </a>
          </p>
          <button
            onClick={onSelectGenAIKey}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold ${buttonGradient} transition-all duration-300 ease-in-out transform hover:scale-105`}
            aria-label="Select GenAI API Key"
          >
            <span className="material-icons align-middle mr-2">vpn_key</span>
            Select GenAI API Key
          </button>
        </div>
      )}

      {googleMapsKeyNeeded && (
        <div className={`${cardBg} w-full max-w-md space-y-4`}>
          <p className="text-lg text-gray-300">
            Google Maps API is not loaded or configured.
          </p>
          <p className="text-sm text-gray-400">
            Please ensure your `GOOGLE_MAPS_API_KEY` environment variable is correctly set
            and the Google Maps JavaScript API is enabled for your project.
          </p>
          <p className="text-sm text-gray-400">
            Without this, route planning and fuel station search will not function.
          </p>
        </div>
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.SPLASH);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // API Key States
  const [hasGenAIKey, setHasGenAIKey] = useState<boolean>(false);
  const [googleMapsInitialized, setGoogleMapsInitialized] = useState<boolean>(false);
  const [googleMapsLoadError, setGoogleMapsLoadError] = useState<boolean>(false);


  const initializeApp = useCallback(async () => {
    // 1. Check GenAI API Key
    if (window.aistudio) {
      if (await window.aistudio.hasSelectedApiKey()) {
        setHasGenAIKey(true);
      } else {
        // If not selected, prompt user to select it
        try {
          await window.aistudio.openSelectKey();
          setHasGenAIKey(true); // Assume success after opening dialog
        } catch (error) {
          console.error("Failed to select GenAI API key:", error);
          setHasGenAIKey(false);
        }
      }
    } else {
      console.warn("window.aistudio not available. GenAI API key cannot be managed.");
      // If aistudio is not available, assume GenAI key is missing or not configured.
      setHasGenAIKey(false);
    }

    // 2. Check Google Maps API after a short delay to allow script from index.html to load
    const mapsCheckTimeout = setTimeout(() => {
      if (window.google && window.google.maps) {
        setGoogleMapsInitialized(true);
      } else {
        console.error("Google Maps API did not load. Check GOOGLE_MAPS_API_KEY.");
        setGoogleMapsInitialized(false);
        setGoogleMapsLoadError(true);
      }
    }, 1000); // Give 1 second for Google Maps script to execute

    return () => clearTimeout(mapsCheckTimeout);
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleSelectGenAIKey = useCallback(async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasGenAIKey(true);
      } catch (error) {
        console.error("Error re-selecting GenAI API key:", error);
        setHasGenAIKey(false);
      }
    }
  }, []);


  const handlePlanTrip = useCallback(async (data: TripData) => {
    setLoading(true);
    if (!window.google || !window.google.maps) {
      alert("Google Maps API not loaded. Cannot plan trip.");
      setLoading(false);
      return;
    }

    try {
      const directionsService = new google.maps.DirectionsService();
      const directionsResult = await directionsService.route({
        origin: { lat: data.startLocation.lat, lng: data.startLocation.lng },
        destination: { lat: data.destination.lat, lng: data.destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (directionsResult.status !== 'OK' || !directionsResult.routes[0]) {
        throw new Error('Directions request failed');
      }

      const route = directionsResult.routes[0].legs[0];
      const distanceKm = route.distance ? route.distance.value / 1000 : 0; // meters to km
      const estimatedTime = route.duration ? route.duration.text : 'N/A';
      const routePath = directionsResult.routes[0].overview_path.map(latLng => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));

      const fuelPricePerUnit = MOCKED_FUEL_PRICES[data.fuelType];
      let estimatedCost = 0;
      if (data.averageMileage > 0) {
        const unitsNeeded = distanceKm / data.averageMileage;
        estimatedCost = unitsNeeded * fuelPricePerUnit;
      }

      // Find nearby fuel stations using PlacesService
      const placesService = new google.maps.places.PlacesService(document.createElement('div')); // Dummy div
      const nearbyStations: FuelStation[] = await new Promise((resolve) => {
        placesService.nearbySearch(
          {
            location: { lat: data.destination.lat, lng: data.destination.lng },
            radius: 5000, // 5 km radius around destination
            type: 'gas_station',
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const stations: FuelStation[] = results.map((place) => {
                const stationLoc: Location = {
                  lat: place.geometry!.location!.lat(),
                  lng: place.geometry!.location!.lng(),
                  name: place.name!,
                };
                // Mock fuel price and distance calculation
                const mockPrice = MOCKED_FUEL_PRICES[FuelType.PETROL] * (0.95 + Math.random() * 0.1); // Add some variability
                const dist = calculateDistance(data.destination, stationLoc);
                return {
                  id: place.place_id || Math.random().toString(),
                  name: place.name || 'Unknown Station',
                  location: stationLoc,
                  fuelPrice: mockPrice,
                  distanceKm: dist,
                };
              }).filter(station => station.distanceKm !== undefined && station.distanceKm < 10); // Filter out far stations
              resolve(stations.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity))); // Sort by distance
            } else {
              console.warn('Google Places search failed:', status);
              // Fallback to mocked stations if API fails or returns no results
              resolve(MOCKED_FUEL_STATIONS.map(mockStation => ({
                ...mockStation,
                distanceKm: calculateDistance(data.destination, mockStation.location)
              })).sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity)));
            }
          }
        );
      });

      const newTripResult: TripResult = {
        tripData: data,
        distanceKm,
        estimatedCost,
        estimatedTime,
        ecoTips: [], // Tips are randomized on ResultsPage render
        nearbyStations,
        routePath,
      };

      setTripResult(newTripResult);
      setCurrentPage(Page.RESULTS);
    } catch (error: any) {
      console.error('Error planning trip:', error);
      // Handle "Requested entity was not found." for Veo key selection, potentially for Maps API too.
      // This is primarily for GenAI keys, but keeping the catch-all for robustness.
      if (error.message && error.message.includes("Requested entity was not found.")) {
        alert("There was an issue with the API key or service configuration. Please re-select your API key or ensure it's properly configured.");
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setHasGenAIKey(true); // Assume success
        }
      } else {
        alert('Failed to plan trip. Please check your locations and try again. ' + error.message);
      }
      setTripResult(null);
      setCurrentPage(Page.HOME);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveTrip = useCallback((result: TripResult) => {
    const historyEntry: TripHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      carModel: result.tripData.carModel,
      startLocationName: result.tripData.startLocation.name || 'Unknown',
      destinationName: result.tripData.destination.name || 'Unknown',
      distanceKm: result.distanceKm,
      estimatedCost: result.estimatedCost,
    };

    const storedHistory = localStorage.getItem('tripHistory');
    const existingHistory: TripHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
    const updatedHistory = [...existingHistory, historyEntry];
    localStorage.setItem('tripHistory', JSON.stringify(updatedHistory));
    alert('Trip saved to history!');
  }, []);

  // Haversine formula to calculate distance between two lat/lng points
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lng - loc1.lng);
    const lat1 = toRad(loc1.lat);
    const lat2 = toRad(loc2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const renderPage = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    // Show splash screen only on initial load, then transition to home or config screen
    if (currentPage === Page.SPLASH) {
      return <SplashScreen onFinish={() => setCurrentPage(Page.HOME)} />;
    }

    // Configuration required screen
    if (!hasGenAIKey || googleMapsLoadError) {
      return (
        <ConfigurationRequiredScreen
          genAIKeyNeeded={!hasGenAIKey}
          googleMapsKeyNeeded={googleMapsLoadError}
          onSelectGenAIKey={handleSelectGenAIKey}
        />
      );
    }


    switch (currentPage) {
      case Page.HOME:
        return <HomePage onPlanTrip={handlePlanTrip} setLoading={setLoading} googleMapsInitialized={googleMapsInitialized} />;
      case Page.RESULTS:
        return tripResult ? (
          <ResultsPage
            tripResult={tripResult}
            onViewMap={() => setCurrentPage(Page.MAP)}
            onSaveTrip={handleSaveTrip}
            onBackToHome={() => setCurrentPage(Page.HOME)}
          />
        ) : (
          <HomePage onPlanTrip={handlePlanTrip} setLoading={setLoading} googleMapsInitialized={googleMapsInitialized} /> // Fallback if result is somehow null
        );
      case Page.MAP:
        return tripResult ? (
          <MapPage tripResult={tripResult} onBack={() => setCurrentPage(Page.RESULTS)} />
        ) : (
          <HomePage onPlanTrip={handlePlanTrip} setLoading={setLoading} googleMapsInitialized={googleMapsInitialized} /> // Fallback
        );
      case Page.HISTORY:
        return <HistoryPage onBack={() => setCurrentPage(Page.HOME)} />;
      default:
        return <HomePage onPlanTrip={handlePlanTrip} setLoading={setLoading} googleMapsInitialized={googleMapsInitialized} />;
    }
  };

  return (
    <div className={`min-h-screen ${gradientBg} font-sans relative`}>
      <header className="flex justify-between items-center p-4 bg-gray-900 bg-opacity-80 shadow-md backdrop-blur-sm z-20">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-green-300">
          Smart Fuel Planner
        </h1>
        <nav className="space-x-4">
          <button
            onClick={() => setCurrentPage(Page.HOME)}
            className={`p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors ${currentPage === Page.HOME ? 'bg-gray-700 text-white' : ''}`}
            aria-label="Home"
          >
            <span className="material-icons align-middle">home</span>
          </button>
          <button
            onClick={() => setCurrentPage(Page.HISTORY)}
            className={`p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors ${currentPage === Page.HISTORY ? 'bg-gray-700 text-white' : ''}`}
            aria-label="History"
          >
            <span className="material-icons align-middle">history</span>
          </button>
        </nav>
      </header>

      <main className="container mx-auto py-8">
        {renderPage()}
      </main>

      <footer className="p-4 text-center text-gray-400 text-sm bg-gray-900 bg-opacity-80 backdrop-blur-sm mt-8">
        &copy; {new Date().getFullYear()} Smart Fuel Planner. All rights reserved.
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Custom scrollbar styles (Tailwind doesn't have this natively, so adding a small global style)
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #374151; /* gray-700 */
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #10B981; /* green-500 */
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #059669; /* green-600 */
  }

  /* Keyframe animations */
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fade-in-delay {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(-10%); }
    50% { transform: translateY(0); }
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  @keyframes slide-up-delay-1 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up-delay-2 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up-delay-3 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up-delay-4 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up-delay-5 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up-delay-6 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0