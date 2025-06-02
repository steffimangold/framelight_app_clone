import { Genre, getAllGenres } from "@/constants/genres";
import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import Toast from "react-native-toast-message";

// Import our avatar utilities
import {
  AvatarData,
  getAllProfileAvatars,
  getAvatarByIndex,
  getBotttsAvatars,
  getRandomAvatarIndex,
  getThumbsAvatars,
} from "../_utils/avatarUtils";

// Import FavoriteActorCard component
import FavoriteActorCard from "@/components/FavoriteActorCard";

interface UserProfile {
  displayName: string;
  bio: string;
  favoriteGenres: Genre[];
  email: string;
  avatarIndex?: number;
  watchedCount?: number;
  savedCount?: number;
  favoriteActorsCount?: number;
  trackedShowsCount?: number; 
}

interface TicketData {
  id: string;
  title: string;
  poster_path: string;
  type: string;
  watchedAt: any; // Firestore timestamp
  [key: string]: any;
}

interface FavoriteActorData {
  id: string;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  addedAt: any; // Firestore timestamp
}

const MAX_GENRES = 5;

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    favoriteGenres: [],
    email: "",
    watchedCount: 0,
    savedCount: 0,
    favoriteActorsCount: 0,
    trackedShowsCount: 0, 
  });
  const [recentTickets, setRecentTickets] = useState<TicketData[]>([]);
  const [recentFavoriteActors, setRecentFavoriteActors] = useState<
    FavoriteActorData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0);
  const auth = getAuth();

  // Get all avatars once for use in rendering
  const allAvatars = getAllProfileAvatars();
  const botttsAvatars = getBotttsAvatars();
  const thumbsAvatars = getThumbsAvatars();

  // Get all genres from our constants file
  const allGenres = getAllGenres();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.uid);
        fetchRecentTickets(currentUser.uid);
        fetchWatchlistCount(currentUser.uid);
        fetchRecentFavoriteActors(currentUser.uid);
        fetchFavoriteActorsCount(currentUser.uid);
        fetchTrackedShowsCount(currentUser.uid); 
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User profile exists, set data from document
        const userData = userDoc.data();
        setProfile({
          displayName: userData.displayName || "",
          bio: userData.bio || "",
          favoriteGenres: userData.favoriteGenres || [],
          email: user?.email || "",
          avatarIndex: userData.avatarIndex ?? 0,
          watchedCount: userData.watchedCount || 0,
          savedCount: userData.savedCount || 0,
          favoriteActorsCount: userData.favoriteActorsCount || 0,
          trackedShowsCount: userData.trackedShowsCount || 0,
        });
        setSelectedGenres(userData.favoriteGenres || []);
        setSelectedAvatarIndex(userData.avatarIndex ?? 0);
      } else {
        // User profile doesn't exist, create with default values
        const randomIndex = getRandomAvatarIndex();

        setProfile({
          displayName: "",
          bio: "",
          favoriteGenres: [],
          email: user?.email || "",
          avatarIndex: randomIndex,
          watchedCount: 0,
          savedCount: 0,
          favoriteActorsCount: 0,
          trackedShowsCount: 0,
        });

        setSelectedAvatarIndex(randomIndex);

        // Create a new profile document
        await setDoc(userDocRef, {
          displayName: "",
          bio: "",
          favoriteGenres: [],
          email: user?.email || "",
          avatarIndex: randomIndex,
          watchedCount: 0,
          savedCount: 0,
          favoriteActorsCount: 0,
          trackedShowsCount: 0,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTickets = async (userId: string) => {
    try {
      const ticketsRef = collection(db, "users", userId, "tickets");
      const ticketsSnap = await getDocs(ticketsRef);

      const ticketsData = ticketsSnap.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            id: doc.id,
          }) as TicketData
      );

      const sortedTickets = ticketsData
        .sort((a, b) => {
          if (!a.watchedAt || !b.watchedAt) return 0;
          const dateA = a.watchedAt.toDate
            ? a.watchedAt.toDate()
            : new Date(a.watchedAt);
          const dateB = b.watchedAt.toDate
            ? b.watchedAt.toDate()
            : new Date(b.watchedAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 3);

      setRecentTickets(sortedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchWatchlistCount = async (userId: string) => {
    try {
      const watchlistRef = collection(db, "users", userId, "watchlist");
      const watchlistSnap = await getDocs(watchlistRef);

      // Update profile with watchlist count
      await updateDoc(doc(db, "users", userId), {
        savedCount: watchlistSnap.size,
      });

      // Update local state
      setProfile((prev) => ({
        ...prev,
        savedCount: watchlistSnap.size,
      }));
    } catch (error) {
      console.error("Error fetching watchlist count:", error);
    }
  };

  // New function to fetch tracked shows count
  const fetchTrackedShowsCount = async (userId: string) => {
    try {
      const trackedShowsRef = collection(db, "users", userId, "tv_progress_");
      const trackedShowsSnap = await getDocs(trackedShowsRef);

      // Update profile with tracked shows count
      await updateDoc(doc(db, "users", userId), {
        trackedShowsCount: trackedShowsSnap.size,
      });

      // Update local state
      setProfile((prev) => ({
        ...prev,
        trackedShowsCount: trackedShowsSnap.size,
      }));
    } catch (error) {
      console.error("Error fetching tracked shows count:", error);
    }
  };

  // New function to fetch favorite actors
  const fetchRecentFavoriteActors = async (userId: string) => {
    try {
      const actorsRef = collection(db, "users", userId, "favoriteActors");
      const q = query(actorsRef, orderBy("addedAt", "desc"), limit(3)); // Get only the 3 most recent
      const actorsSnap = await getDocs(q);

      const actorsData = actorsSnap.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            id: doc.id,
          }) as FavoriteActorData
      );

      setRecentFavoriteActors(actorsData);
    } catch (error) {
      console.error("Error fetching favorite actors:", error);
    }
  };

  // New function to fetch favorite actors count
  const fetchFavoriteActorsCount = async (userId: string) => {
    try {
      const favoriteActorsRef = collection(
        db,
        "users",
        userId,
        "favoriteActors"
      );
      const favoriteActorsSnap = await getDocs(favoriteActorsRef);

      // Update profile with favorite actors count
      await updateDoc(doc(db, "users", userId), {
        favoriteActorsCount: favoriteActorsSnap.size,
      });

      // Update local state
      setProfile((prev) => ({
        ...prev,
        favoriteActorsCount: favoriteActorsSnap.size,
      }));
    } catch (error) {
      console.error("Error fetching favorite actors count:", error);
    }
  };

  // New function to save avatar immediately
  const saveAvatar = async (avatarIndex: number) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Update only the avatar in Firestore
      await updateDoc(userDocRef, {
        avatarIndex: avatarIndex,
        updatedAt: new Date(),
      });

      // Update local profile state immediately
      setProfile((prev) => ({
        ...prev,
        avatarIndex: avatarIndex,
      }));

      Toast.show({
        type: "success",
        text1: "Avatar updated successfully",
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update avatar",
      });
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);

      // Updated profile data (excluding avatar since it's saved immediately)
      const updatedProfile = {
        displayName: profile.displayName,
        bio: profile.bio,
        favoriteGenres: selectedGenres,
        updatedAt: new Date(),
      };

      await updateDoc(userDocRef, updatedProfile);

      // Update local state
      setProfile({
        ...profile,
        favoriteGenres: selectedGenres,
      });

      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
      });
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear any app state or cached data if needed
      setProfile({
        displayName: "",
        bio: "",
        favoriteGenres: [],
        email: "",
      });
      setSelectedGenres([]);

      // Reset any other state variables to their defaults
      setEditing(false);

      // Navigate to the root/entry point of your app
      router.replace("/");

      Toast.show({
        type: "success",
        text1: "Successfully logged out",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      Toast.show({
        type: "error",
        text1: "Failed to sign out",
      });
    }
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: handleLogout, style: "destructive" },
    ]);
  };

  const toggleGenreSelection = (genre: Genre) => {
    if (selectedGenres.some((g) => g.id === genre.id)) {
      // Remove genre if already selected
      setSelectedGenres(selectedGenres.filter((g) => g.id !== genre.id));
    } else {
      // Add genre if not already selected and under the limit
      if (selectedGenres.length < MAX_GENRES) {
        setSelectedGenres([...selectedGenres, genre]);
      } else {
        Toast.show({
          type: "info",
          text1: `Maximum ${MAX_GENRES} genres`,
          text2: "Please remove a genre before adding another",
        });
      }
    }
  };

  const renderGenreItem = ({ item }: { item: Genre }) => {
    const isSelected = selectedGenres.some((genre) => genre.id === item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleGenreSelection(item)}
        className={`p-3 m-1 rounded-full ${isSelected ? "bg-[#3cab93]" : "bg-[#9d9d9d3d]"}`}
      >
        <Text className="text-white text-center">{item.name}</Text>
      </TouchableOpacity>
    );
  };

  // Modified to use the new avatar structure
  const renderAvatarItem = ({
    item,
    index,
  }: {
    item: AvatarData;
    index: number;
  }) => {
    const isSelected = selectedAvatarIndex === index;

    return (
      <TouchableOpacity
        onPress={() => setSelectedAvatarIndex(index)}
        className={`m-2 rounded-full overflow-hidden ${isSelected ? "border-2 border-[#3cab93]" : ""}`}
        style={{
          width: 70,
          height: 70,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#172730", // Dark background to make avatars stand out
        }}
      >
        <SvgXml xml={item.svg} width={60} height={60} />
      </TouchableOpacity>
    );
  };

  // Handle avatar confirmation
  const handleAvatarConfirm = async () => {
    await saveAvatar(selectedAvatarIndex);
    setAvatarModalVisible(false);
  };

  // Get current avatar based on selected index
  const getCurrentAvatar = () => {
    const avatarIndex = profile.avatarIndex ?? 0;
    return getAvatarByIndex(avatarIndex);
  };

  // Render ticket item for the recent tickets section
  const renderTicketItem = ({ item }: { item: TicketData }) => {
    return (
      <TouchableOpacity
        className="mr-3 w-20"
        onPress={() =>
          router.push(`/${item.type === "tv" ? "tvs" : "movies"}/${item.id}`)
        }
      >
        <View className="rounded-lg overflow-hidden border border-[#3cab9340]">
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
            }}
            className="w-20 h-28"
            resizeMode="cover"
          />
          <View className="absolute top-0 right-0 bg-[#3cab93] px-1.5 py-0.5 rounded-bl-lg">
            <MaterialIcons
              name={item.type === "tv" ? "tv" : "local-movies"}
              size={10}
              color="#fff"
            />
          </View>
        </View>
        <Text className="text-white text-xs mt-1" numberOfLines={1}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="bg-primary flex-1 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#3cab93" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="bg-primary flex-1 px-10 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <Text className="text-white text-xl mb-6">Please sign in</Text>
        <TouchableOpacity
          className="bg-[#3cab93] px-8 py-3 rounded-full"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAvatar = getCurrentAvatar();

  // Return normal mode (not editing)
  if (!editing) {
    return (
      <View className="bg-primary flex-1">
        <StatusBar barStyle="light-content" />

        {/* Header with avatar and name */}
        <View className="bg-[#172730] pt-16 pb-4 px-4">
          <View className="flex-row items-center">
            {/* Avatar - now using SvgXml component */}
            <TouchableOpacity
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#172730", // Dark background for contrast
                overflow: "hidden",
              }}
              onPress={() => setEditing(true)}
            >
              <SvgXml xml={currentAvatar.svg} width={60} height={60} />
            </TouchableOpacity>

            {/* Name and email */}
            <View className="ml-3 flex-1">
              <Text className="text-white text-xl font-bold">
                {profile.displayName || "New User"}
              </Text>
              <Text className="text-gray text-xs">{user.email}</Text>
            </View>

            {/* Edit and logout buttons */}
            <View className="flex-row">
              <TouchableOpacity
                className="bg-[#3cab9320] p-2 rounded-full mr-2"
                onPress={() => setEditing(true)}
              >
                <MaterialIcons name="edit" size={20} color="#3cab93" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#e5737320] p-2 rounded-full"
                onPress={confirmLogout}
              >
                <MaterialIcons name="logout" size={20} color="#e57373" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bio (more highlighted) */}
        {profile.bio ? (
          <View className="bg-[#1a2f36] px-5 py-4 border-b border-t border-[#3cab9350]">
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="format-quote" size={16} color="#3cab93" />
              <Text className="text-[#3cab93] text-xs font-medium ml-1">
                About Me
              </Text>
            </View>
            <Text className="text-white text-sm">{profile.bio}</Text>
          </View>
        ) : null}

        {/* Stats Row */}
        <View className="flex-row justify-around bg-[#161f24] py-3 px-2 border-b border-[#3cab9320]">
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/(tabs)/tracker")}
          >
            <View className="items-center">
              <Text className="text-[#3cab93] text-xl font-bold">
                {profile.trackedShowsCount || 0}
              </Text>
              <Text className="text-gray text-xs">Tracked</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/(tabs)/saved")}
          >
            <View className="items-center">
              <Text className="text-[#3cab93] text-xl font-bold">
                {profile.savedCount || 0}
              </Text>
              <Text className="text-gray text-xs">Saved</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/profile/tickets")}
          >
            <View className="flex-row items-center">
              <Text className="text-[#3cab93] text-xl font-bold mr-1">
                {profile.watchedCount || 0}
              </Text>
              <MaterialIcons name="local-movies" size={14} color="#3cab93" />
            </View>
            <Text className="text-gray text-xs">Tickets</Text>
          </TouchableOpacity>

          {/* Add Favorite Actors count */}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/profile/favorite-actors")}
          >
            <View className="flex-row items-center">
              <Text className="text-[#3cab93] text-xl font-bold mr-1">
                {profile.favoriteActorsCount || 0}
              </Text>
              <MaterialIcons name="people" size={14} color="#3cab93" />
            </View>
            <Text className="text-gray text-xs">Actors</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-4 pt-3">
          {/* Favorite Actors (if any) */}
          {recentFavoriteActors.length > 0 && (
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white text-sm font-medium">
                  Favorite Actors
                </Text>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => router.push("/profile/favorite-actors")}
                >
                  <Text className="text-[#3cab93] text-xs mr-1">See All</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={14}
                    color="#3cab93"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 10 }}
              >
                {recentFavoriteActors.map((actor) => (
                  <FavoriteActorCard
                    key={actor.id}
                    id={actor.id}
                    name={actor.name}
                    profile_path={actor.profile_path}
                    known_for_department={actor.known_for_department}
                    onPress={() => router.push(`/actor/${actor.id}`)}
                    variant="small"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recent Tickets (if any) */}
          {recentTickets.length > 0 && (
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white text-sm font-medium">
                  Recent Tickets
                </Text>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => router.push("/profile/tickets")}
                >
                  <Text className="text-[#3cab93] text-xs mr-1">See All</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={14}
                    color="#3cab93"
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={recentTickets}
                renderItem={renderTicketItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  // Return edit mode
  return (
    <View className="bg-primary flex-1">
      <StatusBar barStyle="light-content" />

      {/* Header in Edit Mode */}
      <View className="bg-[#172730] pt-12 pb-6 px-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white text-lg font-bold">Edit Profile</Text>
          <TouchableOpacity
            onPress={() => {
              setEditing(false);
              setSelectedGenres(profile.favoriteGenres);
              setSelectedAvatarIndex(profile.avatarIndex ?? 0);
            }}
            className="bg-[#9d9d9d3d] p-2 rounded-full"
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar and Name in Edit Mode */}
        <View className="items-center">
          <TouchableOpacity
            onPress={() => setAvatarModalVisible(true)}
            disabled={saving}
            className="relative mb-3"
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#172730", // Dark background
                overflow: "hidden",
              }}
            >
              <SvgXml xml={currentAvatar.svg} width={80} height={80} />
            </View>

            <View className="absolute bottom-0 right-0 bg-[#3cab93] p-1.5 rounded-full">
              <MaterialIcons name="edit" size={15} color="#fff" />
            </View>
          </TouchableOpacity>

          <TextInput
            className="text-white text-xl font-bold text-center w-full"
            value={profile.displayName}
            onChangeText={(text) =>
              setProfile({ ...profile, displayName: text })
            }
            placeholder="Your Name"
            placeholderTextColor="#9d9d9d"
          />
        </View>
      </View>

      {/* Edit Form Fields */}
      <View className="flex-1 px-4 pt-4">
        {/* Bio Field */}
        <View className="mb-4">
          <Text className="text-white text-sm mb-1">Bio</Text>
          <TextInput
            className="text-gray bg-[#9d9d9d2d] p-3 rounded-md"
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="Tell us about yourself"
            placeholderTextColor="#9d9d9d"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Genres Field */}
        <View className="mb-4">
          <Text className="text-white text-sm mb-1">Favorite Genres</Text>
          <TouchableOpacity
            className="bg-[#9d9d9d2d] p-3 rounded-md"
            onPress={() => setGenreModalVisible(true)}
          >
            <Text className="text-gray">
              {selectedGenres.length > 0
                ? selectedGenres.map((g) => g.name).join(", ")
                : `Tap to select up to ${MAX_GENRES} genres`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-[#3cab93] py-3 rounded-full mt-auto mb-80"
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-center">
              Save Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Genre Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={genreModalVisible}
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-[#121212] rounded-t-3xl h-4/5 px-4 pt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Select Genres (Max {MAX_GENRES})
              </Text>
              <TouchableOpacity
                onPress={() => setGenreModalVisible(false)}
                className="bg-[#9d9d9d3d] p-2 rounded-full"
              >
                <MaterialIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray mb-4">
              Selected: {selectedGenres.length}/{MAX_GENRES}
            </Text>

            <FlatList
              data={allGenres}
              renderItem={renderGenreItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              className="mb-4"
            />

            <TouchableOpacity
              className="bg-[#3cab93] p-4 rounded-full mb-8"
              onPress={() => setGenreModalVisible(false)}
            >
              <Text className="text-white text-center font-semibold">
                Confirm Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Avatar Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={avatarModalVisible}
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-[#121212] rounded-t-3xl px-4 pt-6 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Choose Profile Avatar
              </Text>
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(false)}
                className="bg-[#9d9d9d3d] p-2 rounded-full"
              >
                <MaterialIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Display avatars by category */}
            <View className="mb-4">
              <Text className="text-white text-base mb-2">Bottts</Text>
              <FlatList
                data={botttsAvatars}
                renderItem={(props) =>
                  renderAvatarItem({
                    ...props,
                    index: allAvatars.findIndex(
                      (a) =>
                        a.name === props.item.name &&
                        a.style === props.item.style
                    ),
                  })
                }
                keyExtractor={(item) => `${item.name}-${item.style}`}
                numColumns={3}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                className="mb-4"
              />

              <Text className="text-white text-base mb-2 mt-4">Thumbs</Text>
              <FlatList
                data={thumbsAvatars}
                renderItem={(props) =>
                  renderAvatarItem({
                    ...props,
                    index: allAvatars.findIndex(
                      (a) =>
                        a.name === props.item.name &&
                        a.style === props.item.style
                    ),
                  })
                }
                keyExtractor={(item) => `${item.name}-${item.style}`}
                numColumns={3}
                columnWrapperStyle={{ justifyContent: "space-between" }}
              />
            </View>

            <TouchableOpacity
              className="bg-[#3cab93] p-4 rounded-full mt-4"
              onPress={handleAvatarConfirm}
            >
              <Text className="text-white text-center font-semibold">
                Confirm Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

export default Profile;
