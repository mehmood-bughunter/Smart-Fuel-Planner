import { FuelStation, FuelType, Location } from './types';

export const DEFAULT_MILEAGE = 15; // km/l or km/kWh

export const MOCKED_FUEL_PRICES: Record<FuelType, number> = {
  [FuelType.PETROL]: 280,   // PKR per liter
  [FuelType.DIESEL]: 270,   // PKR per liter
  [FuelType.HYBRID]: 280,   // Hybrid cars use petrol, so price is the same
  [FuelType.EV]: 40,        // PKR per kWh
};

export const ECO_DRIVING_TIPS: string[] = [
  'Keep tire pressure optimal for better fuel economy.',
  'Avoid rapid acceleration and harsh braking.',
  'Plan routes to skip heavy traffic and unnecessary detours.',
  'Use cruise control on highways to maintain a steady speed.',
  'Remove unnecessary weight from your vehicle.',
  'Turn off your engine if idling for more than 30 seconds.',
  'Use air conditioning sparingly, especially at lower speeds.',
  'Drive at a moderate speed; excessive speed increases fuel consumption.',
  'Regularly service your vehicle to ensure efficiency.',
  'Combine multiple errands into a single trip.',
  'Maintain a steady speed between 60-70 km/h for optimal fuel efficiency.',
  'Driving in the 70-80 km/h range balances speed and economy for most vehicles.',
  'Be aware that speeds above 80 km/h generally increase fuel consumption.',
  'Consistently driving at 100 km/h or higher will noticeably impact your fuel costs.',
  'For long trips, consider maintaining speeds below 120 km/h to maximize fuel savings.',
];

export const SPEED_RANGE_OPTIONS: string[] = [
  '60-70 km/h',
  '70-80 km/h',
  '80-90 km/h',
  '90-100 km/h',
  '100-120 km/h',
];

export const MOCKED_FUEL_STATIONS: FuelStation[] = [
  {
    id: '1',
    name: 'Shell Defence',
    location: { lat: 24.8197, lng: 67.0371, name: 'Shell Defence, Karachi' },
    fuelPrice: MOCKED_FUEL_PRICES[FuelType.PETROL] * 0.98, // Slightly cheaper
  },
  {
    id: '2',
    name: 'PSO Cantt',
    location: { lat: 24.8250, lng: 67.0300, name: 'PSO Cantt, Karachi' },
    fuelPrice: MOCKED_FUEL_PRICES[FuelType.PETROL],
  },
  {
    id: '3',
    name: 'Total Clifton',
    location: { lat: 24.8360, lng: 67.0210, name: 'Total Clifton, Karachi' },
    fuelPrice: MOCKED_FUEL_PRICES[FuelType.PETROL] * 1.02, // Slightly more expensive
  },
  {
    id: '4',
    name: 'Go Petroleum DHA',
    location: { lat: 24.8050, lng: 67.0450, name: 'Go Petroleum DHA, Karachi' },
    fuelPrice: MOCKED_FUEL_PRICES[FuelType.PETROL] * 0.95, // Even cheaper
  },
  {
    id: '5',
    name: 'Hascol Korangi',
    location: { lat: 24.8210, lng: 67.0600, name: 'Hascol Korangi, Karachi' },
    fuelPrice: MOCKED_FUEL_PRICES[FuelType.DIESEL] * 0.99, // Diesel station example
  },
  {
    id: '6',
    name: 'EV Charge Point Gizri',
    location: { lat: 24.8300, lng: 67.0150, name: 'EV Charge Point Gizri, Karachi' },
    fuelPrice: MOCKED_FUEL_PRICES[FuelType.EV] * 1.1, // EV charging point
  },
];

export const INITIAL_TRIP_DATA = {
  carModel: '',
  fuelType: FuelType.PETROL,
  averageMileage: DEFAULT_MILEAGE,
  startLocation: { lat: 0, lng: 0, name: '' },
  destination: { lat: 0, lng: 0, name: '' },
  preferredSpeedRange: '', // Initialize new field
};

// Default location for map centering (e.g., Karachi, Pakistan)
export const DEFAULT_MAP_CENTER = { lat: 24.8607, lng: 67.0011 };