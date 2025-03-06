import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const CheckInForm = () => {
  // State management
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Loading states
  const [isLoading, setIsLoading] = useState({
    locations: true,
    geoLocation: false,
    checkIn: false
  });

  // Clear any existing status message
  const clearStatus = () => setStatus({ type: '', message: '' });

  // Set a status message
  const setStatusMessage = (type, message) => setStatus({ type, message });

  // Fetch locations from API
  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, locations: true }));
      const response = await api.locations.getAll();
      
      if (Array.isArray(response)) {
        setLocationsList(response);
        if (response.length > 0) {
          setSelectedLocation(response[0].id);
        } else {
          setStatusMessage('warning', 'No locations available for check-in.');
        }
      } else if (response.error) {
        setStatusMessage('error', response.error);
      } else {
        setStatusMessage('error', 'Failed to load locations. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setStatusMessage('error', 'Error connecting to server. Please try again later.');
    } finally {
      setIsLoading(prev => ({ ...prev, locations: false }));
    }
  }, []);

  // Load locations on component mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Get current location
  const getCurrentLocation = async () => {
    clearStatus();
    setIsLoading(prev => ({ ...prev, geoLocation: true }));

    if (!navigator.geolocation) {
      setStatusMessage('error', 'Geolocation is not supported by your browser');
      setIsLoading(prev => ({ ...prev, geoLocation: false }));
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      
      setStatusMessage('success', `Location acquired (${position.coords.accuracy.toFixed(1)}m accuracy)`);
    } catch (error) {
      let errorMessage = 'Unable to retrieve your location';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please try again in a different area.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please check your connection and try again.';
          break;
        default:
          errorMessage = `Location error: ${error.message || 'Unknown error'}`;
      }
      
      setStatusMessage('error', errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, geoLocation: false }));
    }
  };

  // Handle check-in submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearStatus();
    
    // Validate form data
    if (!selectedLocation) {
      setStatusMessage('error', 'Please select a location');
      return;
    }

    if (!coordinates) {
      setStatusMessage('error', 'Please get your current location first');
      return;
    }

    setIsLoading(prev => ({ ...prev, checkIn: true }));

    try {
      const checkInData = {
        location_id: selectedLocation,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      const response = await api.checkins.create(checkInData);
      
      if (response.success) {
        // Find the location name for better feedback
        const locationName = locationsList.find(loc => loc.id === selectedLocation)?.name || 'selected location';
        
        setStatusMessage(
          'success', 
          `Check-in successful at ${locationName}! ${
            response.distance_km 
              ? `You are ${response.distance_km.toFixed(2)} km from the location center.` 
              : ''
          }`
        );
        
        // Reset coordinates after successful check-in
        setCoordinates(null);
      } else if (response.error) {
        setStatusMessage('error', response.error);
      } else {
        setStatusMessage('error', 'Check-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setStatusMessage('error', error.message || 'Error connecting to server. Please try again later.');
    } finally {
      setIsLoading(prev => ({ ...prev, checkIn: false }));
    }
  };

  // UI display for loading state when fetching locations
  if (isLoading.locations) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Main check-in card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Check In
          </h2>
          <p className="text-blue-100 text-sm mt-1">Verify your location and record your attendance</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Status message */}
          {status.message && (
            <div className={`mb-6 p-4 rounded-md ${
              status.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : status.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {status.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : status.type === 'warning' ? (
                    <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{status.message}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Location select */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
              Location
            </label>
            <div className="relative">
              <select
                id="location"
                className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={locationsList.length === 0}
              >
                {locationsList.length === 0 ? (
                  <option value="">No locations available</option>
                ) : (
                  locationsList.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {locationsList.length > 0 && selectedLocation && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: {locationsList.find(loc => loc.id === selectedLocation)?.name}
              </p>
            )}
          </div>
          
          {/* GPS location */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Your Location
            </label>
            <div className="bg-gray-50 border border-gray-300 rounded-md p-4 mb-3">
              {coordinates ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="inline-block w-24 font-medium text-sm text-gray-700">Latitude:</span>
                    <span className="text-sm text-gray-900">{coordinates.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-24 font-medium text-sm text-gray-700">Longitude:</span>
                    <span className="text-sm text-gray-900">{coordinates.longitude.toFixed(6)}</span>
                  </div>
                  {coordinates.accuracy && (
                    <div className="flex items-center">
                      <span className="inline-block w-24 font-medium text-sm text-gray-700">Accuracy:</span>
                      <span className="text-sm text-gray-900">{coordinates.accuracy.toFixed(1)} meters</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 italic">No location data available</p>
                  <p className="text-xs text-gray-400 mt-1">Click the button below to get your current location</p>
                </div>
              )}
            </div>
            
            {/* Location button */}
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLoading.geoLocation}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading.geoLocation ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading.geoLocation ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting Location...
                </span>
              ) : coordinates ? 'Update Location' : 'Get Current Location'}
            </button>
          </div>
          
          {/* Check-in button */}
          <button
            type="submit"
            disabled={isLoading.checkIn || !coordinates || !selectedLocation}
            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isLoading.checkIn || !coordinates || !selectedLocation ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading.checkIn ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking In...
              </span>
            ) : 'Check In'}
          </button>
        </form>
      </div>
      
      {/* Info card */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Location Requirements
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You must be physically present at the selected location.
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Each location has a defined radius - you must be within this radius to check in.
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Enable location services on your device for accurate check-ins.
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              For best results, ensure you have a clear view of the sky to improve GPS accuracy.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CheckInForm;