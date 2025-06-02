// app/tvs/[id].tsx - Updated with tracking option in action menu
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "@/FirebaseConfig";
import { fetchTVSeasonDetails, fetchTVShowDetails } from "@/services/api";
import useFetch from "@/services/useFetch";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

// Type definitions
interface TVInfoProps {
  label: string;
  value?: string | number | null;
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

interface SeasonInfo {
  season_number: number;
  episode_count: number;
}

const TVInfo = ({ label, value }: TVInfoProps) => (
  <View className="flex-col items-start justify-center mt-4">
    <Text className="text-[#3cab93] font-medium text-sm">{label}</Text>
    <Text className="text-white font-normal text-sm mt-1">
      {value || "N/A"}
    </Text>
  </View>
);

const TVDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { data: tv, loading } = useFetch(() =>
    fetchTVShowDetails(id as string)
  );

  const placeholderImage = require("@/assets/images/poster-placeholder.png");
  const [bookmarked, setBookmarked] = useState(false);
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(
    null
  );
  const [actionsVisible, setActionsVisible] = useState(false);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [initializingTracking, setInitializingTracking] = useState(false);

  // Fetch season information when TV data loads
  useEffect(() => {
    const fetchSeasonInfo = async () => {
      if (!tv) return;

      setLoadingSeasons(true);
      try {
        const seasons: SeasonInfo[] = [];

        console.log(
          `Fetching season details for ${tv.name} (${tv.number_of_seasons} seasons)`
        );

        // Fetch details for each season
        for (let i = 1; i <= tv.number_of_seasons; i++) {
          try {
            const seasonData = await fetchTVSeasonDetails(tv.id.toString(), i);
            const episodeCount = seasonData.episodes?.length || 0;
            seasons.push({
              season_number: i,
              episode_count: episodeCount,
            });
            console.log(`Season ${i}: ${episodeCount} episodes`);
          } catch (error) {
            console.error(`Error fetching season ${i}:`, error);
            // Fallback to default episode count if API fails
            seasons.push({
              season_number: i,
              episode_count: 10, // Default fallback
            });
            console.log(`Season ${i}: Using fallback (10 episodes)`);
          }
        }

        setSeasonInfo(seasons);
        console.log("Season info loaded:", seasons);
      } catch (error) {
        console.error("Error fetching season info:", error);
        // Create fallback season info
        const fallbackSeasons: SeasonInfo[] = [];
        for (let i = 1; i <= (tv?.number_of_seasons || 1); i++) {
          fallbackSeasons.push({
            season_number: i,
            episode_count: 10,
          });
        }
        setSeasonInfo(fallbackSeasons);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchSeasonInfo();
  }, [tv]);

  // Check if TV show is bookmarked and get watch progress
  useEffect(() => {
    const checkStatus = async () => {
      const user = auth.currentUser;
      if (!user || !tv) return;

      // Check watchlist status
      const watchlistRef = doc(
        db,
        "users",
        user.uid,
        "watchlist",
        tv.id.toString()
      );
      const watchlistSnap = await getDoc(watchlistRef);
      setBookmarked(watchlistSnap.exists());

      // Check TV progress
      const progressRef = doc(
        db,
        "users",
        user.uid,
        "tv_progress_",
        tv.id.toString()
      );
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        const progressData = progressSnap.data() as WatchProgress;
        setWatchProgress(progressData);
        console.log("Existing watch progress found:", progressData);
      }
    };

    checkStatus();
  }, [tv]);

  const toggleWatchlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("You must be logged in to add to watchlist.");
      return;
    }
    if (!tv) {
      Alert.alert("TV show data not loaded yet.");
      return;
    }

    const watchlistRef = doc(
      db,
      "users",
      user.uid,
      "watchlist",
      tv.id.toString()
    );

    try {
      if (bookmarked) {
        await deleteDoc(watchlistRef);
        setBookmarked(false);

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.savedCount || 0;
          if (currentCount > 0) {
            await updateDoc(userRef, {
              savedCount: currentCount - 1,
            });
          }
        }

        Toast.show({
          type: "info",
          text1: "Removed from watchlist",
        });
      } else {
        await setDoc(watchlistRef, {
          id: tv.id,
          title: tv.name,
          poster_path: tv.poster_path,
          vote_average: tv.vote_average,
          release_date: tv.first_air_date,
          type: "tv",
          addedAt: new Date(),
        });
        setBookmarked(true);

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.savedCount || 0;
          await updateDoc(userRef, {
            savedCount: currentCount + 1,
          });
        }

        Toast.show({
          type: "success",
          text1: "Added to watchlist",
        });
      }

      setActionsVisible(false);
    } catch (error) {
      console.error("Error updating watchlist:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update watchlist",
      });
    }
  };

  const initializeTracking = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("You must be logged in to track episodes.");
      return;
    }
    if (!tv) return;

    setInitializingTracking(true);
    setActionsVisible(false); // Close the actions menu

    try {
      const progressRef = doc(
        db,
        "users",
        user.uid,
        "tv_progress_",
        tv.id.toString()
      );

      // Show loading toast
      Toast.show({
        type: "info",
        text1: "Setting up episode tracking...",
        autoHide: false,
      });

      // Fetch season details if not already loaded or if we need fresh data
      let seasonsData: SeasonInfo[] = seasonInfo;

      if (seasonInfo.length === 0 || loadingSeasons) {
        console.log("Fetching season details for initialization...");
        seasonsData = [];

        // Fetch details for each season
        for (let i = 1; i <= tv.number_of_seasons; i++) {
          try {
            const seasonData = await fetchTVSeasonDetails(tv.id.toString(), i);
            const episodeCount = seasonData.episodes?.length || 10;
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
              episode_count: 10,
            });
          }
        }

        // Update season info state if it was empty
        setSeasonInfo(seasonsData);
      }

      const initialProgress: WatchProgress = {
        show_info: {
          id: tv.id,
          title: tv.name,
          poster_path: tv.poster_path,
          vote_average: tv.vote_average,
          first_air_date: tv.first_air_date,
          total_seasons: tv.number_of_seasons,
          total_episodes: tv.number_of_episodes,
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

      console.log("Initializing tracking with data:", {
        total_seasons: tv.number_of_seasons,
        seasons_data: seasonsData,
        initialized_seasons: initialProgress.seasons,
      });

      await setDoc(progressRef, initialProgress);
      setWatchProgress(initialProgress);

      // Remove from watchlist if it was there
      if (bookmarked) {
        const watchlistRef = doc(
          db,
          "users",
          user.uid,
          "watchlist",
          tv.id.toString()
        );
        await deleteDoc(watchlistRef);
        setBookmarked(false);

        // Update saved count
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.savedCount || 0;
          if (currentCount > 0) {
            await updateDoc(userRef, {
              savedCount: currentCount - 1,
            });
          }
        }
      }

      // Hide loading toast and show success
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Episode tracking initialized!",
        text2: `Ready to track ${seasonsData.length} seasons`,
      });
    } catch (error) {
      console.error("Error starting tracking:", error);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Failed to start tracking",
        text2: "Please try again",
      });
    } finally {
      setInitializingTracking(false);
    }
  };

  const markEpisodeWatched = async (season: number, episode: number) => {
    const user = auth.currentUser;
    if (!user || !watchProgress || !tv) return;

    try {
      const progressRef = doc(
        db,
        "users",
        user.uid,
        "tv_progress_",
        tv.id.toString()
      );

      const updatedProgress = { ...watchProgress };
      const seasonKey = season.toString();

      if (!updatedProgress.seasons[seasonKey]) {
        const seasonData = seasonInfo.find((s) => s.season_number === season);
        updatedProgress.seasons[seasonKey] = {
          episodes_watched: [],
          total_episodes: seasonData?.episode_count || 10,
        };
      }

      const currentEpisodes =
        updatedProgress.seasons[seasonKey]!.episodes_watched;
      const isWatched = currentEpisodes.includes(episode);

      if (isWatched) {
        // Remove episode (toggle off)
        updatedProgress.seasons[seasonKey]!.episodes_watched =
          currentEpisodes.filter((ep) => ep !== episode);

        // Update current position to the latest remaining watched episode
        const allWatchedEpisodes = Object.entries(updatedProgress.seasons)
          .flatMap(([seasonNum, seasonData]) =>
            seasonData.episodes_watched.map((ep) => ({
              season: parseInt(seasonNum),
              episode: ep,
            }))
          )
          .sort((a, b) => a.season - b.season || a.episode - b.episode);

        const latestEpisode = allWatchedEpisodes[allWatchedEpisodes.length - 1];

        if (latestEpisode) {
          updatedProgress.current_season = latestEpisode.season;
          updatedProgress.current_episode = latestEpisode.episode;
        } else {
          updatedProgress.current_season = 1;
          updatedProgress.current_episode = 1;
        }

        Toast.show({
          type: "info",
          text1: `S${season}E${episode} unmarked`,
        });
      } else {
        // Add episode (toggle on)
        updatedProgress.seasons[seasonKey]!.episodes_watched.push(episode);
        updatedProgress.seasons[seasonKey]!.episodes_watched.sort(
          (a: number, b: number) => a - b
        );

        updatedProgress.current_season = season;
        updatedProgress.current_episode = episode;

        Toast.show({
          type: "success",
          text1: `S${season}E${episode} watched!`,
        });
      }

      updatedProgress.last_watched = new Date();

      await updateDoc(progressRef, updatedProgress);
      setWatchProgress(updatedProgress);
    } catch (error) {
      console.error("Error marking episode:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update episode",
      });
    }
  };

  const renderEpisodeTracking = () => {
    if (!tv) return null;

    return (
      <View className="mt-8">
        <Text className="text-white font-medium text-lg mb-4">
          Episode Tracking
        </Text>

        {!watchProgress ? (
          <View className="bg-[#161f24] rounded-lg p-4 mb-4 border border-[#3cab9340]">
            <Text className="text-white font-semibold mb-2">
              Start Tracking Episodes
            </Text>
            <Text className="text-gray text-sm mb-4">
              Track your progress through each episode and never lose your
              place.
            </Text>
            <TouchableOpacity
              onPress={initializeTracking}
              className="bg-[#3cab93] py-3 px-6 rounded-lg"
              disabled={initializingTracking || loadingSeasons}
            >
              <Text className="text-white font-semibold text-center">
                {initializingTracking
                  ? "Setting up..."
                  : loadingSeasons
                    ? "Loading season data..."
                    : "Start Tracking"}
              </Text>
            </TouchableOpacity>

            {/* Debug info */}
            <Text className="text-gray text-xs mt-2">
              Season info loaded: {seasonInfo.length > 0 ? "Yes" : "No"}
              {seasonInfo.length > 0 && ` (${seasonInfo.length} seasons)`}
            </Text>
          </View>
        ) : (
          <>
            {/* Progress Summary */}
            <View className="bg-[#161f24] rounded-lg p-4 mb-4 border border-[#3cab9340]">
              <Text className="text-[#3cab93] font-semibold">
                Currently at: S{watchProgress.current_season}E
                {watchProgress.current_episode}
              </Text>

              {/* Debug info */}
              <Text className="text-gray text-xs mt-1">
                Seasons in progress: {Object.keys(watchProgress.seasons).length}
              </Text>
            </View>

            {/* Seasons */}
            {Array.from(
              { length: tv.number_of_seasons || 0 },
              (_, seasonIndex) => {
                const seasonNumber = seasonIndex + 1;
                const seasonKey = seasonNumber.toString();
                const seasonData = watchProgress.seasons[seasonKey];
                const watchedEpisodes = seasonData?.episodes_watched || [];
                const totalEpisodes =
                  seasonData?.total_episodes ||
                  seasonInfo.find((s) => s.season_number === seasonNumber)
                    ?.episode_count ||
                  10;

                return (
                  <View key={seasonNumber} className="mb-6">
                    <Text className="text-white font-semibold mb-3">
                      Season {seasonNumber} ({watchedEpisodes.length}/
                      {totalEpisodes})
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                      {Array.from(
                        { length: totalEpisodes },
                        (_, episodeIndex) => {
                          const episodeNumber = episodeIndex + 1;
                          const isWatched =
                            watchedEpisodes.includes(episodeNumber);

                          return (
                            <TouchableOpacity
                              key={episodeNumber}
                              className={`w-12 h-12 rounded-lg items-center justify-center border-2 ${
                                isWatched
                                  ? "bg-[#3cab93] border-[#3cab93]"
                                  : "bg-[#161f24] border-[#3cab9340]"
                              }`}
                              onPress={() =>
                                markEpisodeWatched(seasonNumber, episodeNumber)
                              }
                            >
                              <Text
                                className={`text-xs font-bold ${
                                  isWatched ? "text-white" : "text-gray"
                                }`}
                              >
                                {episodeNumber}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </View>
                );
              }
            )}
          </>
        )}
      </View>
    );
  };

  if (loading)
    return (
      <View className="bg-primary flex-1 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color="#3cab93" size="large" />
      </View>
    );

  if (!tv)
    return (
      <View className="bg-primary flex-1 items-center justify-center">
        <StatusBar barStyle="light-content" />
        <Text className="text-white">TV show not found.</Text>
      </View>
    );

  return (
    <View className="bg-primary flex-1 pt-10 ">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={
              tv.poster_path
                ? {
                    uri: `https://image.tmdb.org/t/p/w500${tv.poster_path}`,
                  }
                : placeholderImage
            }
            className="w-full h-[500px]"
            resizeMode="cover"
          />

          {/* Actions button */}
          <TouchableOpacity
            className="absolute -bottom-8 right-5 rounded-full size-16 bg-[#3cab93] flex items-center justify-center"
            onPress={() => setActionsVisible(!actionsVisible)}
          >
            <MaterialIcons
              name={actionsVisible ? "close" : "more-horiz"}
              size={30}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Actions popup - With both Watchlist and Tracking options */}
          {actionsVisible && (
            <View className="absolute -bottom-28 right-5 bg-[#161f24] rounded-lg border border-[#3cab9340] p-2 w-48 z-10">
              {/* Watchlist option */}
              <TouchableOpacity
                className="flex-row items-center p-2"
                onPress={toggleWatchlist}
                disabled={!!watchProgress}
              >
                <MaterialIcons
                  name={bookmarked ? "bookmark" : "bookmark-border"}
                  size={20}
                  color={watchProgress ? "#555" : "#3cab93"}
                  style={{ width: 24 }}
                />
                <Text
                  className={`ml-2 ${watchProgress ? "text-gray-500" : "text-white"}`}
                >
                  {bookmarked ? "Remove from Watchlist" : "Add to Watchlist"}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="h-px bg-[#3cab9320] my-1" />

              {/* Start Tracking option */}
              <TouchableOpacity
                className="flex-row items-center p-2"
                onPress={initializeTracking}
                disabled={!!watchProgress || initializingTracking}
              >
                <MaterialIcons
                  name="play-circle-outline"
                  size={20}
                  color={watchProgress ? "#555" : "#3cab93"}
                  style={{ width: 24 }}
                />
                <Text
                  className={`ml-2 ${watchProgress ? "text-gray-500" : "text-white"}`}
                >
                  {watchProgress
                    ? "Already Tracking"
                    : initializingTracking
                      ? "Setting up..."
                      : "Start Tracking"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{tv.name}</Text>
          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-gray text-sm">
              {tv.first_air_date?.split("-")[0]} • {tv.number_of_seasons} season
              {tv.number_of_seasons !== 1 ? "s" : ""}
            </Text>
          </View>

          <View className="flex-row items-center gap-x-1 mt-2">
            <MaterialIcons name="star" size={18} color="#FACC15" />
            <Text className="text-white font-bold text-sm">
              {(tv.vote_average / 2).toFixed(1)}/5
            </Text>

            <Text className="text-gray text-xs ml-1">
              ({tv.vote_count.toLocaleString()} votes)
            </Text>

            {watchProgress && (
              <View className="ml-3 flex-row items-center">
                <MaterialIcons name="play-circle" size={16} color="#3cab93" />
                <Text className="text-[#3cab93] text-xs ml-1">
                  S{watchProgress.current_season}E
                  {watchProgress.current_episode}
                </Text>
              </View>
            )}

            {bookmarked && !watchProgress && (
              <View className="ml-3 flex-row items-center">
                <MaterialIcons name="bookmark" size={16} color="#3cab93" />
                <Text className="text-[#3cab93] text-xs ml-1">Watchlist</Text>
              </View>
            )}
          </View>

          <View className="mt-3 flex-row flex-wrap">
            {tv.genres?.map((genre: any) => (
              <View
                key={genre.id}
                className="bg-[#3cab9320] px-3 py-1 rounded-full mr-2 mb-2"
              >
                <Text className="text-[#3cab93] text-xs">{genre.name}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white font-medium mt-5">Overview</Text>
          <Text className="text-gray text-sm mt-1">{tv.overview}</Text>

          <Text className="text-white font-medium mt-6 mb-2">Top Cast</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tv.credits?.cast?.slice(0, 10).map((actor: any) => (
              <TouchableOpacity
                key={actor.id}
                className="mr-4 items-center"
                onPress={() => router.push(`/actor/${actor.id}`)}
              >
                <Image
                  source={{
                    uri: actor.profile_path
                      ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                      : "https://placeholder.co/600x400/1a1a1a/ffffff.png",
                  }}
                  className="w-20 h-28 rounded-md mb-1"
                />
                <Text
                  className="text-white text-xs text-center w-20"
                  numberOfLines={2}
                >
                  {actor.name}
                </Text>
                <Text
                  className="text-gray text-[10px] text-center w-20 flex-wrap"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {actor.character}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex flex-row justify-between w-full mt-4">
            <TVInfo label="Episodes" value={tv.number_of_episodes} />
            <TVInfo label="Seasons" value={tv.number_of_seasons} />
          </View>

          <TVInfo
            label="Created By"
            value={tv.created_by?.map((c: any) => c.name).join(", ") || "N/A"}
          />

          <TVInfo
            label="Networks"
            value={tv.networks?.map((n: any) => n.name).join(", ") || "N/A"}
          />

          <TVInfo
            label="Production Companies"
            value={
              tv.production_companies?.map((c: any) => c.name).join(" • ") ||
              "N/A"
            }
          />

          {/* Episode Tracking Section - Always visible at bottom */}
          {renderEpisodeTracking()}
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute top-16 left-5 w-10 h-10 bg-[#00000080] rounded-full flex items-center justify-center z-50"
        onPress={router.back}
      >
        <MaterialIcons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

export default TVDetails;
