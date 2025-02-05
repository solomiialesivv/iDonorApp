import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import Colors from "../constants/Colors";
import NeedCard from "../components/ui/NeedCard";

const NeedsScreen = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchNeeds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bloodNeeds"));
        const needsData = [];

        for (const docSnap of querySnapshot.docs) {
          const needData = docSnap.data();
          if (!needData.medicalCenterId?.id) continue;

          const medicalCenterRef = doc(db, "medicalCenters", needData.medicalCenterId.id);
          const medicalCenterSnap = await getDoc(medicalCenterRef);

          if (!medicalCenterSnap.exists()) continue;

          needsData.push({
            id: docSnap.id,
            medicalCenter: medicalCenterSnap.data().nameCenter || "Невідомий центр",
            phone: medicalCenterSnap.data().phoneCenter || "Немає номера",
            email: medicalCenterSnap.data().email || "Немає email",
            bloodGroup: needData.bloodGroup || "Невідома група",
            neededAmount: needData.neededAmount || 0,
            collectedAmount: needData.collectedAmount || 0,
            requestDate: needData.dateOfRequest || null,
            status: needData.status || "Невідомий статус",
          });
        }

        setNeeds(needsData);
      } catch (error) {
        Alert.alert("Помилка", "Не вдалося завантажити потреби.");
      } finally {
        setLoading(false);
      }
    };

    fetchNeeds();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Потреби у крові</Text>
      <FlatList
        data={needs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NeedCard item={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginTop: 64,
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary500,
    marginBottom: 16,
    textAlign: "center",
  },
});

export default NeedsScreen;

////////////


// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
// import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
// import Colors from "../constants/Colors";
// import ActionButton from "../components/ui/ActionButton";

// const NeedsScreen = () => {
//   const [needs, setNeeds] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const db = getFirestore();

//   useEffect(() => {
//     const fetchNeeds = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, "bloodNeeds"));
//         const needsData = [];

//         for (const docSnap of querySnapshot.docs) {
//           const needData = docSnap.data();
//           console.log("Fetched need data:", needData);

//           // Перевіряємо, чи є посилання на медцентр
//           if (!needData.medicalCenterId || typeof needData.medicalCenterId.id !== "string") {
//             console.warn(`Missing or invalid medicalCenterId for document ${docSnap.id}`);
//             continue;
//           }

//           // Отримуємо ID медичного центру
//           const medicalCenterId = needData.medicalCenterId.id;
//           const medicalCenterRef = doc(db, "medicalCenters", medicalCenterId);
//           const medicalCenterSnap = await getDoc(medicalCenterRef);

//           if (!medicalCenterSnap.exists()) {
//             console.warn(`Medical centre not found for ID: ${medicalCenterId}`);
//             continue;
//           }

//           const medicalCentreData = medicalCenterSnap.data() || {};

//           needsData.push({
//             id: docSnap.id,
//             medicalCenter: medicalCentreData.nameCenter || "Невідомий центр",
//             phone: medicalCentreData.phoneCenter || "Немає номера",
//             email: medicalCentreData.email || "Немає email",
//             bloodGroup: needData.bloodGroup || "Невідома група",
//             neededAmount: needData.neededAmount || 0,
//             collectedAmount: needData.collectedAmount || 0,
//             requestDate: needData.dateOfRequest || null,
//             status: needData.status || "Невідомий статус",
//           });
//         }

//         console.log("Fetched needs:", needsData);
//         setNeeds(needsData);
//       } catch (error) {
//         console.error("Error fetching needs: ", error);
//         Alert.alert("Помилка", "Не вдалося завантажити потреби.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchNeeds();
//   }, []);

//   const renderNeedItem = ({ item }) => {
//     const requestDate = item.requestDate ? new Date(item.requestDate.seconds * 1000).toLocaleDateString() : 'Невідома дата';

//     return (
//       <View style={styles.card}>
//         <Text style={styles.title}>{item.medicalCenter}</Text>
//         <Text style={styles.bloodGroup}>Група крові: {item.bloodGroup}</Text>
//         <Text>Потрібно: {item.neededAmount} л</Text>
//         <Text>Зібрано: {item.collectedAmount} л</Text>
//         <Text>Дата запиту: {requestDate}</Text>
//         <Text style={styles.status}>Статус: {item.status}</Text>
//         <ActionButton style={{ marginTop: 12 }}>Запланувати донацію</ActionButton>
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <Text>Завантаження...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Потреби у крові</Text>
//       <FlatList
//         data={needs}
//         keyExtractor={(item) => item.id}
//         renderItem={renderNeedItem}
//       />
//     </View>
//   );
// };

// export default NeedsScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.white,
//     padding: 16,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   header: {
//     marginTop: 64,
//     fontSize: 20,
//     fontWeight: "bold",
//     color: Colors.primary500,
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   card: {
//     backgroundColor: Colors.lightGray,
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 12,
//     elevation: 3,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   bloodGroup: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: Colors.red,
//     marginBottom: 4,
//   },
//   status: {
//     fontWeight: "bold",
//     color: Colors.accent500,
//     marginTop: 4,
//   },
// });


// /////////////////////////
// // import React, { useEffect, useState } from "react";
// // import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
// // import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
// // import Colors from "../constants/Colors";
// // import ActionButton from "../components/ui/ActionButton";

// // const NeedsScreen = () => {
// //   const [needs, setNeeds] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   const db = getFirestore();

// //   useEffect(() => {
// //     const fetchNeeds = async () => {
// //       try {
// //         const querySnapshot = await getDocs(collection(db, "bloodNeeds"));
// //         const needsData = [];

// //         for (const docSnap of querySnapshot.docs) {
// //           const needData = docSnap.data();
// //           const medicalCentreId = needData.medicalCentreId;

// //           const medicalCentreRef = doc(db, "medicalCentres", medicalCentreId);
// //           const medicalCentreSnap = await getDoc(medicalCentreRef);

// //           if (medicalCentreSnap.exists()) {
// //             const medicalCentreData = medicalCentreSnap.data();

// //             needsData.push({
// //               id: docSnap.id,
// //               medicalCenter: medicalCentreData.nameCenter,
// //               phone: medicalCentreData.phoneCenter,
// //               email: medicalCentreData.email,
// //               bloodGroup: needData.bloodGroup,
// //               neededAmount: needData.neededAmount,
// //               collectedAmount: needData.collectedAmount,
// //               requestDate: needData.dateOfRequest,
// //               status: needData.status,
// //             });
// //           }
// //         }

// //         console.log("Fetched needs:", needsData);
// //         setNeeds(needsData);
// //       } catch (error) {
// //         console.error("Error fetching needs: ", error);
// //         Alert.alert("Помилка", "Не вдалося завантажити потреби.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchNeeds();
// //   }, []);

// //   const renderNeedItem = ({ item }) => {
// //     const requestDate = item.requestDate ? new Date(item.requestDate.seconds * 1000).toLocaleDateString() : 'Невідома дата';

// //     return (
// //       <View style={styles.card}>
// //         <Text style={styles.title}>{item.medicalCenter}</Text>
// //         <Text style={styles.bloodGroup}>Група крові: {item.bloodGroup}</Text>
// //         <Text>Потрібно: {item.neededAmount} л</Text>
// //         <Text>Зібрано: {item.collectedAmount} л</Text>
// //         <Text>Дата запиту: {requestDate}</Text>
// //         <Text style={styles.status}>Статус: {item.status}</Text>
// //         <ActionButton style={{ marginTop: 8 }}>Запланувати донацію</ActionButton>
// //       </View>
// //     );
// //   };

// //   if (loading) {
// //     return (
// //       <View style={styles.centered}>
// //         <Text>Завантаження...</Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.header}>Потреби у крові</Text>
// //       <FlatList
// //         data={needs}
// //         keyExtractor={(item) => item.id}
// //         renderItem={renderNeedItem}
// //       />
// //     </View>
// //   );
// // };

// // export default NeedsScreen;

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: Colors.white,
// //     padding: 16,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //   },
// //   header: {
// //     fontSize: 20,
// //     fontWeight: "bold",
// //     color: Colors.primary500,
// //     marginBottom: 16,
// //     textAlign: "center",
// //   },
// //   card: {
// //     backgroundColor: Colors.lightGray,
// //     padding: 16,
// //     borderRadius: 8,
// //     marginBottom: 12,
// //     elevation: 3,
// //   },
// //   title: {
// //     fontSize: 16,
// //     fontWeight: "bold",
// //     marginBottom: 4,
// //   },
// //   bloodGroup: {
// //     fontSize: 14,
// //     fontWeight: "bold",
// //     color: Colors.red,
// //     marginBottom: 4,
// //   },
// //   status: {
// //     fontWeight: "bold",
// //     color: Colors.accent500,
// //     marginTop: 4,
// //   },
// // });

// /////////////////////////////////////////
// // import React, { useEffect, useState } from "react";
// // import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
// // import { getFirestore, collection, getDocs } from "firebase/firestore";
// // import Colors from "../constants/Colors";
// // import ActionButton from "../components/ui/ActionButton";


// // const NeedsScreen = () => {
// //   const [needs, setNeeds] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   const db = getFirestore();

// //   useEffect(() => {
// //     const fetchNeeds = async () => {
// //       try {
// //         const querySnapshot = await getDocs(collection(db, "blood_requests"));
// //         const needsData = querySnapshot.docs.map((doc) => ({
// //           id: doc.id,
// //           ...doc.data(),
// //         }));
// //         console.log("Fetched needs:", needsData); // Логування отриманих даних
// //         setNeeds(needsData);
// //       } catch (error) {
// //         console.error("Error fetching needs: ", error);
// //         Alert.alert("Помилка", "Не вдалося завантажити потреби.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchNeeds();
// //   }, []);

// //   const renderNeedItem = ({ item }) => {
// //     // Convert Firestore Timestamp to a Date object
// //     const requestDate = item.requestDate ? new Date(item.requestDate.seconds * 1000) : null;
  
// //     return (
// //       <View style={styles.card}>
// //         <Text style={styles.title}>{item.medicalCenter}</Text>
// //         <Text>Адреса: {item.address}</Text>
// //         <Text>Потрібно крові: {item.neededAmount} л</Text>
// //         <Text>Зібрано: {item.collectedAmount} л</Text>
// //         {/* Convert date to a string */}
// //         <Text>Дата запиту: {requestDate ? requestDate.toLocaleDateString() : 'Невідома дата'}</Text>
// //         <Text style={styles.status}>Статус: {item.status}</Text>
// //         <ActionButton style={{ marginTop: 8 }}>Запланувати донацію</ActionButton>
// //       </View>
// //     );
// //   };
  

// //   if (loading) {
// //     return (
// //       <View style={styles.centered}>
// //         <Text>Завантаження...</Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.header}>Потреби у крові</Text>
// //       <FlatList
// //         data={needs}
// //         keyExtractor={(item) => item.id}
// //         renderItem={renderNeedItem}
// //       />
// //     </View>
// //   );
// // };

// // export default NeedsScreen;

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: Colors.white,
// //     padding: 16,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //   },
// //   header: {
// //     fontSize: 20,
// //     fontWeight: "bold",
// //     color: Colors.primary500,
// //     marginBottom: 16,
// //     textAlign: "center",
// //   },
// //   card: {
// //     backgroundColor: Colors.lightGray,
// //     padding: 16,
// //     borderRadius: 8,
// //     marginBottom: 12,
// //     elevation: 3,
// //   },
// //   title: {
// //     fontSize: 16,
// //     fontWeight: "bold",
// //     marginBottom: 4,
// //   },
// //   status: {
// //     fontWeight: "bold",
// //     color: Colors.accent500,
// //     marginTop: 4,
// //   },
// // });