// app/(tabs)/tracker.tsx
import EpisodeModal from "@/components/EpisodeModal";
import InitializeTrackingModal from "@/components/InitializeTrackingModal";
import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface TrackedShow {
  id: string;
  show_info: {
    id: number;
    title: string;
    poster_path: string | null;
    total_seasons: number;
    total_episodes: number;
  };
  current_season: number;
  current_episode: number;
  last_watched: any;
  status: "watching" | "completed" | "dropped";
  seasons: {
    [key: string]: {
      episodes_watched: number[];
      total_episodes: number;
    };
  };
}

// Define watchlist item interface to include the type property
interface WatchlistItem {
  id: string | number;
  title: string;
  poster_path: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  type: "movie" | "tv";
  addedAt: any;
}

export default function TrackerScreen() {
  const [trackedShows, setTrackedShows] = useState<TrackedShow[]>([]);
  const [watchlistShows, setWatchlistShows] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh
  const [selectedShow, setSelectedShow] = useState<TrackedShow | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [initTrackingModalVisible, setInitTrackingModalVisible] =
    useState(false);
  const [selectedWatchlistItem, setSelectedWatchlistItem] =
    useState<WatchlistItem | null>(null);
  const router = useRouter();
  const auth = getAuth();
  const screenWidth = Dimensions.get("window").width;

  // Function to get filtered shows by status
  const getShowsByStatus = (status: "watching" | "completed") => {
    return trackedShows.filter((show) => show.status === status);
  };

  const watchingShows = getShowsByStatus("watching");
  const completedShows = getShowsByStatus("completed");

  useEffect(() => {
    fetchData();
  }, []);

  // Combined fetch function for both tracked shows and watchlist
  const fetchData = async (isRefreshing = false) => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }

    try {
      // Don't show main loading indicator if we're just refreshing
      if (!isRefreshing) {
        setLoading(true);
      }

      // Fetch tracked shows
      await fetchTrackedShows();

      // Fetch watchlist items
      await fetchWatchlistItems();
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  const fetchTrackedShows = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const progressRef = collection(db, "users", user.uid, "tv_progress_");
      const q = query(
        progressRef,
        where("status", "in", ["watching", "completed"]),
        orderBy("last_watched", "desc")
      );
      const progressSnap = await getDocs(q);

      const shows = progressSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TrackedShow[];

      setTrackedShows(shows);
    } catch (error) {
      console.error("Error fetching tracked shows:", error);
    }
  };

  // New function to fetch watchlist items that aren't being tracked
  const fetchWatchlistItems = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get all watchlist items
      const watchlistRef = collection(db, "users", user.uid, "watchlist");
      const watchlistSnap = await getDocs(watchlistRef);

      // Filter out TV shows only
      const allWatchlistItems = watchlistSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WatchlistItem[];

      // Get IDs of shows already being tracked
      const trackedIds = new Set(trackedShows.map((show) => show.id));

      // Filter watchlist to only include items not already tracked
      const filteredWatchlist = allWatchlistItems.filter(
        (item) => item.type === "tv" && !trackedIds.has(item.id.toString())
      );

      setWatchlistShows(filteredWatchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  };

  const calculateProgress = (show: TrackedShow) => {
    const totalWatched = Object.values(show.seasons).reduce(
      (total, season) => total + season.episodes_watched.length,
      0
    );
    const totalEpisodes = show.show_info.total_episodes;
    const percentage =
      totalEpisodes > 0 ? (totalWatched / totalEpisodes) * 100 : 0;

    return {
      watched: totalWatched,
      total: totalEpisodes,
      percentage: Math.round(percentage),
    };
  };

  const getCurrentSeasonProgress = (show: TrackedShow) => {
    const currentSeasonKey = show.current_season.toString();
    const currentSeason = show.seasons[currentSeasonKey];

    if (!currentSeason) return { watched: 0, total: 0, percentage: 0 };

    const watched = currentSeason.episodes_watched.length;
    const total = currentSeason.total_episodes;
    const percentage = total > 0 ? (watched / total) * 100 : 0;

    return {
      watched,
      total,
      percentage: Math.round(percentage),
    };
  };

  const handleShowMenu = (show: TrackedShow) => {
    const actions: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }> = [
      {
        text: "Cancel",
        style: "cancel",
      },
    ];

    // Only show "Mark as Completed" option if show is not already completed
    if (show.status !== "completed") {
      actions.push({
        text: "Mark as Completed",
        onPress: () => markAsCompleted(show),
      });
    } else {
      actions.push({
        text: "Mark as Watching",
        onPress: () => markAsWatching(show),
      });
    }

    // Always show remove option
    actions.push({
      text: "Remove from Tracker",
      style: "destructive",
      onPress: () => removeFromTracker(show),
    });

    Alert.alert(show.show_info.title, "What would you like to do?", actions);
  };

  const markAsCompleted = async (show: TrackedShow) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get the progressRef for updating
      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);

      // Clone the seasons data to modify
      const updatedSeasons = { ...show.seasons };

      // Mark all episodes as watched in all seasons
      Object.keys(updatedSeasons).forEach((seasonKey) => {
        const season = updatedSeasons[seasonKey];
        if (season) {
          // Create an array with all episode numbers from 1 to total_episodes
          const allEpisodes = Array.from(
            { length: season.total_episodes },
            (_, i) => i + 1
          );

          // Update the episodes_watched array to include all episodes
          updatedSeasons[seasonKey].episodes_watched = allEpisodes;
        }
      });

      // Update Firestore with all episodes marked as watched and status set to "completed"
      await updateDoc(progressRef, {
        status: "completed",
        last_watched: new Date(),
        seasons: updatedSeasons,
      });

      // Update local state
      setTrackedShows((prev) =>
        prev.map((s) =>
          s.id === show.id
            ? {
                ...s,
                status: "completed" as const,
                seasons: updatedSeasons,
              }
            : s
        )
      );

      Toast.show({
        type: "success",
        text1: "Marked as completed!",
        text2: "All episodes marked as watched",
      });
    } catch (error) {
      console.error("Error marking as completed:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update status",
      });
    }
  };

  const markAsWatching = async (show: TrackedShow) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);
      await updateDoc(progressRef, {
        status: "watching",
        last_watched: new Date(),
      });

      setTrackedShows((prev) =>
        prev.map((s) =>
          s.id === show.id ? { ...s, status: "watching" as const } : s
        )
      );

      Toast.show({
        type: "success",
        text1: "Moved back to watching!",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update status",
      });
    }
  };

  const removeFromTracker = async (show: TrackedShow) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);
      await deleteDoc(progressRef);

      setTrackedShows((prev) => prev.filter((s) => s.id !== show.id));

      Toast.show({
        type: "info",
        text1: "Removed from tracker",
      });
    } catch (error) {
      console.error("Error removing from tracker:", error);
      Toast.show({
        type: "error",
        text1: "Failed to remove show",
      });
    }
  };

  const openEpisodeSheet = (show: TrackedShow) => {
    console.log("Opening episode sheet for:", {
      id: show.id,
      title: show.show_info.title,
      seasons: Object.keys(show.seasons || {}).length,
      current: `S${show.current_season}E${show.current_episode}`,
    });

    setSelectedShow(show);
    setBottomSheetVisible(true);
  };

  // New function to open the initialize tracking modal
  const openInitTrackingModal = (watchlistItem: WatchlistItem) => {
    setSelectedWatchlistItem(watchlistItem);
    setInitTrackingModalVisible(true);
  };

  // Handle successful tracking initialization
  const handleTrackingInitialized = () => {
    // Refresh data
    fetchData();

    // Close modal
    setInitTrackingModalVisible(false);

    Toast.show({
      type: "success",
      text1: "Show added to tracker!",
    });
  };

  const renderShowCard = (show: TrackedShow) => {
    const progress = calculateProgress(show);
    const seasonProgress = getCurrentSeasonProgress(show);

    return (
      <View
        key={show.id}
        className="bg-[#161f24] rounded-lg p-4 mb-4 border border-[#3cab9340]"
      >
        <View className="flex-row">
          {/* Poster */}
          <Image
            source={
              show.show_info.poster_path
                ? {
                    uri: `https://image.tmdb.org/t/p/w185${show.show_info.poster_path}`,
                  }
                : require("@/assets/images/poster-placeholder.png")
            }
            className="w-20 h-28 rounded-md mr-4"
            resizeMode="cover"
          />

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-2">
              <Text
                className="text-white font-bold text-lg flex-1 mr-2"
                numberOfLines={2}
              >
                {show.show_info.title}
              </Text>
              <TouchableOpacity onPress={() => handleShowMenu(show)}>
                <MaterialIcons name="more-vert" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center mb-1">
              <MaterialIcons name="tv" size={14} color="#3cab93" />
              <Text className="text-[#3cab93] text-xs ml-1">TV Show</Text>
              {show.status === "completed" && (
                <>
                  <MaterialIcons
                    name="check-circle"
                    size={14}
                    color="#3cab93"
                    className="ml-2"
                  />
                  <Text className="text-[#3cab93] text-xs ml-1">Completed</Text>
                </>
              )}
            </View>

            <Text className="text-gray text-sm mb-2">
              Last watched: S{show.current_season}E{show.current_episode}
            </Text>

            {/* Progress Bar */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray text-xs">
                  Season {show.current_season} Progress
                </Text>
                <Text className="text-gray text-xs">
                  {seasonProgress.watched}/{seasonProgress.total}
                </Text>
              </View>
              <View className="h-2 bg-[#253239] rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#3cab93] rounded-full"
                  style={{ width: `${seasonProgress.percentage}%` }}
                />
              </View>
            </View>

            {/* Overall Progress */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray text-xs">Overall Progress</Text>
                <Text className="text-gray text-xs">
                  {progress.watched}/{progress.total} episodes
                </Text>
              </View>
              <View className="h-1.5 bg-[#253239] rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#3cab93] rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-2 gap-2">
              <TouchableOpacity
                onPress={() => openEpisodeSheet(show)}
                className="flex-1 bg-[#3cab93] py-2 px-3 rounded-lg flex-row items-center justify-center "
              >
                <MaterialIcons name="tv" size={16} color="white" />
                <Text className="text-white font-medium text-sm ml-1">
                  Episodes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push(`/tvs/${show.show_info.id}`)}
                className="bg-[#253239] py-2 px-3 rounded-lg"
              >
                <MaterialIcons name="info" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // New function to render watchlist items that can be tracked
  const renderWatchlistItem = (item: WatchlistItem) => {
    return (
      <View
        key={item.id}
        className="bg-[#161f24] rounded-lg p-4 mb-4 border border-[#3cab9340] border-dashed"
      >
        <View className="flex-row">
          {/* Poster */}
          <Image
            source={
              item.poster_path
                ? {
                    uri: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
                  }
                : require("@/assets/images/poster-placeholder.png")
            }
            className="w-20 h-28 rounded-md mr-4 opacity-80"
            resizeMode="cover"
          />

          {/* Content */}
          <View className="flex-1 justify-center">
            <Text
              className="text-white font-bold text-lg mb-2"
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View className="flex-row items-center mb-3">
              <MaterialIcons name="bookmark" size={14} color="#3cab93" />
              <Text className="text-[#3cab93] text-xs ml-1">In Watchlist</Text>
            </View>

            <TouchableOpacity
              onPress={() => openInitTrackingModal(item)}
              className="bg-[#3cab93] py-2 px-4 rounded-lg flex-row items-center justify-center"
            >
              <MaterialIcons
                name="play-circle-outline"
                size={16}
                color="white"
              />
              <Text className="text-white font-medium text-sm ml-1">
                Start Tracking
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-10">
      <View className="bg-[#172730] p-8 rounded-3xl items-center w-72 border border-[#3cab9340]">
        <View className="bg-[#3cab9320] p-4 rounded-full mb-4">
          <MaterialIcons name="folder" size={50} color="#3cab93" />
        </View>
        <Text className="text-white font-semibold text-lg text-center mb-2">
          No shows tracked yet
        </Text>
        <Text className="text-gray text-center text-sm mb-4">
          Start tracking your TV shows to see your progress here
        </Text>
        <TouchableOpacity
          className="bg-[#3cab93] py-3 px-6 rounded-full"
          onPress={() => router.push("/(tabs)/search")}
        >
          <Text className="text-white font-medium">Find Shows</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-primary mb-18 pb-16">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="w-full flex items-center justify-center mt-14 mb-6">
        <Text className="text-white text-2xl font-bold">Show Tracker</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3cab93" />
        </View>
      ) : trackedShows.length === 0 && watchlistShows.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
        >
          {/* Currently Watching Section */}
          {watchingShows.length > 0 && (
            <>
              <Text className="text-white font-semibold text-lg mb-4">
                Currently Watching
              </Text>
              {watchingShows.map(renderShowCard)}
            </>
          )}

          {/* Completed Shows Section */}
          {completedShows.length > 0 && (
            <>
              <Text className="text-white font-semibold text-lg mt-6 mb-4">
                Completed
              </Text>
              {completedShows.map(renderShowCard)}
            </>
          )}

          {/* Watchlist Shows Section */}
          {watchlistShows.length > 0 && (
            <>
              <Text className="text-white font-semibold text-lg mt-6 mb-4">
                From Your Watchlist
              </Text>
              <Text className="text-gray-400 text-sm mb-4">
                Start tracking these shows to record your viewing progress
              </Text>
              {watchlistShows.map(renderWatchlistItem)}
            </>
          )}
        </ScrollView>
      )}

      {/* Episode Bottom Sheet */}
      {selectedShow && (
        <EpisodeModal
          visible={bottomSheetVisible}
          onClose={() => setBottomSheetVisible(false)}
          show={selectedShow}
          onEpisodeUpdate={fetchTrackedShows}
        />
      )}

      {/* Initialize Tracking Modal */}
      {selectedWatchlistItem && (
        <InitializeTrackingModal
          visible={initTrackingModalVisible}
          onClose={() => setInitTrackingModalVisible(false)}
          show={selectedWatchlistItem}
          onTrackingInitialized={handleTrackingInitialized}
        />
      )}

      <Toast />
    </View>
  );
}
