import React, { useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
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

const getPrecipRadius = (mm) => {
  if (mm < 0.5) return 12000;
  if (mm < 2) return 25000;
  if (mm < 5) return 40000;
  return 55000;
};

const API_KEY = 'c04aaf45ed5b032e280a635805e2ad4e';

export default function App() {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPrecipitation, setShowPrecipitation] = useState(false);

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
            rain: data.rain?.['1h'] || 0,
            snow: data.snow?.['1h'] || 0,
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
      <View style={styles.togglesContainer}>
        <TouchableOpacity 
          style={[styles.layerToggle, showTemperature && styles.layerToggleActive]}
          onPress={() => setShowTemperature(!showTemperature)}
        >
          <MaterialCommunityIcons name={showTemperature ? 'thermometer' : 'thermometer-outline'} size={20} color={showTemperature ? '#fff' : '#666'} />
          <Text style={[styles.layerToggleText, showTemperature && styles.layerToggleTextActive]}>Темп.</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.layerToggle, showPrecipitation && styles.layerToggleActive]}
          onPress={() => setShowPrecipitation(!showPrecipitation)}
        >
          <MaterialCommunityIcons name={showPrecipitation ? 'umbrella' : 'umbrella-outline'} size={20} color={showPrecipitation ? '#fff' : '#666'} />
          <Text style={[styles.layerToggleText, showPrecipitation && styles.layerToggleTextActive]}>Осадки</Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.0,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {showTemperature && CITIES.map(city => {
          const data = weatherData[city.id];
          if (!data) return null;
          const tempColor = getTempColor(data.temp);
          const fillColor = `${tempColor}73`;
          
          return (
            <Circle
              key={`temp-${city.id}`}
              center={{ latitude: city.lat, longitude: city.lon }}
              radius={30000}
              fillColor={fillColor}
              strokeColor="rgba(0,0,0,0.15)"
              strokeWidth={1}
            />
          );
        })}

        {showPrecipitation && CITIES.map(city => {
          const data = weatherData[city.id];
          if (!data) return null;
          const precipMm = data.rain || data.snow || 0;
          if (precipMm < 0.1) return null;
          
          const isSnow = data.snow > 0;
          const radius = getPrecipRadius(precipMm);
          const fillColor = isSnow ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 136, 229, 0.45)';
          const strokeColor = isSnow ? 'rgba(215, 215, 215, 0.7)' : 'rgba(30, 136, 229, 0.8)';
          
          return (
            <React.Fragment key={`precip-${city.id}`}>
              <Circle
                center={{ latitude: city.lat, longitude: city.lon }}
                radius={radius}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={2}
              />
              <Marker coordinate={{ latitude: city.lat - 0.025, longitude: city.lon }}>
                <View style={styles.precipMarkerContainer}>
                  <MaterialCommunityIcons 
                    name={isSnow ? 'weather-snowy' : 'weather-rainy'} 
                    size={15} 
                    color={isSnow ? '#43a6f7' : '#1E88E5'} 
                  />
                  <Text style={styles.precipText}>{precipMm.toFixed(1)} мм</Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}

        {CITIES.map(city => {
          const data = weatherData[city.id];
          if (!data) return null;
          const weatherCfg = WEATHER[data.weather];
          
          return (
            <Marker
              key={city.id}
              coordinate={{ latitude: city.lat, longitude: city.lon }}
              title={`${city.name}: ${data.temp}°C`}
              description={`Погода: ${weatherCfg.label}`}
            >
              <View style={styles.weatherBox}>
                <MaterialCommunityIcons name={weatherCfg.icon} size={32} color={weatherCfg.color} />
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
  loadingText: { marginTop: 12, fontSize: 16, color: 'gray' },
  errorText: { fontSize: 16, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  hint: { marginTop: 8, fontSize: 13, color: 'gray' },
  togglesContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 1000,
  },
  layerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 5,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  layerToggleActive: { backgroundColor: '#1E88E5' },
  layerToggleText: { marginLeft: 8, fontSize: 14, color: 'gray', fontWeight: '600' },
  layerToggleTextActive: { color: 'white' },
  weatherBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  precipMarkerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 4,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  precipText: {
    fontSize: 9,
    color: 'black',
    marginTop: 2,
    fontWeight: '700',
  },
});