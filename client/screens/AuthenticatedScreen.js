import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking
} from "react-native";
import { auth } from "../firebase/firebase";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import Colors from "../constants/Colors";
import StatisticCard from "../components/ui/StatisticCard";
import { useNavigation } from "@react-navigation/native";
import ProfileEditModal from "../components/logic/ProfileEditModal";
import { useUser } from "../store/UserContext";

const db = getFirestore();

const AuthenticatedScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [userDonations, setUserDonations] = useState([]);
  const [nextDonationDate, setNextDonationDate] = useState(null);
  const navigation = useNavigation();
  const { setUser } = useUser();

  // Calculate the next possible donation date (3 months after last donation)
  const calculateNextDonationDate = (lastDonationDate) => {
    if (!lastDonationDate) return null;
    
    const lastDate = new Date(lastDonationDate);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 3); // Add 3 months
    
    return nextDate;
  };

  // Format date to DD.MM.YYYY
  const formatDate = (date) => {
    if (!date) return "Немає даних";
    
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date.seconds) {
      // Handle Firestore Timestamp
      dateObj = new Date(date.seconds * 1000);
    } else {
      // Handle string dates
      dateObj = new Date(date);
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  // Check if next donation date is in the future
  const isEligibleForDonation = (nextDate) => {
    if (!nextDate) return true;
    
    const today = new Date();
    return nextDate <= today;
  };

  // Fetch user's donation history - simplified to avoid index requirement
  const fetchUserDonations = async (userId) => {
    try {
      // Using a simple query without ordering to avoid index requirement
      const donationsQuery = query(
        collection(db, "donations"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(donationsQuery);
      
      if (!querySnapshot.empty) {
        const donations = [];
        querySnapshot.forEach((doc) => {
          donations.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort the donations manually after fetching
        donations.sort((a, b) => {
          const dateA = a.donationDate instanceof Date ? 
            a.donationDate : 
            new Date(a.donationDate?.seconds ? a.donationDate.seconds * 1000 : a.donationDate);
          const dateB = b.donationDate instanceof Date ? 
            b.donationDate : 
            new Date(b.donationDate?.seconds ? b.donationDate.seconds * 1000 : b.donationDate);
          return dateB - dateA; // Sort in descending order (newest first)
        });
        
        setUserDonations(donations);
        
        // Get the last donation date from the most recent donation
        if (donations.length > 0 && donations[0].donationDate) {
          const lastDonationDate = donations[0].donationDate;
          const nextDate = calculateNextDonationDate(
            lastDonationDate instanceof Date ? 
              lastDonationDate : 
              new Date(lastDonationDate.seconds * 1000)
          );
          
          setNextDonationDate(nextDate);
        }
      }
    } catch (error) {
      console.error("Error fetching user donations:", error);
      // Don't rethrow the error - just log it
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    const docRef = doc(db, "users", userId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        setUserData((prevData) => ({
          ...prevData,
          ...userData,
        }));
        
        // After fetching user data, fetch their donations
        await fetchUserDonations(userId);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize component and fetch data
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserData({
        userName: currentUser.displayName || "Невідомий користувач",
        email: currentUser.email,
        uid: currentUser.uid,
      });

      setUser(currentUser);
      fetchUserData(currentUser.uid);
    } else {
      setLoading(false);
      Alert.alert("Помилка", "Користувач не знайдений.");
    }
  }, []);

  // Handle user logout
  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        Alert.alert("Успіх", "Ви вийшли з акаунта.");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      })
      .catch((error) => {
        Alert.alert("Помилка", error.message);
      });
  };

  // Handle modal close
  const handleModalClose = (dataUpdated = false) => {
    setModalVisible(false);
    if (dataUpdated) {
      // Update user profile data after editing
      const currentUser = auth.currentUser;
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    }
  };
  
  // Handle navigation to Map screen
  const navigateToMaps = () => {
    // Using navigation method appropriate for nested navigators
    navigation.navigate('Мапи');
  };
  
  // Handle navigation to Needs screen
  const navigateToNeeds = () => {
    navigation.navigate('Потреби');
  };
  
  // Handle navigation to Planning screen
  const navigateToPlanning = () => {
    navigation.navigate('Планування');
  };

  // // Create Firestore index if needed
  // const createFirestoreIndex = () => {
  //   Linking.openURL('https://console.firebase.google.com/v1/r/project/idonor-6b2c1/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9pZG9ub3ItNmIyYzEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2RvbmF0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoQCgxkb25hdGlvbkRhdGUQAhoMCghfX25hbWVfXxAC');
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent500} />
        <Text style={styles.loadingText}>Завантаження даних...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.rootContainer}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userData?.userName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            <Text style={styles.userName}>Вітаємо, {userData?.userName}!</Text>
          </View>
          
          <View style={styles.headerButtonsContainer}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="pencil" size={18} color={Colors.primary500} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.accent500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Blood Type Indicator - if available */}
        {userData?.bloodType && (
          <View style={styles.bloodTypeIndicator}>
            <Ionicons name="water" size={18} color={Colors.accent500} />
            <Text style={styles.bloodTypeText}>
              Група крові: <Text style={styles.bloodTypeValue}>{userData.bloodType}</Text>
            </Text>
          </View>
        )}
        
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerTitle}>Хочете задонатити свою кров?</Text>
          <Image
            source={require("../assets/images/donate_savelife.png")}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Primary Action */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={navigateToMaps}
        >
          <Ionicons name="location" size={22} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Перейти до медцентрів</Text>
        </TouchableOpacity>
        
        {/* Secondary Actions */}
        <View style={styles.secondaryActionsContainer}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={navigateToNeeds}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="medkit-outline" size={32} color={Colors.primary500} />
            </View>
            <Text style={styles.secondaryButtonText}>Переглянути потреби</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={navigateToPlanning}
          >
            <View style={[styles.buttonIconContainer, styles.planningIcon]}>
              <Ionicons name="calendar-outline" size={32} color={Colors.primary500} />
            </View>
            <Text style={styles.secondaryButtonText}>Запланувати донацію</Text>
          </TouchableOpacity>
        </View>
        
        {/* Statistics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="stats-chart" size={20} color={Colors.accent500} />
            <Text style={styles.sectionTitle}>Ваша статистика</Text>
          </View>
          
          <View style={styles.statisticsContainer}>
            <StatisticCard
              title="К-сть донацій крові"
              iconName="water"
              iconColor={Colors.accent500}
              count={userData?.donationAmount?.toString() || "0"}
            />
            <StatisticCard
              title="К-сть крові в літрах"
              iconName="flask"
              iconColor={Colors.primary500}
              count={userData?.bloodLiters?.toString() || "0"}
            />
          </View>

          {/* Donation Timeline Section */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary500} />
              <View style={styles.timelineTextContainer}>
                <Text style={styles.timelineLabel}>Остання донація:</Text>
                <Text style={styles.timelineValue}>
                  {userData?.lastDonation ? formatDate(userData.lastDonation) : "Немає донацій"}
                </Text>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <Ionicons 
                name={isEligibleForDonation(nextDonationDate) ? "checkmark-circle" : "calendar"} 
                size={20} 
                color={isEligibleForDonation(nextDonationDate) ? Colors.success : Colors.accent500} 
              />
              <View style={styles.timelineTextContainer}>
                <Text style={styles.timelineLabel}>Наступна можлива донація:</Text>
                <Text style={[
                  styles.timelineValue, 
                  isEligibleForDonation(nextDonationDate) && styles.eligibleText
                ]}>
                  {nextDonationDate ? formatDate(nextDonationDate) : "Можлива зараз"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Donations Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="list" size={20} color={Colors.accent500} />
            <Text style={styles.sectionTitle}>Ваші останні донації</Text>
          </View>
          
          {userDonations.length > 0 ? (
            <View style={styles.donationsListContainer}>
              {userDonations.slice(0, 3).map((donation, index) => (
                <View key={donation.id} style={styles.donationItem}>
                  <View style={styles.donationDateContainer}>
                    <Text style={styles.donationDate}>
                      {formatDate(donation.donationDate)}
                    </Text>
                  </View>
                  <View style={styles.donationDetails}>
                    <Text style={styles.donationCenter}>
                      {donation.medicalCenterName || "Медичний центр"}
                    </Text>
                    <View style={styles.donationQuantityContainer}>
                      <Ionicons name="water" size={16} color={Colors.primary500} />
                      <Text style={styles.donationQuantity}>
                        {donation.quantityML || 0} мл
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.donationStatus, 
                    donation.status === "completed" ? 
                      styles.completedStatus : 
                      donation.status === "in process" ? 
                        styles.processingStatus : 
                        styles.pendingStatus
                  ]}>
                    <Text style={styles.donationStatusText}>
                      {donation.status === "completed" ? 
                        "Завершено" : 
                        donation.status === "in process" ? 
                          "В процесі" : 
                          "Очікує"}
                    </Text>
                  </View>
                </View>
              ))}
              
              {userDonations.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate("Історія донацій")}
                >
                  <Text style={styles.viewAllText}>Переглянути всі донації</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.accent500} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyDonationsContainer}>
              <Ionicons name="water-outline" size={40} color={Colors.grey300} />
              <Text style={styles.emptyDonationsText}>
                У вас ще немає донацій. Зробіть першу донацію, щоб рятувати життя.
              </Text>
              <TouchableOpacity 
                style={styles.startDonatingButton}
                onPress={navigateToPlanning}
              >
                <Text style={styles.startDonatingText}>Запланувати донацію</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {/* Модальне вікно для редагування профілю */}
      <ProfileEditModal 
        visible={modalVisible}
        onClose={handleModalClose}
        userData={userData}
      />
    </ScrollView>
  );
};

export default AuthenticatedScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  rootContainer: {
    flex: 1,
    width: "95%",
    maxWidth: 500,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    alignSelf: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundAlt,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "e-Ukraine-L",
    fontSize: 16,
    color: Colors.text,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey200,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontFamily: "e-Ukraine-B",
    fontSize: 22,
    color: Colors.accent500,
  },
  userName: {
    fontFamily: "e-Ukraine-M",
    fontSize: 18,
    color: Colors.textDark,
    flex: 1,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  bloodTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  bloodTypeText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  bloodTypeValue: {
    fontFamily: "e-Ukraine-B",
    color: Colors.accent500,
  },
  bannerContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.white,
    backgroundColor: Colors.primary500,
    padding: 12,
    paddingLeft: 16,
  },
  bannerImage: {
    width: "100%",
    height: 120,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent500,
    borderRadius: 30,
    paddingVertical: 14,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  primaryButtonText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.white,
    marginLeft: 10,
  },
  secondaryActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  secondaryButton: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    height: 140,
  },
  buttonIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  planningIcon: {
    backgroundColor: Colors.primaryLight,
  },
  secondaryButtonText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.textDark,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.accent500,
    marginLeft: 8,
  },
  statisticsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timelineContainer: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  timelineTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  timelineLabel: {
    fontFamily: "e-Ukraine-L",
    fontSize: 12,
    color: Colors.inactiveDark,
  },
  timelineValue: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.textDark,
  },
  eligibleText: {
    color: Colors.success,
  },
  donationsListContainer: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    padding: 8,
  },
  donationItem: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    alignItems: "center",
  },
  donationDateContainer: {
    marginRight: 10,
  },
  donationDate: {
    fontFamily: "e-Ukraine-M",
    fontSize: 12,
    color: Colors.inactiveDark,
  },
  donationDetails: {
    flex: 1,
  },
  donationCenter: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 4,
  },
  donationQuantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  donationQuantity: {
    fontFamily: "e-Ukraine-L",
    fontSize: 12,
    color: Colors.text,
    marginLeft: 4,
  },
  donationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  completedStatus: {
    backgroundColor: "#E8F5E9", // Light green
  },
  processingStatus: {
    backgroundColor: "#FFF3E0", // Light orange
  },
  pendingStatus: {
    backgroundColor: "#E3F2FD", // Light blue
  },
  donationStatusText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 10,
    color: Colors.textDark,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.accent500,
    marginRight: 4,
  },
  emptyDonationsContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
  },
  emptyDonationsText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.textDark,
    textAlign: "center",
    marginVertical: 12,
  },
  startDonatingButton: {
    backgroundColor: Colors.accent500,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 8,
  },
  startDonatingText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.white,
  },
  success: {
    color: "#4CAF50", // Green color for success state
  },
});