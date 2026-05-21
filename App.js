import React, { useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CITIES = [
  { id: 1, name: 'Москва', lat: 55.7558, lon: 37.6173 },
  { id: 2, name: 'Подольск', lat: 55.4306, lon: 37.5449 },
  { id: 3, name: 'Калуга', lat: 54.5293, lon: 36.2754 },
  { id: 4, name: 'Тверь', lat: 56.8587, lon: 35.9176 },
  { id: 5, name: 'Мытищи', lat: 55.9116, lon: 37.7308 },
];

const WEATHER = {
  sunny:  { icon: 'weather-sunny', color: '#FFB300', label: 'Ясно ☀️' },
  rainy:  { icon: 'weather-rainy', color: '#1E88E5', label: 'Дождь 🌧️' },
  cloudy: { icon: 'weather-cloudy', color: '#78909C', label: 'Облачно ☁️' },
  snowy:  { icon: 'weather-snowy', color: '#42A5F5', label: 'Снег ❄️' },
};

const OWM_TO_WEATHER = {
  '01d': 'sunny', '01n': 'sunny',
  '02d': 'cloudy', '02n': 'cloudy',
  '03d': 'cloudy', '03n': 'cloudy',
  '04d': 'cloudy', '04n': 'cloudy',
  '09d': 'rainy', '09n': 'rainy',
  '10d': 'rainy', '10n': 'rainy',
  '11d': 'rainy', '11n': 'rainy',
  '13d': 'snowy', '13n': 'snowy',
  '50d': 'cloudy', '50n': 'cloudy',
};

const getTempColor = (temp) => {
  if (temp < 0) return '#2196F3';
  if (temp < 10) return '#4FC3F7';
  if (temp < 20) return '#8BC34A';
  if (temp < 30) return '#FF9800';
  return '#F44336';
};

const API_KEY = 'c04aaf45ed5b032e280a635805e2ad4e';

export default function App() {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const results = {};
        
        for (const city of CITIES) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric&lang=ru`
          );
          
          if (!response.ok) throw new Error(`Ошибка загрузки для ${city.name}`);
          
          const data = await response.json();
          const weatherCode = data.weather[0].icon;
          const weatherKey = OWM_TO_WEATHER[weatherCode] || 'cloudy';
          
          results[city.id] = {
            temp: Math.round(data.main.temp),
            weather: weatherKey,
            description: data.weather[0].description,
          };
        }
        
        setWeatherData(results);
      } catch (err) {
        setError(err.message);
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Загружаем погоду...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>❌ Ошибка: {error}</Text>
        <Text style={styles.hint}>Проверь API ключ и интернет</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.0,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {CITIES.map(city => {
          const data = weatherData[city.id];
          if (!data) return null;
          
          const weatherCfg = WEATHER[data.weather];
          const tempColor = getTempColor(data.temp);
          
          return (
            <Marker
              key={city.id}
              coordinate={{ latitude: city.lat, longitude: city.lon }}
              title={`${city.name}: ${data.temp}°C`}
              description={`Погода: ${weatherCfg.label}`}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.tempBox, { backgroundColor: tempColor }]}>
                  <Text style={styles.tempText}>{data.temp}°</Text>
                </View>
                <View style={styles.weatherBox}>
                  <MaterialCommunityIcons 
                    name={weatherCfg.icon} 
                    size={28} 
                    color={weatherCfg.color} 
                  />
                </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 12, fontSize: 16, color: 'black' },
  errorText: { fontSize: 16, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  hint: { marginTop: 8, fontSize: 13, color: 'gray' },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  tempText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  weatherBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
});