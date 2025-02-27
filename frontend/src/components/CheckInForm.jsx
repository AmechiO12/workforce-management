import React, { useState, useEffect } from 'react';

const CheckInForm = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://127.0.0.1:5000/locations/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setLocations(data);
          if (data.length > 0) {
            setSelectedLocation(data[0].id);
          }
        } else {
          setStatus({
            type: 'error',
            message: 'Failed to load locations. Please try again.'
          });
        }
      } catch (error) {
        setStatus({
          type: 'error',
          message: 'Error connecting to server. Please try again later.'
        });
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    setIsLocationLoading(true);
    setStatus({ type: '', message: '' });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocationLoading(false);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred.';
          }
          
          setStatus({ type: 'error', message: errorMessage });
          setIsLocationLoading(false);
        }
      );
    } else {
      setStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser'
      });
      setIsLocationLoading(false);
    }
  };

  // Handle check-in submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      setStatus({
        type: 'error',
        message: 'Please select a location'
      });
      return;
    }

    if (!coordinates.latitude || !coordinates.longitude) {
      setStatus({
        type: 'error',
        message: 'Please get your current location first'
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:5000/checkins/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location_id: selectedLocation,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.success) {
          setStatus({
            type: 'success',
            message: `Check-in successful! You are ${data.distance_km?.toFixed(2) || '0'} km from the location.`
          });
        } else {
          setStatus({
            type: 'error',
            message: data.error || 'Check-in failed. Please try again.'
          });
        }
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Check-in failed. Please try again.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Error connecting to server. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (locationsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 text-white">
          <h2 className="text-xl font-bold">Check In</h2>
          <p className="text-blue-100 text-sm">Verify your location and check in</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {status.message && (
            <div className={`mb-6 p-4 rounded-md ${
              status.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {status.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
              Location
            </label>
            <select
              id="location"
              className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              disabled={locations.length === 0}
            >
              {locations.length === 0 ? (
                <option value="">No locations available</option>
              ) : (
                locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Your Location
            </label>
            <div className="bg-gray-50 border border-gray-300 rounded-md p-4 mb-2">
              {coordinates.latitude && coordinates.longitude ? (
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Latitude:</span> {coordinates.latitude.toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Longitude:</span> {coordinates.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No location data available</p>
              )}
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLocationLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLocationLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLocationLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting Location...
                </span>
              ) : 'Get Current Location'}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !coordinates.latitude || !coordinates.longitude}
            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isLoading || !coordinates.latitude || !coordinates.longitude ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
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
      
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Location Requirements</h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2 text-sm text-gray-600">
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
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CheckInForm;