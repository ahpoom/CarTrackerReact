import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CarManagementScreen from './components/CarSearchSystem';

export default function App() {
  return (
    <SafeAreaProvider>
      <CarManagementScreen />
    </SafeAreaProvider>
  );
}