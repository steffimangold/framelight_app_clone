// components/EpisodeModal.tsx (Complete Grid Layout Version with Select All)
import { db } from "@/FirebaseConfig";
import { fetchTVSeasonDetails } from "@/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface EpisodeModalProps {
  visible: boolean;
  onClose: () => void;
  show: {
    id: string;
    show_info: {
      id: number;
      title: string;
      total_seasons: number;
    };
    current_season: number;
    current_episode: number;
    status?: "watching" | "completed" | "dropped";
    seasons: {
      [key: string]: {
        episodes_watched: number[];
        total_episodes: number;
      };
    };
  };
  onEpisodeUpdate: () => void;
}

const EpisodeModal: React.FC<EpisodeModalProps> = ({
  visible,
  onClose,
  show,
  onEpisodeUpdate,
}) => {
  const [updating, setUpdating] = useState(false);
  const [refreshingSeasons, setRefreshingSeasons] = useState(false);
  const auth = getAuth();
  const screenHeight = Dimensions.get("window").height;

  // Early return if show is not provided
  if (!show || !visible) {
    return null;
  }

  // Check if we have any seasons data
  const hasSeasonData = show.seasons
    ? Object.keys(show.seasons).length > 0
    : false;
  const totalSeasons = show.show_info?.total_seasons || 1;

  // Helper function to get total watched episodes across all seasons
  const getTotalWatchedEpisodes = () => {
    if (!show.seasons) return 0;

    return Object.values(show.seasons).reduce(
      (total, season) => total + (season.episodes_watched?.length || 0),
      0
    );
  };

  // Helper function to get total episodes across all seasons
  const getTotalEpisodes = () => {
    if (!show.seasons) return 0;

    return Object.values(show.seasons).reduce(
      (total, season) => total + (season.total_episodes || 0),
      0
    );
  };

  // Helper function to check if a show is fully watched
  const isShowFullyWatched = () => {
    if (!show.seasons) return false;

    // Check if all episodes in all seasons are watched
    return Object.values(show.seasons).every((season) => {
      return season.episodes_watched.length === season.total_episodes;
    });
  };

  // Function to mark all episodes as watched
  const markAllEpisodesWatched = async () => {
    const user = auth.currentUser;
    if (!user || updating) return;

    setUpdating(true);
    try {
      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);
      const updatedSeasons = { ...show.seasons };

      // For each season, mark all episodes as watched
      Object.keys(updatedSeasons).forEach((seasonKey) => {
        const season = updatedSeasons[seasonKey];
        if (season) {
          // Create array of episode numbers from 1 to total_episodes
          updatedSeasons[seasonKey].episodes_watched = Array.from(
            { length: season.total_episodes },
            (_, i) => i + 1
          );
        }
      });

      // Get the last episode of the last season as the current position
      const lastSeasonKey = Math.max(
        ...Object.keys(updatedSeasons).map(Number)
      ).toString();
      const lastSeason = updatedSeasons[lastSeasonKey];
      const lastEpisode = lastSeason ? lastSeason.total_episodes : 1;

      // Update in Firestore
      await updateDoc(progressRef, {
        seasons: updatedSeasons,
        current_season: parseInt(lastSeasonKey),
        current_episode: lastEpisode,
        last_watched: new Date(),
        status: "completed",
      });

      Toast.show({
        type: "success",
        text1: "Marked all episodes as watched",
        text2: "Show marked as completed",
      });

      onEpisodeUpdate();
      // Close the modal after marking complete
      onClose();
    } catch (error) {
      console.error("Error marking all episodes:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update episodes",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Function to mark all episodes in a specific season as watched
  const markSeasonAsWatched = async (seasonNumber: number) => {
    const user = auth.currentUser;
    if (!user || updating) return;

    setUpdating(true);
    try {
      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);
      const seasonKey = seasonNumber.toString();
      const updatedSeasons = { ...show.seasons };

      // Initialize season if it doesn't exist
      if (!updatedSeasons[seasonKey]) {
        updatedSeasons[seasonKey] = {
          episodes_watched: [],
          total_episodes: 10, 
        };
      }

      const seasonData = updatedSeasons[seasonKey];
      const totalEpisodes = seasonData.total_episodes;
      const currentWatched = seasonData.episodes_watched;

      // Check if season is already fully watched
      const isSeasonComplete = currentWatched.length === totalEpisodes;

      if (isSeasonComplete) {
        // Unmark all episodes in this season
        updatedSeasons[seasonKey].episodes_watched = [];
        Toast.show({
          type: "info",
          text1: `Season ${seasonNumber} unmarked`,
          text2: "All episodes removed",
        });
      } else {
        // Mark all episodes as watched
        updatedSeasons[seasonKey].episodes_watched = Array.from(
          { length: totalEpisodes },
          (_, i) => i + 1
        );
        Toast.show({
          type: "success",
          text1: `Season ${seasonNumber} completed!`,
          text2: "All episodes marked as watched",
        });
      }

      // Update current position to the last watched episode
      const allWatchedEpisodes = Object.entries(updatedSeasons)
        .flatMap(([seasonNum, seasonData]) =>
          seasonData.episodes_watched.map((ep) => ({
            season: parseInt(seasonNum),
            episode: ep,
          }))
        )
        .sort((a, b) => a.season - b.season || a.episode - b.episode);

      const latestEpisode = allWatchedEpisodes[allWatchedEpisodes.length - 1];

      // If show was completed and we unmarked a season, change status to watching
      let newStatus = show.status;
      if (show.status === "completed" && isSeasonComplete) {
        newStatus = "watching";
      }

      await updateDoc(progressRef, {
        seasons: updatedSeasons,
        current_season: latestEpisode?.season || 1,
        current_episode: latestEpisode?.episode || 1,
        last_watched: new Date(),
        ...(newStatus !== show.status ? { status: newStatus } : {}),
      });

      onEpisodeUpdate();
    } catch (error) {
      console.error("Error updating season:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update season",
      });
    } finally {
      setUpdating(false);
    }
  };

  const markEpisodeWatched = async (season: number, episode: number) => {
    const user = auth.currentUser;
    if (!user || updating) return;

    setUpdating(true);
    try {
      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);

      const updatedSeasons = { ...show.seasons };
      const seasonKey = season.toString();

      // Initialize season if it doesn't exist
      if (!updatedSeasons[seasonKey]) {
        updatedSeasons[seasonKey] = {
          episodes_watched: [],
          total_episodes: 10,
        };
      }

      const currentEpisodes = updatedSeasons[seasonKey].episodes_watched;
      const isWatched = currentEpisodes.includes(episode);

      if (isWatched) {
        // Remove episode (toggle off)
        updatedSeasons[seasonKey].episodes_watched = currentEpisodes.filter(
          (ep) => ep !== episode
        );
        Toast.show({
          type: "info",
          text1: `S${season}E${episode} unmarked`,
        });
      } else {
        // Add episode (toggle on)
        updatedSeasons[seasonKey].episodes_watched = [
          ...currentEpisodes,
          episode,
        ].sort((a, b) => a - b);

        Toast.show({
          type: "success",
          text1: `S${season}E${episode} watched!`,
        });
      }

      // Update current position
      const allWatchedEpisodes = Object.entries(updatedSeasons)
        .flatMap(([seasonNum, seasonData]) =>
          seasonData.episodes_watched.map((ep) => ({
            season: parseInt(seasonNum),
            episode: ep,
          }))
        )
        .sort((a, b) => a.season - b.season || a.episode - b.episode);

      const latestEpisode = allWatchedEpisodes[allWatchedEpisodes.length - 1];

      // If show is completed and user unmarked an episode, change status to watching
      let newStatus = show.status;
      if (show.status === "completed" && isWatched) {
        newStatus = "watching";
      }

      await updateDoc(progressRef, {
        seasons: updatedSeasons,
        current_season: latestEpisode?.season || 1,
        current_episode: latestEpisode?.episode || 1,
        last_watched: new Date(),
        ...(newStatus !== show.status ? { status: newStatus } : {}),
      });

      onEpisodeUpdate();
    } catch (error) {
      console.error("Error updating episode:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update episode",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Function to refresh season data from API
  const refreshSeasonData = async () => {
    const user = auth.currentUser;
    if (!user || refreshingSeasons) return;

    setRefreshingSeasons(true);
    try {
      Toast.show({
        type: "info",
        text1: "Refreshing season data...",
        autoHide: false,
      });

      const progressRef = doc(db, "users", user.uid, "tv_progress_", show.id);
      const updatedSeasons = { ...show.seasons };

      // Fetch total seasons from show info
      for (let i = 1; i <= totalSeasons; i++) {
        try {
          const seasonData = await fetchTVSeasonDetails(
            show.show_info.id.toString(),
            i
          );
          const episodeCount = seasonData.episodes?.length || 0;
          const seasonKey = i.toString();

        
          if (updatedSeasons[seasonKey]) {
            updatedSeasons[seasonKey].total_episodes = episodeCount;
          } else {
            // Initialize a new season
            updatedSeasons[seasonKey] = {
              episodes_watched: [],
              total_episodes: episodeCount,
            };
          }
        } catch (error) {
          console.error(`Error refreshing season ${i}:`, error);
         
        }
      }

      // Update in Firestore
      await updateDoc(progressRef, {
        seasons: updatedSeasons,
      });

      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Season data refreshed",
      });

      onEpisodeUpdate();
    } catch (error) {
      console.error("Error refreshing seasons:", error);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Failed to refresh season data",
      });
    } finally {
      setRefreshingSeasons(false);
    }
  };

  const renderSeason = (seasonNumber: number) => {
    if (!show?.seasons) {
      return null;
    }

    const seasonKey = seasonNumber.toString();
    const seasonData = show.seasons[seasonKey];

    // If no season data exists, show a message
    if (!seasonData) {
      return (
        <View
          key={seasonNumber}
          className="mb-6 p-4 bg-[#253239] rounded-lg border border-[#3cab9340]"
        >
          <Text className="text-white font-semibold text-lg mb-2">
            Season {seasonNumber}
          </Text>
          <Text className="text-gray text-sm mb-3">
            Episode data not found. Please refresh the tracker.
          </Text>
          <TouchableOpacity
            onPress={refreshSeasonData}
            disabled={refreshingSeasons}
            className="bg-[#3cab93] py-2 px-4 rounded-lg flex-row items-center justify-center"
          >
            {refreshingSeasons ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="refresh" size={16} color="white" />
            )}
            <Text className="text-white font-medium ml-2">
              {refreshingSeasons ? "Loading..." : "Refresh Season"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const seasonWatchedEpisodes = seasonData?.episodes_watched || [];
    const seasonTotalEpisodes = seasonData?.total_episodes || 10;
    const isSeasonComplete =
      seasonWatchedEpisodes.length === seasonTotalEpisodes;

    return (
      <View key={seasonNumber} className="mb-6">
        {/* Season Header with Select All Button */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white font-semibold text-lg">
            Season {seasonNumber}
          </Text>
          <TouchableOpacity
            onPress={() => markSeasonAsWatched(seasonNumber)}
            disabled={updating}
            className={`px-3 py-1.5 rounded-lg flex-row items-center ${
              isSeasonComplete
                ? "bg-[#e5737320] border border-[#e57373]"
                : "bg-[#3cab9320] border border-[#3cab93]"
            } ${updating ? "opacity-50" : ""}`}
          >
            <MaterialIcons
              name={
                isSeasonComplete
                  ? "remove-circle-outline"
                  : "check-circle-outline"
              }
              size={14}
              color={isSeasonComplete ? "#e57373" : "#3cab93"}
            />
            <Text
              className={`text-xs font-medium ml-1 ${
                isSeasonComplete ? "text-[#e57373]" : "text-[#3cab93]"
              }`}
            >
              {isSeasonComplete ? "Unmark All" : "Select All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Episode Progress Indicator */}
        <View className="flex-row items-center mb-3">
          <Text className="text-gray text-sm">
            {seasonWatchedEpisodes.length}/{seasonTotalEpisodes} episodes
            watched
          </Text>
          <View className="flex-1 ml-3 h-1.5 bg-[#253239] rounded-full">
            <View
              className="h-full bg-[#3cab93] rounded-full"
              style={{
                width: `${(seasonWatchedEpisodes.length / seasonTotalEpisodes) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Episode Grid */}
        <View className="flex-row flex-wrap gap-x-3 gap-y-3">
          {Array.from({ length: seasonTotalEpisodes }, (_, episodeIndex) => {
            const episodeNumber = episodeIndex + 1;
            const isWatched = seasonWatchedEpisodes.includes(episodeNumber);

            return (
              <TouchableOpacity
                key={episodeNumber}
                className={`h-12 w-12 rounded-xl items-center justify-center ${
                  isWatched
                    ? "bg-[#3cab93]"
                    : "bg-transparent border-2 border-[#3cab93]"
                } ${updating ? "opacity-50" : ""}`}
                onPress={() => markEpisodeWatched(seasonNumber, episodeNumber)}
                disabled={updating}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-base font-medium ${
                    isWatched ? "text-white" : "text-[#3cab93]"
                  }`}
                >
                  {episodeNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background overlay */}
      <View className="flex-1 bg-black/80 justify-center items-center">
        {/* Modal content - Centered */}
        <View
          className="bg-[#1a2025] rounded-3xl overflow-hidden w-11/12 border border-[#3cab9340]"
          style={{ maxHeight: screenHeight * 0.8, maxWidth: 500 }}
        >
          {/* Header */}
          <View className="p-5 bg-[#1a2025] border-b border-[#3cab9340]">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-bold text-2xl" numberOfLines={1}>
                {show.show_info?.title || "Unknown Show"}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="rounded-full h-10 w-10 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Progress Summary */}
            <View className="bg-[#161f24] rounded-lg p-4 mt-4 border border-[#3cab9340]">
              <Text className="text-[#3cab93] font-semibold text-lg">
                Currently at: S{show.current_season || 1}E
                {show.current_episode || 1}
              </Text>
              {show.status === "completed" && (
                <View className="flex-row items-center mt-2">
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#3cab93"
                  />
                  <Text className="text-[#3cab93] ml-1">Completed</Text>
                </View>
              )}
            </View>

            {/* Refresh Button */}
            <TouchableOpacity
              onPress={refreshSeasonData}
              disabled={refreshingSeasons}
              className="bg-[#253239] rounded-lg p-4 mt-4 flex-row items-center justify-center"
            >
              {refreshingSeasons ? (
                <ActivityIndicator size="small" color="#3cab93" />
              ) : (
                <MaterialIcons name="refresh" size={20} color="#3cab93" />
              )}
              <Text className="text-[#3cab93] font-medium text-base ml-2">
                {refreshingSeasons
                  ? "Refreshing season data..."
                  : "Refresh Season Data"}
              </Text>
            </TouchableOpacity>

            {/* Complete Show Button */}
            <TouchableOpacity
              onPress={markAllEpisodesWatched}
              disabled={
                updating || refreshingSeasons || show.status === "completed"
              }
              className={`rounded-lg p-4 mt-4 flex-row items-center justify-center ${
                show.status === "completed" ? "bg-[#253239]" : "bg-[#3cab93]"
              }`}
            >
              {updating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={show.status === "completed" ? "#3cab93" : "white"}
                />
              )}
              <Text
                className={`font-medium text-base ml-2 ${
                  show.status === "completed" ? "text-[#3cab93]" : "text-white"
                }`}
              >
                {updating
                  ? "Marking complete..."
                  : show.status === "completed"
                    ? "Show Completed"
                    : "Mark as Completed"}
              </Text>
            </TouchableOpacity>

            {/* Debug info - only visible during development */}
            <Text className="text-gray text-xs mt-2">
              Seasons available: {Object.keys(show.seasons || {}).length} /{" "}
              {totalSeasons} | Episodes watched: {getTotalWatchedEpisodes()} /{" "}
              {getTotalEpisodes()}
            </Text>
          </View>

          {/* Episodes Content */}
          <ScrollView
            className="px-5 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {!hasSeasonData ? (
              <View className="flex-1 justify-center items-center py-8">
                <View className="bg-[#253239] p-6 rounded-xl items-center">
                  <MaterialIcons
                    name="error-outline"
                    size={40}
                    color="#9CA3AF"
                  />
                  <Text className="text-gray text-center mt-4 mb-4 text-base">
                    No episode data found for this show.
                  </Text>
                  <Text className="text-gray text-center text-sm mb-4">
                    Try refreshing the tracker or reinitialize tracking.
                  </Text>
                  <TouchableOpacity
                    onPress={refreshSeasonData}
                    disabled={refreshingSeasons}
                    className="bg-[#3cab93] py-2 px-6 rounded-lg flex-row items-center justify-center"
                  >
                    {refreshingSeasons ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-medium ml-2">
                          Refreshing...
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="refresh" size={16} color="white" />
                        <Text className="text-white font-medium ml-2">
                          Refresh Data
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              Array.from({ length: totalSeasons }, (_, index) =>
                renderSeason(index + 1)
              )
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-5 bg-[#1a2025] border-t border-[#3cab9340]">
            <TouchableOpacity
              onPress={onClose}
              className="bg-[#253239] py-3 px-6 rounded-lg"
            >
              <Text className="text-white font-bold text-center text-base">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EpisodeModal;
