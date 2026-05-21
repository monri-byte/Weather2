import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CITIES = [
  { id: 1, name: 'Москва', lat: 55.7558, lon: 37.6173, weather: 'sunny' },
  { id: 2, name: 'Подольск', lat: 55.4306, lon: 37.5449, weather: 'cloudy' },
  { id: 3, name: 'Калуга', lat: 54.5293, lon: 36.2754, weather: 'rainy' },
  { id: 4, name: 'Тверь', lat: 56.8587, lon: 35.9176, weather: 'snowy' },
  { id: 5, name: 'Мытищи', lat: 55.9116, lon: 37.7308, weather: 'sunny' },
];

const WEATHER = {
  sunny:  { icon: 'weather-sunny', color: '#FFB300', label: 'Ясно ☀️' },
  rainy:  { icon: 'weather-rainy', color: '#1E88E5', label: 'Дождь 🌧️' },
  cloudy: { icon: 'weather-cloudy', color: '#78909C', label: 'Облачно ☁️' },
  snowy:  { icon: 'weather-snowy', color: '#42A5F5', label: 'Снег ❄️' },
};

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          // Центр сместили чуть-чуть, чтобы Калуга и Тверь лучше влезали
          latitude: 55.7558,
          longitude: 37.0, 
          latitudeDelta: 5, // Увеличил зум (было 12), чтобы города были ближе
          longitudeDelta: 5,
        }}
      >
        {CITIES.map(city => {
          const cfg = WEATHER[city.weather];
          return (
            <Marker
              key={city.id}
              coordinate={{ latitude: city.lat, longitude: city.lon }}
              title={city.name}
              description={`Погода: ${cfg.label}`}
            >
              <View style={styles.markerBox}>
                <MaterialCommunityIcons name={cfg.icon} size={30} color={cfg.color} />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
});