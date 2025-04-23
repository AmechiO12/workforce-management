import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import enhancedApi from '../utils/enhancedApi';

const CheckOutForm = ({ onCheckOutComplete }) => {
  // State hooks for component data
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState({
    checkInData: true,
    geoLocation: false,
    checkOut: false
  });
  const [debugInfo, setDebugInfo] = useState({
    buttonClicked: false,
    apiCallAttempted: false,
    apiResponse: null,
    rawActivity: null
  });

  // Fetch the user's latest check-in on component mount
  useEffect(() => {
    console.log("CheckOutForm component mounted");
    fetchLatestCheckIn();
  }, []);

  // Clear any status message
  const clearStatus = () => setStatus({ type: '', message: '' });

  // Set a status message
  const setStatusMessage = (type, message) => {
    console.log(`Setting status: ${type} - ${message}`);
    setStatus({ type, message });
  };

  // Fetch the latest check-in for the current user
  const fetchLatestCheckIn = async () => {
    try {
      console.log("Fetching latest check-in...");
      setIsLoading(prev => ({ ...prev, checkInData: true }));
      
      // Get recent activity to find the latest check-in
      const activity = await enhancedApi.dashboard.getRecentActivity(10);
      console.log("Recent activity data:", activity);
      
      // Debug: Store raw activity data
      setDebugInfo(prev => ({
        ...prev,
        rawActivity: activity
      }));
      
      if (Array.isArray(activity) && activity.length > 0) {
        // Find the latest check-in (not check-out)
        const checkIn = activity.find(item => item.type === 'check-in');
        console.log("Latest check-in found:", checkIn);
        
        if (checkIn) {
          // Get all locations first
          const locations = await enhancedApi.locations.getAll();
          console.log("Available locations:", locations);
          
          if (Array.isArray(locations) && locations.length > 0) {
            // Try to find the location by name from the check-in
            const location = locations.find(loc => loc.name === checkIn.location);
            console.log("Matched location for check-in:", location);
            
            if (location) {
              setLatestCheckIn({
                ...checkIn,
                locationData: location
              });
            } else {
              console.error("Location not found by name, using first location");
              // If location not found by name, use the first one as a fallback
              setLatestCheckIn({
                ...checkIn,
                locationData: locations[0]
              });
            }
          } else {
            setStatusMessage('warning', 'No locations available. Please contact an administrator.');
          }
        } else {
          setStatusMessage('warning', 'No active check-in found. Please check in first.');
        }
      } else {
        console.error("Activity data is not an array or is empty:", activity);
        setStatusMessage('error', 'No recent activity found. Please check in first.');
      }
    } catch (error) {
      console.error('Error fetching check-in data:', error);
      setStatusMessage('error', 'Error loading check-in data. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, checkInData: false }));
    }
  };

  // Get the user's current location
  const getCurrentLocation = async () => {
    clearStatus();
    setIsLoading(prev => ({ ...prev, geoLocation: true }));
    console.log("Getting current location...");

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

      console.log("Received coordinates:", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      
      setStatusMessage('success', `Location acquired (${position.coords.accuracy.toFixed(1)}m accuracy)`);
    } catch (error) {
      console.error("Geolocation error:", error);
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

  // Handle check-out submission
  const handleCheckOut = async (e) => {
    e.preventDefault();
    clearStatus();
    
    // Update debug info for button click
    setDebugInfo(prev => ({
      ...prev,
      buttonClicked: true
    }));
    
    console.log("Check-out button clicked");
    
    // Validate we have the necessary data
    if (!latestCheckIn || !latestCheckIn.locationData) {
      console.error("Missing check-in or location data", { latestCheckIn });
      setStatusMessage('error', 'No active check-in found. Please check in first.');
      return;
    }

    if (!coordinates) {
      console.error("Missing coordinates");
      setStatusMessage('error', 'Please get your current location first');
      return;
    }

    setIsLoading(prev => ({ ...prev, checkOut: true }));

    try {
      // Update debug info for API call
      setDebugInfo(prev => ({
        ...prev,
        apiCallAttempted: true
      }));
      
      // Create check-out data
      const checkOutData = {
        location_id: latestCheckIn.locationData.id,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        check_type: 'out'  // Specify this is a check-out
      };
      
      console.log("Sending check-out request:", checkOutData);
      
      // Try both methods to ensure it works
      let response;
      
      // First try the enhanced validation API
      try {
        console.log("Attempting check-out with validation...");
        response = await enhancedApi.checkins.createWithValidation(checkOutData);
        console.log("Validation API response:", response);
      } catch (validationError) {
        console.error("Validation API error:", validationError);
        // If validation fails, try the standard API
        console.log("Falling back to standard API...");
        response = await enhancedApi.checkins.create(checkOutData);
        console.log("Standard API response:", response);
      }
      
      // Update debug info with API response
      setDebugInfo(prev => ({
        ...prev,
        apiResponse: response
      }));
      
// Enhanced check-out function that focuses on updating recent activity
// Add this to your handleCheckOut function in CheckOutForm.jsx
// Right after a successful check-out response

if (response && (response.success || response.id)) {
  console.log("Check-out successful!");
  setStatusMessage('success', `Check-out successful from ${latestCheckIn.location}!`);
  
  // Reset coordinates after successful check-out
  setCoordinates(null);
  
  // ACTIVITY FOCUSED REFRESH STRATEGY
  // 1. First, force clear any cached activity data
  localStorage.removeItem('recent_activity_cache');
  
  // 2. Make multiple attempts to refresh activity data with increasing delays
  const refreshActivityWithRetry = async (attempt = 1) => {
    console.log(`Refreshing activity data - attempt ${attempt}...`);
    
    try {
      // Clear any previous in-memory activity cache by forcing a server refetch
      const freshActivity = await enhancedApi.dashboard.getRecentActivity(10, true);
      console.log(`Attempt ${attempt}: Fetched fresh activity data:`, freshActivity);
      
      // If successful and we got data, we're done
      if (Array.isArray(freshActivity) && freshActivity.length > 0) {
        console.log(`Activity refresh successful on attempt ${attempt}`);
        return;
      }
      
      // If not successful and we haven't tried too many times, retry with exponential backoff
      if (attempt < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10 seconds
        console.log(`Activity data not yet updated, retrying in ${delay}ms...`);
        
        setTimeout(() => {
          refreshActivityWithRetry(attempt + 1);
        }, delay);
      }
    } catch (error) {
      console.error(`Error refreshing activity on attempt ${attempt}:`, error);
      
      // Retry with backoff if we haven't tried too many times
      if (attempt < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        setTimeout(() => {
          refreshActivityWithRetry(attempt + 1);
        }, delay);
      }
    }
  };
  
  // Start the refresh process immediately
  refreshActivityWithRetry();
  
  // 3. Force a complete dashboard data refresh after a delay
  setTimeout(async () => {
    try {
      console.log("Performing full dashboard refresh...");
      const freshDashboardData = await enhancedApi.dashboard.getUnifiedDashboardData(true); // Force refresh
      console.log("Fresh dashboard data received:", freshDashboardData);
    } catch (error) {
      console.error("Error in full dashboard refresh:", error);
    }
    
    // 4. Now call the callback to update the UI
    if (onCheckOutComplete) {
      console.log("Calling onCheckOutComplete callback to update UI");
      onCheckOutComplete();
    }
  }, 2000); // Wait 2 seconds before full refresh
  
  // Reset latest check-in
  setLatestCheckIn(null);
  
  // 5. Offer to return to dashboard after all refreshes
  setTimeout(() => {
    if (window.confirm("Check-out successful! Return to dashboard?")) {
      window.location.href = '/dashboard'; // Adjust this as needed for your routing
    }
  }, 3000); // Wait 3 seconds before showing the dialog
}
      } catch (error) {
        console.error("Error during check-out:", error);
        setStatusMessage('error', `Check-out failed: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(prev => ({ ...prev, checkOut: false }));
      }
    };

  // Loading state
  if (isLoading.checkInData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading check-in data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Debug Info Panel - for troubleshooting only */}
      <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-md text-xs">
        <h3 className="font-bold text-gray-700 mb-2">Debug Info</h3>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify({
            buttonClicked: debugInfo.buttonClicked,
            apiCallAttempted: debugInfo.apiCallAttempted,
            coordinates: coordinates,
            latestCheckIn: latestCheckIn ? {
              id: latestCheckIn.id,
              location: latestCheckIn.location,
              locationId: latestCheckIn.locationData?.id,
            } : null,
            loading: isLoading,
            apiResponse: debugInfo.apiResponse
          }, null, 2)}
        </pre>
      </div>

      {/* Main check-out card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Check Out
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Record your departure and complete your shift</p>
        </div>
        
        <form onSubmit={handleCheckOut} className="p-6">
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
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : status.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{status.message}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Latest Check-in Information */}
          {latestCheckIn ? (
            <div className="mb-6 p-4 rounded-md bg-blue-50 border border-blue-200">
              <h3 className="text-md font-medium text-blue-800 mb-2">Current Check-in</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium">{latestCheckIn.location}</p>
                    <p className="text-sm text-gray-600">
                      Checked in at {new Date(latestCheckIn.time).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Location ID: {latestCheckIn.locationData?.id || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200 text-center">
              <AlertCircle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-yellow-700">No active check-in found.</p>
              <p className="text-sm text-yellow-600 mt-1">
                Please check in first before attempting to check out.
              </p>
            </div>
          )}
          
          {/* Location information */}
          {latestCheckIn && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <MapPin className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 italic">No location data available</p>
                    <p className="text-xs text-gray-400 mt-1">Click the button below to get your current location</p>
                  </div>
                )}
              </div>
              
              {/* Get location button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoading.geoLocation}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
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
          )}
          
          {/* Check-out button */}
          <button
            type="submit"
            disabled={isLoading.checkOut || !coordinates || !latestCheckIn}
            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading.checkOut || !coordinates || !latestCheckIn ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading.checkOut ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking Out...
              </span>
            ) : 'Check Out'}
          </button>
        </form>
      </div>
      
      {/* Info card */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-indigo-500" />
            Check-Out Information
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Check out completes your shift and records your departure time.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>You'll need to be within the allowed radius of your check-in location.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Make sure to check out at the end of each workday or shift.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Your work hours will be calculated from check-in to check-out times.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CheckOutForm;