import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Colors from "../constants/Colors";
import * as Location from "expo-location";
import PrimaryButton from "../components/ui/PrimaryButton";
import WorkingHoursTable from "../components/ui/WorkingHoursTable";
import { Ionicons } from "@expo/vector-icons";

const fetchRoute = async (start, end) => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (data.routes.length) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
  } catch (error) {
    console.error("Error fetching route:", error);
  }
  return [];
};

const MedCentersScreen = () => {
  const [mapReady, setMapReady] = useState(false);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [useManualLocation, setUseManualLocation] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    setTimeout(() => setMapReady(true), 100);
    
    const fetchMedicalCenters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "medicalCenters"));
        const centersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().nameCenter || "Невідомий центр",
          address: doc.data().address || "Немає адреси",
          phone: doc.data().phoneCenter || "Немає номера",
          email: doc.data().email || "Немає email",
          workingHours: doc.data().workingHours || {},
          location: doc.data().location || null,
        }));
        setMedicalCenters(centersData);
      } catch (error) {
        Alert.alert("Помилка", "Не вдалося завантажити медичні центри.");
      }
    };

    fetchMedicalCenters();
  }, [db]);

  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Дозвіл відхилено", "Потрібно надати доступ до вашої локації.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const handleSelectCenter = (center) => {
    setSelectedCenter(center);
  };

  const layRoute = async () => {
    if (!selectedCenter) {
      Alert.alert("Помилка", "Оберіть медичний центр.");
      return;
    }
    const startLocation = useManualLocation ? manualLocation : userLocation;
    if (!startLocation) {
      Alert.alert("Помилка", "Оберіть або введіть місце початку маршруту.");
      return;
    }
    const route = await fetchRoute(startLocation, selectedCenter.location);
    setRouteCoords(route);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Медичні центри</Text>
      
      <View style={styles.instructionContainer}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
        <Text style={styles.instructionText}>
          Оберіть медичний центр на карті, щоб побачити детальну інформацію
        </Text>
      </View>
      
      {mapReady && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 49.8397,
            longitude: 24.0297,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          onPress={(e) => setManualLocation(e.nativeEvent.coordinate)}
        >
          {userLocation && !useManualLocation && (
            <Marker
              coordinate={userLocation}
              title="Ваше місцезнаходження"
              pinColor={Colors.info}
            >
              <Callout>
                <Text>Ваше місцезнаходження</Text>
              </Callout>
            </Marker>
          )}
          {manualLocation && useManualLocation && (
            <Marker
              coordinate={manualLocation}
              title="Обрана точка"
              pinColor={Colors.success}
            >
              <Callout>
                <Text>Обрана точка</Text>
              </Callout>
            </Marker>
          )}
          {medicalCenters.map(
            (center) =>
              center.location && (
                <Marker
                  key={center.id}
                  coordinate={{
                    latitude: center.location.latitude,
                    longitude: center.location.longitude,
                  }}
                  title={center.name}
                  pinColor={Colors.accent500}
                  onPress={() => handleSelectCenter(center)}
                >
                  <Callout>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{center.name}</Text>
                      <Text style={styles.calloutText}>{center.address}</Text>
                    </View>
                  </Callout>
                </Marker>
              )
          )}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor={Colors.info}
              lineCap="round"
              geodesic={true}
              zIndex={2}
            />
          )}
        </MapView>
      )}
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => {
            setUseManualLocation(false);
            getUserLocation();
          }}
        >
          <Ionicons name="location" size={22} color={Colors.white} />
          <Text style={styles.actionButtonText}>Моя локація</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.routeButton, !selectedCenter && styles.disabledButton]}
          onPress={layRoute}
          disabled={!selectedCenter}
        >
          <Ionicons name="map" size={22} color={Colors.white} />
          <Text style={styles.actionButtonText}>Маршрут</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        {selectedCenter ? (
          <View style={styles.infoContainer}>
            <View style={styles.centerHeaderContainer}>
              <Text style={styles.centerName}>{selectedCenter.name}</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color={Colors.textDark} style={styles.icon} />
                <Text style={styles.infoText}>
                  <Text style={styles.boldText}>Адреса:</Text>{" "}
                  {selectedCenter.address}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color={Colors.textDark} style={styles.icon} />
                <Text style={styles.infoText}>
                  <Text style={styles.boldText}>Телефон:</Text>{" "}
                  {selectedCenter.phone}
                </Text>
              </View>
            </View>
            
            <View style={styles.registerButtonContainer}>
              <PrimaryButton
                style={styles.registerButton}
                textStyle={styles.registerButtonText}
                onPress={() =>
                  Alert.alert(
                    "Запис на донорство",
                    `Ви записуєтесь у ${selectedCenter.name}`
                  )
                }
              >
                Записатися на донацію
              </PrimaryButton>
            </View>
            
            <View style={styles.scheduleContainer}>
              <View style={styles.scheduleHeaderContainer}>
                <Ionicons name="time-outline" size={20} color={Colors.textLight} />
                <Text style={styles.scheduleTitle}>Розклад роботи</Text>
              </View>
              <WorkingHoursTable workingHours={selectedCenter.workingHours} />
            </View>
          </View>
        ) : (
          <View style={styles.noSelectionContainer}>
            <Ionicons name="medical-outline" size={50} color={Colors.primaryLight} />
            <Text style={styles.noSelectionText}>
              Оберіть медичний центр на карті, щоб побачити інформацію та записатися на донацію
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    padding: 16,
  },
  header: {
    fontFamily: "e-Ukraine-B",
    fontSize: 20,
    color: Colors.textLight,
    textAlign: "left",
    marginTop: 64,
    marginBottom: 8,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  instructionText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 13,
    color: Colors.textDark,
    marginLeft: 8,
  },
  map: {
    height: "44%",
    width: "100%",
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  calloutContainer: {
    width: 150,
    padding: 4,
  },
  calloutTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 12,
    color: Colors.accent500,
  },
  calloutText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 10,
    color: Colors.text,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.info,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flex: 1,
    marginRight: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary500,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flex: 1,
    marginLeft: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: Colors.grey300,
    opacity: 0.7,
  },
  actionButtonText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.white,
    marginLeft: 8,
  },
  noSelectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  noSelectionText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  infoContainer: {
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  centerHeaderContainer: {
    marginBottom: 16,
  },
  centerName: {
    fontFamily: "e-Ukraine-B",
    fontSize: 18,
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: Colors.primaryLight,
    width: '44%',
    alignSelf: 'center',
    borderRadius: 1,
  },
  detailsContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "e-Ukraine-L",
    lineHeight: 20,
    flex: 1,
  },
  boldText: {
    fontFamily: "e-Ukraine-B",
    color: Colors.textDark,
  },
  registerButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: Colors.accent500,
    borderRadius: 48,
    maxHeight: 64,
    minWidth: 220,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonText: {
    fontFamily: "e-Ukraine-B",
    fontSize: 15,
    textAlign: 'center',
    color: Colors.white
  },
  scheduleContainer: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    padding: 12,
  },
  scheduleHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 8,
    textAlign: 'center'
  }
});

export default MedCentersScreen;