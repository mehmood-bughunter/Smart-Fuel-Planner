/// <reference types="google.maps" />

export enum FuelType {
  PETROL = 'Petrol',
  DIESEL = 'Diesel',
  HYBRID = 'Hybrid',
  EV = 'EV',
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface TripData {
  carModel: string;
  fuelType: FuelType;
  averageMileage: number; // km/l or km/kWh
  startLocation: Location;
  destination: Location;
  preferredSpeedRange?: string; // New optional field for preferred driving speed
}

export interface FuelStation {
  id: string;
  name: string;
  location: Location;
  fuelPrice: number; // Price per unit (liter or kWh)
  distanceKm?: number;
}

export interface TripResult {
  tripData: TripData;
  distanceKm: number;
  estimatedCost: number;
  estimatedTime: string;
  ecoTips: string[];
  nearbyStations: FuelStation[];
  routePath: google.maps.LatLngLiteral[];
}

export interface TripHistoryEntry {
  id: string;
  date: string;
  carModel: string;
  startLocationName: string;
  destinationName: string;
  distanceKm: number;
  estimatedCost: number;
}

export interface MonthlyExpense {
  month: string;
  cost: number;
}