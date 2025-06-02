// app/(tabs)/saved.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import InitializeTrackingModal from "@/components/InitializeTrackingModal";
import { db } from "@/FirebaseConfig";
import { User, getAuth, onAuthStateChanged } from "firebase/auth";

// Define a type for the saved items
interface SavedItem {
  id: string;
  title: string;
  type: "tv" | "movie"; // Changed from string to strict union type
  poster_path: string;
  [key: string]: any; // For any additional properties
}

export default function SavedScreen() {
  const router = useRouter();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initTrackingModalVisible, setInitTrackingModalVisible] =
    useState(false);
  const [selectedTVShow, setSelectedTVShow] = useState<SavedItem | null>(null);

  // Get auth instance directly to avoid TypeScript errors with the imported auth
  const auth = getAuth();

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchSavedItems(user);
      } else {
        setSavedItems([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSavedItems = async (user: User, isRefreshing = false) => {
    try {
      // Don't show main loading indicator if we're just refreshing
      if (!isRefreshing) {
        setLoading(true);
      }

      const snapshot = await getDocs(
        collection(db, "users", user.uid, "watchlist")
      );
      const items = snapshot.docs.map((doc) => ({
        id: String(doc.id), // Ensure ID is always a string
        ...doc.data(),
      })) as SavedItem[];
      setSavedItems(items);
    } catch (error) {
      console.error("Error fetching saved items:", error);
      Toast.show({
        type: "error",
        text1: "Failed to refresh watchlist",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    if (!currentUser) return;

    setRefreshing(true);
    await fetchSavedItems(currentUser, true);
  };

  const removeFromWatchlist = async (itemId: string) => {
    if (!currentUser) return;

    try {
      // Make sure itemId is a string before proceeding
      const docId = String(itemId);
      await deleteDoc(doc(db, "users", currentUser.uid, "watchlist", docId));

      // Update state to remove the item
      setSavedItems((prevItems) =>
        prevItems.filter((item) => String(item.id) !== docId)
      );

      Toast.show({
        type: "success",
        text1: "Removed from watchlist",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      Toast.show({
        type: "error",
        text1: "Failed to remove item",
      });
    }
  };

  // Only handle watched for movies (to create tickets)
  const handleMovieWatched = async (itemId: string, item: SavedItem) => {
    if (!currentUser) return;

    try {
      // Create a timestamp for when it was marked as watched
      const watchedDate = new Date();

      // Add to tickets collection
      const ticketData = {
        ...item,
        watchedAt: watchedDate,
        type: item.type, // 'movie'
        ticketId: `${item.id}-${Date.now()}`, // Unique ID for the ticket
      };

      // Add ticket to user's tickets collection
      await setDoc(
        doc(db, "users", currentUser.uid, "tickets", String(item.id)),
        ticketData
      );

      // Update the watched count in user profile
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentCount = userData.watchedCount || 0;

        await updateDoc(userRef, {
          watchedCount: currentCount + 1,
        });
      }

      // Remove from watchlist
      await removeFromWatchlist(String(itemId));

      Toast.show({
        type: "success",
        text1: "Movie ticket collected!",
        text2: "Added to your tickets collection",
      });
    } catch (error) {
      console.error("Error adding to tickets:", error);
      Toast.show({
        type: "error",
        text1: "Failed to add to tickets",
      });
    }
  };

  // Handle TV show tracking (automatically start tracking and redirect)
  const handleTVShowTracking = (item: SavedItem) => {
    setSelectedTVShow(item);
    setInitTrackingModalVisible(true);
  };

  // Handle successful tracking initialization
  const handleTrackingInitialized = () => {
    // Refresh the watchlist to remove the tracked item
    if (currentUser) {
      fetchSavedItems(currentUser);
    }

    // Close modal
    setInitTrackingModalVisible(false);

    Toast.show({
      type: "success",
      text1: "Tracking started!",
      text2: "Show added to your tracker",
    });

    // Navigate to tracker screen
    setTimeout(() => {
      router.push("/(tabs)/tracker");
    }, 1000); // Small delay to let the toast show
  };

  if (loading) {
    return (
      <View className="bg-primary flex-1 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#3cab93" />
      </View>
    );
  }

  if (savedItems.length === 0) {
    return (
      <View className="bg-primary flex-1 px-6">
        <StatusBar barStyle="light-content" />
        <View className="w-full flex items-center mt-20 mb-4">
          <Text className="text-white font-bold text-xl">Your Watchlist</Text>
        </View>

        <View className="flex justify-center items-center flex-1">
          <View className="bg-[#172730] p-8 rounded-3xl items-center w-72 border border-[#3cab9340]">
            <View className="bg-[#3cab9320] p-4 rounded-full mb-4">
              <MaterialIcons name="bookmark-border" size={50} color="#3cab93" />
            </View>
            <Text className="text-white font-semibold text-lg text-center mb-2">
              No items saved yet
            </Text>
            <Text className="text-gray text-center text-sm mb-4">
              Movies and TV shows you save will appear here
            </Text>
            <TouchableOpacity
              className="bg-[#3cab93] py-3 px-6 rounded-full"
              onPress={() => router.push("/(tabs)/search")}
            >
              <Text className="text-white font-medium">Discover Content</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-primary flex-1 px-4">
      <StatusBar barStyle="light-content" />

      <View className="w-full flex items-center mt-20 mb-6">
        <Text className="text-white font-bold text-xl">Your Watchlist</Text>
      </View>

      <FlatList
        data={savedItems}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3cab93"]} // Android
            tintColor="#3cab93" // iOS
            title="Pull to refresh" // iOS
            titleColor="#ffffff" // iOS
          />
        }
        renderItem={({ item }) => (
          <View className="mb-4">
            {/* Top highlight bar */}
            <View className="h-1 bg-[#3cab9350] rounded-t-xl" />

            <View className="bg-[#161f24] rounded-b-xl overflow-hidden">
              <TouchableOpacity
                className="flex-row"
                onPress={() =>
                  router.push(
                    `/${item.type === "tv" ? "tvs" : "movies"}/${item.id}`
                  )
                }
              >
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
                  }}
                  className="w-24 h-36"
                  resizeMode="cover"
                />

                <View className="flex-1 p-3 justify-between">
                  <View>
                    <Text className="text-white font-bold text-base">
                      {item.title}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <MaterialIcons
                        name={item.type === "tv" ? "tv" : "movie"}
                        size={14}
                        color="#3cab93"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-gray text-xs">
                        {item.type === "tv" ? "TV Show" : "Movie"}
                      </Text>
                    </View>
                  </View>

                  {/* Conditional Buttons based on content type */}
                  <View className="flex-row gap-2 mt-auto">
                    {item.type === "movie" ? (
                      // For movies: Show "Watched" button to collect ticket
                      <TouchableOpacity
                        className="bg-[#3cab9320] flex-row items-center px-3 py-2 rounded-full"
                        onPress={() =>
                          handleMovieWatched(String(item.id), item)
                        }
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={14}
                          color="#3cab93"
                          style={{ marginRight: 4 }}
                        />
                        <Text className="text-[#3cab93] text-xs font-medium">
                          Watched
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      // For TV shows: Show "Track" button to go to tracker
                      <TouchableOpacity
                        className="bg-[#3cab9320] flex-row items-center px-3 py-2 rounded-full"
                        onPress={() => handleTVShowTracking(item)}
                      >
                        <MaterialIcons
                          name="playlist-add-check"
                          size={14}
                          color="#3cab93"
                          style={{ marginRight: 4 }}
                        />
                        <Text className="text-[#3cab93] text-xs font-medium">
                          Track
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Remove button - same for both */}
                    <TouchableOpacity
                      className="bg-[#e5737320] flex-row items-center px-3 py-2 rounded-full"
                      onPress={() => removeFromWatchlist(String(item.id))}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={14}
                        color="#e57373"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-[#e57373] text-xs font-medium">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Toast />

      {/* Initialize Tracking Modal */}
      {selectedTVShow && (
        <InitializeTrackingModal
          visible={initTrackingModalVisible}
          onClose={() => setInitTrackingModalVisible(false)}
          show={selectedTVShow}
          onTrackingInitialized={handleTrackingInitialized}
        />
      )}
    </View>
  );
}
