import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
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
  sunny: { icon: 'weather-sunny', color: '#FFB300', label: 'Ясно ☀️' },
  rainy: { icon: 'weather-rainy', color: '#1E88E5', label: 'Дождь 🌧️' },
  cloudy: { icon: 'weather-cloudy', color: '#78909C', label: 'Облачно ☁️' },
  snowy: { icon: 'weather-snowy', color: '#42A5F5', label: 'Снег ❄️' },
};

const OWM_TO_WEATHER = {
  '01d': 'sunny',
  '01n': 'sunny',
  '02d': 'cloudy',
  '02n': 'cloudy',
  '03d': 'cloudy',
  '03n': 'cloudy',
  '04d': 'cloudy',
  '04n': 'cloudy',
  '09d': 'rainy',
  '09n': 'rainy',
  '10d': 'rainy',
  '10n': 'rainy',
  '11d': 'rainy',
  '11n': 'rainy',
  '13d': 'snowy',
  '13n': 'snowy',
  '50d': 'cloudy',
  '50n': 'cloudy',
};

const getTempColor = (temp) => {
  if (temp < 0) return '#2196F3';
  if (temp < 10) return '#4FC3F7';
  if (temp < 20) return '#8BC34A';
  if (temp < 30) return '#FF9800';
  return 'red';
};

const getPrecipRadius = (mm) => {
  if (mm < 0.5) return 12000;
  if (mm < 2) return 25000;
  if (mm < 5) return 40000;
  return 55000;
};

const getPressureColor = (pressure) => {
  if (pressure < 980) return '#7B1FA2';
  if (pressure < 1000) return '#1976D2';
  if (pressure < 1020) return '#388E3C';
  if (pressure < 1040) return '#F57C00';
  return 'red';
};

const API_KEY = 'c04aaf45ed5b032e280a635805e2ad4e';

const getAllMarkersRegion = () => {
  const lats = CITIES.map((c) => c.lat);
  const lons = CITIES.map((c) => c.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: (maxLat - minLat) * 1.5,
    longitudeDelta: (maxLon - minLon) * 1.5,
  };
};

export default function App() {
  const mapRef = useRef(null);
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPrecipitation, setShowPrecipitation] = useState(false);
  const [showWind, setShowWind] = useState(false);
  const [showClouds, setShowClouds] = useState(false);
  const [showPressure, setShowPressure] = useState(false);

  const goToCenter = () => {
    const moscow = CITIES.find(c => c.id === 1);
    if (!moscow) return;
    mapRef.current?.animateToRegion({
      latitude: moscow.lat,
      longitude: moscow.lon,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }, 500);
  };

  const showAllMarkers = () => {
    const region = getAllMarkersRegion();
    mapRef.current?.animateToRegion(region, 500);
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const results = {};

        for (const city of CITIES) {
          try {
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric&lang=ru`,
            );

            if (!response.ok) {
              results[city.id] = { notFound: true };
              continue;
            }

            const data = await response.json();
            const weatherCode = data.weather[0].icon;
            const weatherKey = OWM_TO_WEATHER[weatherCode] || 'cloudy';

            results[city.id] = {
              temp: Math.round(data.main.temp),
              weather: weatherKey,
              description: data.weather[0].description,
              rain: data.rain?.['1h'] || 0,
              snow: data.snow?.['1h'] || 0,
              windSpeed: data.wind.speed,
              windDeg: data.wind.deg,
              clouds: data.clouds?.all || 0,
              pressure: data.main.pressure,
            };
          } catch {
            results[city.id] = { notFound: true };
          }
        }

        setWeatherData(results);
      } catch (err) {
        setError(err.message);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.leftButtons}>
        <TouchableOpacity style={styles.centerButton} onPress={goToCenter}>
          <MaterialCommunityIcons name="target" size={20} color="black" />
          <Text style={styles.centerButtonText}>В центр</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerButton} onPress={showAllMarkers}>
          <MaterialCommunityIcons name="map-marker-multiple" size={20} color="black" />
          <Text style={styles.centerButtonText}>Все маркеры</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.togglesContainer}>
        <TouchableOpacity
          style={[
            styles.layerToggle,
            showTemperature && styles.layerToggleActive,
          ]}
          onPress={() => setShowTemperature(!showTemperature)}>
          <MaterialCommunityIcons
            name={showTemperature ? 'thermometer' : 'thermometer-outline'}
            size={20}
            color={showTemperature ? 'white' : 'gray'}
          />
          <Text
            style={[
              styles.layerToggleText,
              showTemperature && styles.layerToggleTextActive,
            ]}>
            Темп.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.layerToggle,
            showPrecipitation && styles.layerToggleActive,
          ]}
          onPress={() => setShowPrecipitation(!showPrecipitation)}>
          <MaterialCommunityIcons
            name={showPrecipitation ? 'umbrella' : 'umbrella-outline'}
            size={20}
            color={showPrecipitation ? 'white' : 'gray'}
          />
          <Text
            style={[
              styles.layerToggleText,
              showPrecipitation && styles.layerToggleTextActive,
            ]}>
            Осадки
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.layerToggle, showWind && styles.layerToggleActive]}
          onPress={() => setShowWind(!showWind)}>
          <MaterialCommunityIcons
            name={showWind ? 'weather-windy' : 'weather-windy-variant'}
            size={20}
            color={showWind ? 'white' : 'gray'}
          />
          <Text
            style={[
              styles.layerToggleText,
              showWind && styles.layerToggleTextActive,
            ]}>
            Ветер
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.layerToggle, showClouds && styles.layerToggleActive]}
          onPress={() => setShowClouds(!showClouds)}>
          <MaterialCommunityIcons
            name={showClouds ? 'cloud' : 'cloud-outline'}
            size={20}
            color={showClouds ? 'white' : 'gray'}
          />
          <Text
            style={[
              styles.layerToggleText,
              showClouds && styles.layerToggleTextActive,
            ]}>
            Облака
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.layerToggle, showPressure && styles.layerToggleActive]}
          onPress={() => setShowPressure(!showPressure)}>
          <MaterialCommunityIcons
            name={showPressure ? 'gauge' : 'gauge-empty'}
            size={20}
            color={showPressure ? 'white' : 'gray'}
          />
          <Text
            style={[
              styles.layerToggleText,
              showPressure && styles.layerToggleTextActive,
            ]}>
            Давление
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: CITIES.find(c => c.id === 1)?.lat ?? 55.7558,
          longitude: CITIES.find(c => c.id === 1)?.lon ?? 37.6173,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}>
        {showTemperature &&
          CITIES.map((city) => {
            const data = weatherData[city.id];
            if (!data || data.notFound) return null;
            return (
              <Circle
                key={`temp-${city.id}`}
                center={{ latitude: city.lat, longitude: city.lon }}
                radius={30000}
                fillColor={`${getTempColor(data.temp)}73`}
                strokeColor="rgba(0,0,0,0.15)"
                strokeWidth={1}
              />
            );
          })}

        {showPrecipitation &&
          CITIES.map((city) => {
            const data = weatherData[city.id];
            if (!data || data.notFound) return null;
            const precipMm = data.rain || data.snow || 0;
            if (precipMm < 0.1) return null;
            const isSnow = data.snow > 0;
            return (
              <React.Fragment key={`precip-${city.id}`}>
                <Circle
                  center={{ latitude: city.lat, longitude: city.lon }}
                  radius={getPrecipRadius(precipMm)}
                  fillColor={
                    isSnow ? 'rgba(255,255,255,0.6)' : 'rgba(30,136,229,0.45)'
                  }
                  strokeColor={
                    isSnow ? 'rgba(215,215,215,0.7)' : 'rgba(30,136,229,0.8)'
                  }
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{
                    latitude: city.lat - 0.025,
                    longitude: city.lon,
                  }}>
                  <View style={styles.precipMarkerContainer}>
                    <MaterialCommunityIcons
                      name={isSnow ? 'weather-snowy' : 'weather-rainy'}
                      size={15}
                      color={isSnow ? '#43a6f7' : '#1E88E5'}
                    />
                    <Text style={styles.precipText}>
                      {precipMm.toFixed(1)} мм
                    </Text>
                  </View>
                </Marker>
              </React.Fragment>
            );
          })}

        {showWind &&
          CITIES.map((city) => {
            const data = weatherData[city.id];
            if (!data || data.notFound) return null;
            return (
              <Marker
                key={`wind-${city.id}`}
                coordinate={{
                  latitude: city.lat + 0.025,
                  longitude: city.lon,
                }}>
                <View style={styles.windMarkerContainer}>
                  <View
                    style={[
                      styles.windArrow,
                      {
                        transform: [
                          { rotate: `${data.windDeg || 0}deg` },
                        ],
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="arrow-up"
                      size={14}
                      color="red"
                    />
                  </View>
                  <Text style={styles.windText}>
                    {data.windSpeed.toFixed(1)} м/с
                  </Text>
                </View>
              </Marker>
            );
          })}

        {showClouds &&
          CITIES.map((city) => {
            const data = weatherData[city.id];
            if (!data || data.notFound) return null;
            const clouds = data.clouds;
            if (clouds < 10) return null;
            const opacity = Math.max(0.15, Math.min(0.7, clouds / 100));
            return (
              <Circle
                key={`clouds-${city.id}`}
                center={{ latitude: city.lat, longitude: city.lon }}
                radius={35000}
                fillColor={`rgba(200, 200, 200, ${opacity})`}
                strokeColor="rgba(180, 180, 180, 0.3)"
                strokeWidth={1}
              />
            );
          })}

        {showPressure &&
          CITIES.map((city) => {
            const data = weatherData[city.id];
            if (!data || data.notFound) return null;
            const pressure = data.pressure;
            const pressureColor = getPressureColor(pressure);
            return (
              <React.Fragment key={`pressure-${city.id}`}>
                <Circle
                  center={{ latitude: city.lat, longitude: city.lon }}
                  radius={40000}
                  fillColor={`${pressureColor}40`}
                  strokeColor={`${pressureColor}80`}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{
                    latitude: city.lat - 0.03,
                    longitude: city.lon,
                  }}>
                  <View style={styles.pressureMarkerContainer}>
                    <Text style={styles.pressureText}>
                      {pressure}
                    </Text>
                  </View>
                </Marker>
              </React.Fragment>
            );
          })}

        {CITIES.map((city) => {
          const data = weatherData[city.id];

          if (data?.notFound) {
            return (
              <Marker
                key={city.id}
                coordinate={{ latitude: city.lat, longitude: city.lon }}>
                <View style={styles.weatherBox}>
                  <Text style={styles.notFoundText}>
                    город {city.name} не найден
                  </Text>
                </View>
              </Marker>
            );
          }

          if (!data) return null;
          return (
            <Marker
              key={city.id}
              coordinate={{ latitude: city.lat, longitude: city.lon }}
              title={`${city.name}: ${data.temp}°C`}
              description={`Погода: ${WEATHER[data.weather].label}`}>
              <View style={styles.weatherBox}>
                <MaterialCommunityIcons
                  name={WEATHER[data.weather].icon}
                  size={32}
                  color={WEATHER[data.weather].color}
                />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: 'gray' },
  errorText: { fontSize: 16, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  hint: { marginTop: 8, fontSize: 13, color: 'gray' },
  leftButtons: {
    position: 'absolute',
    top: 10,
    left: 10,
    alignItems: 'flex-start',
    gap: 10,
    zIndex: 1000,
  },
  centerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 5,
  },
  centerButtonText: { marginLeft: 6, fontSize: 14, color: 'black', fontWeight: '600' },
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
  },
  layerToggleActive: { backgroundColor: '#1E88E5' },
  layerToggleText: { marginLeft: 8, fontSize: 14, color: 'gray', fontWeight: '600' },
  layerToggleTextActive: { color: 'white' },
  weatherBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
    elevation: 4,
  },
  notFoundText: { fontSize: 11, color: 'red', textAlign: 'center', fontWeight: '600' },
  precipMarkerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 4,
    elevation: 3,
  },
  precipText: { fontSize: 9, color: 'black', marginTop: 2, fontWeight: '700' },
  windMarkerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 4,
    elevation: 3,
  },
  windArrow: { marginBottom: 2 },
  windText: { fontSize: 9, color: 'black', fontWeight: '700' },
  pressureMarkerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 4,
    elevation: 3,
  },
  pressureText: { fontSize: 12, color: 'black', fontWeight: '700' },
});