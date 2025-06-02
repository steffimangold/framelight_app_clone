// components/InitializeTrackingModal.tsx
import { db } from "@/FirebaseConfig";
import { fetchTVSeasonDetails, fetchTVShowDetails } from "@/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface InitializeTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  show: {
    id: number | string;
    title: string;
    poster_path: string | null;
    vote_average?: number;
    first_air_date?: string;
    release_date?: string;
    type: "movie" | "tv";
  };
  onTrackingInitialized: () => void;
}

interface SeasonInfo {
  season_number: number;
  episode_count: number;
}

interface WatchProgress {
  show_info: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    first_air_date: string;
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

const InitializeTrackingModal: React.FC<InitializeTrackingModalProps> = ({
  visible,
  onClose,
  show,
  onTrackingInitialized,
}) => {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();
  const screenHeight = Dimensions.get("window").height;

  // Early return if show is not provided
  if (!show || !visible) {
    return null;
  }

  const initializeTracking = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to track episodes.");
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      // Show loading toast
      Toast.show({
        type: "info",
        text1: "Setting up episode tracking...",
        autoHide: false,
      });

      // First, fetch complete TV show details
      const tvDetails = await fetchTVShowDetails(show.id.toString());

      if (!tvDetails) {
        throw new Error("Could not fetch TV show details");
      }

      const progressRef = doc(
        db,
        "users",
        user.uid,
        "tv_progress_",
        tvDetails.id.toString()
      );

      // Fetch season details
      const seasonsData: SeasonInfo[] = [];

      console.log(
        `Fetching season details for ${tvDetails.name} (${tvDetails.number_of_seasons} seasons)`
      );

      // Fetch details for each season
      for (let i = 1; i <= tvDetails.number_of_seasons; i++) {
        try {
          const seasonData = await fetchTVSeasonDetails(
            tvDetails.id.toString(),
            i
          );
          const episodeCount = seasonData.episodes?.length || 0;
          seasonsData.push({
            season_number: i,
            episode_count: episodeCount,
          });
          console.log(`Season ${i}: ${episodeCount} episodes`);
        } catch (error) {
          console.error(`Error fetching season ${i}:`, error);
          // Fallback to default episode count if API fails
          seasonsData.push({
            season_number: i,
            episode_count: 10, // Default fallback
          });
        }
      }

      // Prepare initial progress object
      const initialProgress: WatchProgress = {
        show_info: {
          id: tvDetails.id,
          title: tvDetails.name,
          poster_path: tvDetails.poster_path,
          vote_average: tvDetails.vote_average,
          first_air_date: tvDetails.first_air_date,
          total_seasons: tvDetails.number_of_seasons,
          total_episodes: tvDetails.number_of_episodes,
        },
        current_season: 1,
        current_episode: 1,
        last_watched: new Date(),
        status: "watching",
        seasons: {},
      };

      // Initialize seasons with actual episode counts
      seasonsData.forEach((season) => {
        initialProgress.seasons[season.season_number.toString()] = {
          episodes_watched: [],
          total_episodes: season.episode_count,
        };
      });

      console.log("Initializing tracking with data:", initialProgress);

      // Save to Firestore
      await setDoc(progressRef, initialProgress);

      // Remove from watchlist if it was there
      const watchlistRef = doc(
        db,
        "users",
        user.uid,
        "watchlist",
        tvDetails.id.toString()
      );

      // Check if it exists in watchlist first
      const watchlistSnap = await getDoc(watchlistRef);
      if (watchlistSnap.exists()) {
        // Delete from watchlist
        await deleteDoc(watchlistRef);
      }

      // Hide loading toast
      Toast.hide();

      // Notify parent component
      onTrackingInitialized();
    } catch (error) {
      console.error("Error starting tracking:", error);
      setError("Failed to initialize tracking. Please try again.");

      // Hide loading toast and show error
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Failed to start tracking",
        text2: "Please try again",
      });
    } finally {
      setInitializing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background overlay */}
      <View className="flex-1 bg-black/80 justify-center items-center px-4">
        {/* Modal content */}
        <View
          className="bg-[#1a2025] rounded-2xl p-6 w-full border border-[#3cab9340]"
          style={{ maxHeight: screenHeight * 0.6, maxWidth: 400 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-bold text-xl">
              Start Tracking Episodes
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="bg-[#253239] p-2 rounded-full"
              disabled={initializing}
            >
              <MaterialIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="bg-[#161f24] rounded-lg p-4 mb-6 border border-[#3cab9340]">
            <Text className="text-white font-semibold text-lg mb-2">
              {show.title}
            </Text>
            <Text className="text-gray mb-4">
              Track your progress through each episode and never lose your
              place.
            </Text>

            {error && (
              <View className="bg-red-900/30 p-3 rounded-lg mb-4">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={initializeTracking}
              className="bg-[#3cab93] py-3 px-6 rounded-lg"
              disabled={initializing}
            >
              {initializing ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">
                    Setting up...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-center">
                  Start Tracking
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info text */}
          <Text className="text-gray text-sm text-center">
            This will move the show from your watchlist to your tracked shows.
          </Text>

          {/* Footer */}
          <View className="mt-4 pt-4 border-t border-[#3cab9340]">
            <TouchableOpacity
              onPress={onClose}
              className="bg-[#253239] py-3 px-6 rounded-lg"
              disabled={initializing}
            >
              <Text className="text-white font-medium text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InitializeTrackingModal;
