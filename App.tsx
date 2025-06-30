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

// Type definition for the native module
interface SignalStrengthModule {
  getSignalStrength: () => Promise<Array<Record<string, any>>>;
}

const { SignalStrength } = NativeModules as {
  SignalStrength: SignalStrengthModule;
};

export default function App() {
  const [signals, setSignals] = useState<Array<Record<string, any>>>([]);
  const [hasPermission, setHasPermission] = useState(false);

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

  return (
  <SafeAreaView style={{ flex: 1, padding: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
      <Button title="Get Signal Strength" onPress={getSignalStrength} />
      <Button title="Clear Results" color="red" onPress={() => setSignals([])} />
    </View>
    
    <ScrollView style={{ marginTop: 10 }}>
      {signals.length === 0 ? (
        <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 20 }}>No signal data</Text>
      ) : (
        signals.map((signal, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, lineHeight: 20 }}>
              {Object.entries(signal)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  </SafeAreaView>
);
}
