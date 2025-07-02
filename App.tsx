

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Button,
  ScrollView,
  Text,
  PermissionsAndroid,
  Platform,
  View,
  Alert,
} from 'react-native';
import { NativeModules } from 'react-native';

// Type definition for the native modules
interface SignalStrengthModule {
  getSignalStrength: () => Promise<Array<Record<string, any>>>;
}

interface LocationModule {
  getLocation: () => Promise<{ latitude: number; longitude: number }>;
}

const { SignalStrength, LocationModule } = NativeModules as {
  SignalStrength: SignalStrengthModule;
  LocationModule: LocationModule;
};

export default function App() {
  const [signals, setSignals] = useState<Array<Record<string, any>>>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [logData, setLogData] = useState<Array<{ timestamp: string; signals: Array<Record<string, any>>; location: { latitude: number; longitude: number } | null }>>([]);
  const loggingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ]);

        console.log('Permission results:', result);

        const fineGranted =
          result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
        const phoneGranted =
          result['android.permission.READ_PHONE_STATE'] === PermissionsAndroid.RESULTS.GRANTED;

        if (fineGranted && phoneGranted) {
          setHasPermission(true);
          console.log('All required permissions granted.');
        } else {
          setHasPermission(false);
          Alert.alert(
            'Permission Required',
            'Location and Phone permissions are required to get signal strength.',
            [{ text: 'OK' }],
          );
        }
      } catch (err) {
        console.error('Permission request failed:', err);
      }
    } else {
      setHasPermission(true); // iOS doesn't require these at runtime
    }
  };

  const getSignalStrength = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot fetch signal strength without required permissions.');
      return;
    }

    try {
      const result = await SignalStrength.getSignalStrength();
      console.log('Signal strength result:', result);
      setSignals(result);
    } catch (error) {
      console.error('Failed to get signal strength:', error);
    }
  };

  const getLocation = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot fetch location without required permissions.');
      return;
    }

    try {
      const loc = await LocationModule.getLocation();
      console.log('Location result:', loc);
      setLocation(loc);
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const startLogging = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot fetch data without required permissions.');
      return;
    }
    if (logging) {
      // Already logging
      return;
    }
    setLogging(true);
    const fetchAndLog = async () => {
      try {
        const [signalResult, loc] = await Promise.all([
          SignalStrength.getSignalStrength(),
          LocationModule.getLocation(),
        ]);
        setSignals(signalResult);
        setLocation(loc);
        const currentTimestamp = new Date().toLocaleString();
        setTimestamp(currentTimestamp);
        setLogData(prev => [...prev, { timestamp: currentTimestamp, signals: signalResult, location: loc }]);
        console.log('Logging data:', { signalResult, loc });
      } catch (error) {
        console.error('Failed to log data:', error);
        Alert.alert('Error', 'Failed to get signal strength and location');
      }
    };
    await fetchAndLog();
    loggingIntervalRef.current = setInterval(fetchAndLog, 60000); // 1 minute interval
  };

  const stopLogging = () => {
    if (loggingIntervalRef.current) {
      clearInterval(loggingIntervalRef.current);
      loggingIntervalRef.current = null;
    }
    setLogging(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, paddingTop: 60 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
      {!logging ? (
        <Button title="Start Campaign" color="green" onPress={startLogging} />
      ) : (
        <Button title="Stop Campaign" color="blue" onPress={stopLogging} />
      )}
    </View>

    <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
      <Button title="Clear Results" color="red" onPress={() => { setSignals([]); setLogData([]); }} />
    </View>



      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Logged Data</Text>
        <ScrollView style={{ maxHeight: 600 }}>
          {logData.length === 0 ? (
            <Text style={{ fontSize: 16, fontStyle: 'italic' }}>No logged data yet.</Text>
          ) : (
            logData.map((log, index) => (
              <View key={index} style={{ marginBottom: 32, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Timestamp: {log.timestamp}</Text>
                <Text>Location: {log.location ? `Lat: ${log.location.latitude}, Lon: ${log.location.longitude}` : 'No location data'}</Text>
                <Text>Signals:</Text>
                {log.signals.map((signal, i) => (
                  <View key={i} style={{ marginLeft: 10, marginTop: 4 }}>
                    {Object.entries(signal).map(([key, value]) => (
                      <Text key={key}>{key}: {value}</Text>
                    ))}
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
      
    
  </SafeAreaView>
);
}