import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Colors from "../constants/Colors";
import * as Location from "expo-location";
import ActionButton from "../components/ui/ActionButton";

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
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [useManualLocation, setUseManualLocation] = useState(false);

  const db = getFirestore();

  useEffect(() => {
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
      Alert.alert("Permission Denied", "You need to allow location access.");
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
      <Text style={styles.header}>Обери медичний центр</Text>

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
          <Marker coordinate={userLocation} title="Ваше місцезнаходження" pinColor="blue" />
        )}
        {manualLocation && useManualLocation && (
          <Marker coordinate={manualLocation} title="Вибране місце" pinColor="green" />
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
                onPress={() => handleSelectCenter(center)}
              />
            )
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>

      <View style={styles.buttonsContainer}>
        <ActionButton style={styles.button} textStyle={styles.textStyleButton} onPress={() => {
          setUseManualLocation(false);
          getUserLocation();
        }}>
          Використати GPS
        </ActionButton>
        <ActionButton style={[styles.button, { backgroundColor: Colors.primary500 }]} textStyle={styles.textStyleButton} onPress={() => setUseManualLocation(true)}>
          Вибрати місце
        </ActionButton>
      </View>

      <View style={styles.buttonsContainer}>
        <ActionButton style={[styles.button, { backgroundColor: Colors.accent500 }]} onPress={layRoute}>
          Прокласти маршрут
        </ActionButton>
      </View>

      {/* Інформація про вибраний центр */}
      {selectedCenter && (
        <ScrollView style={styles.infoContainer}>
          <Text style={styles.infoHeader}>Інформація про центр</Text>
          <Text style={styles.infoText}><Text style={styles.boldText}>Адреса:</Text> {selectedCenter.address}</Text>
          <Text style={styles.infoText}><Text style={styles.boldText}>Телефон:</Text> {selectedCenter.phone}</Text>
          <Text style={styles.infoText}><Text style={styles.boldText}>Email:</Text> {selectedCenter.email}</Text>
          <ActionButton style={styles.registerButton} onPress={() => Alert.alert("Реєстрація", "Ви зареєструвалися на донацію.")}>
            Зареєструватися на донацію
          </ActionButton>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    fontFamily: "e-Ukraine-B",
    textTransform: "uppercase",
    fontSize: 20,
    color: Colors.accent500,
    textAlign: "center",
    marginVertical: 10,
    marginTop: 64,
    paddingLeft: 18,
  },
  map: {
    height: "40%",
    width: "100%",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 70,
    padding: 4,
  },
  button: {
    height: "100%",
    margin: 4,
    borderRadius: 4,
  },
  textStyleButton: {
    fontFamily: 'e-Ukraine-B',
    fontSize: 13
  },
  infoContainer: {
    padding: 16,
  },
  infoHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: Colors.primary500,
    marginTop: 16,
  },
});

export default MedCentersScreen;




// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import { getFirestore, collection, getDocs } from "firebase/firestore";
// import Colors from "../constants/Colors";
// import * as Location from "expo-location";

// import ActionButton from "../components/ui/ActionButton";

// const fetchRoute = async (start, end) => {
//   try {
//     const response = await fetch(
//       `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
//     );
//     const data = await response.json();
//     if (data.routes.length) {
//       return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
//         latitude: lat,
//         longitude: lng,
//       }));
//     }
//   } catch (error) {
//     console.error("Error fetching route:", error);
//   }
//   return [];
// };

// const MedCentersScreen = () => {
//   const [medicalCenters, setMedicalCenters] = useState([]);
//   const [selectedCenter, setSelectedCenter] = useState(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [manualLocation, setManualLocation] = useState(null);
//   const [routeCoords, setRouteCoords] = useState([]);
//   const [useManualLocation, setUseManualLocation] = useState(false);

//   const db = getFirestore();

//   useEffect(() => {
//     const fetchMedicalCenters = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, "medicalCenters"));
//         const centersData = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           name: doc.data().nameCenter || "Невідомий центр",
//           address: doc.data().address || "Немає адреси",
//           phone: doc.data().phoneCenter || "Немає номера",
//           email: doc.data().email || "Немає email",
//           workingHours: doc.data().workingHours || {},
//           location: doc.data().location || null,
//         }));
//         setMedicalCenters(centersData);
//       } catch (error) {
//         Alert.alert("Помилка", "Не вдалося завантажити медичні центри.");
//       }
//     };

//     fetchMedicalCenters();
//   }, [db]);

//   const getUserLocation = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission Denied", "You need to allow location access.");
//       return;
//     }
//     const location = await Location.getCurrentPositionAsync({});
//     setUserLocation({
//       latitude: location.coords.latitude,
//       longitude: location.coords.longitude,
//     });
//   };

//   const handleSelectCenter = (center) => {
//     setSelectedCenter(center);
//   };
//   const layRoute = async () => {
//     if (!selectedCenter) {
//       Alert.alert("Помилка", "Оберіть медичний центр.");
//       console.log("No center selected");
//       return;
//     }
//     const startLocation = useManualLocation ? manualLocation : userLocation;
//     if (!startLocation) {
//       Alert.alert("Помилка", "Оберіть або введіть місце початку маршруту.");
//       console.log("No start location");
//       return;
//     }
//     console.log(
//       "Fetching route from",
//       startLocation,
//       "to",
//       selectedCenter.location
//     );
//     const route = await fetchRoute(startLocation, selectedCenter.location);
//     setRouteCoords(route);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Обери медичний центр</Text>

//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: 49.8397,
//           longitude: 24.0297,
//           latitudeDelta: 0.1,
//           longitudeDelta: 0.1,
//         }}
//         onPress={(e) => setManualLocation(e.nativeEvent.coordinate)}
//       >
//         {userLocation && !useManualLocation && (
//           <Marker
//             coordinate={userLocation}
//             title="Ваше місцезнаходження"
//             pinColor="blue"
//           />
//         )}
//         {manualLocation && useManualLocation && (
//           <Marker
//             coordinate={manualLocation}
//             title="Вибране місце"
//             pinColor="green"
//           />
//         )}
//         {medicalCenters.map(
//           (center) =>
//             center.location && (
//               <Marker
//                 key={center.id}
//                 coordinate={{
//                   latitude: center.location.latitude,
//                   longitude: center.location.longitude,
//                 }}
//                 title={center.name}
//                 onPress={() => handleSelectCenter(center)}
//               />
//             )
//         )}
//         {routeCoords.length > 0 && (
//           <Polyline
//             coordinates={routeCoords}
//             strokeWidth={4}
//             strokeColor="blue"
//           />
//         )}
//       </MapView>

//       <View style={styles.buttonsContainer}>
//         <ActionButton
//           style={styles.button}
//           onPress={() => {
//             setUseManualLocation(false);
//             getUserLocation();
//           }}
//         >
//           Використати GPS
//         </ActionButton>
//         <ActionButton
//           style={[styles.button, { backgroundColor: Colors.primary500 }]}
//           onPress={() => setUseManualLocation(true)}
//         >
//           Вибрати місце
//         </ActionButton>
//       </View>
//       <View style={styles.buttonsContainer}>
//         <ActionButton
//           style={[styles.button, { backgroundColor: Colors.accent500 }]}
//           onPress={layRoute}
//         >
//           Прокласти маршрут
//         </ActionButton>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.white,
//   },
//   header: {
//     fontFamily: "e-Ukraine-B",
//     textTransform: "uppercase",
//     fontSize: 20,
//     color: Colors.accent500,
//     textAlign: "left",
//     marginVertical: 10,
//     marginTop: 64,
//     padding: 18,
//   },
//   map: {
//     height: "50%",
//     width: "100%",
//   },
//   buttonsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     height: 88,
//     padding: 4,
//   },
//   button: {
//     height: "100%",
//     margin: 4,
//     borderRadius: 4,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 14,
//   },
// });

// export default MedCentersScreen;

// ////////