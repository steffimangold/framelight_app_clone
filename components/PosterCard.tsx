import { db } from "@/FirebaseConfig";
import { fetchTVShowDetails } from "@/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";


const placeholderImage = require("@/assets/images/poster-placeholder.png");

type PosterCardProps = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  media_type?: "movie" | "tv";
  onAddToWatchlist?: () => void;
  customWidth?: number;
  customHeight?: number;
};

const PosterCard = ({
  id,
  poster_path,
  title,
  vote_average,
  release_date,
  media_type = "movie",
  onAddToWatchlist,

  customWidth,
  customHeight,
}: PosterCardProps) => {
  const isMovie = media_type === "movie";
  const year = release_date?.split("-")[0] || "";
  const router = useRouter();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Add state to track saved/watched status
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Get responsive width
  const screenWidth = Dimensions.get("window").width;
  const paddingHorizontal = 40; // px-5 = 20px each side
  const marginBetween = 16; // mr-4 = 16px
  const availableWidth = screenWidth - paddingHorizontal;

  // Calculate width for 2.5 cards visible
  const cardWidth =
    customWidth || Math.floor((availableWidth - marginBetween * 2) / 2.5);
  // customHeight if provided, otherwise calculate based on width
  const imageHeight = customHeight || Math.floor(cardWidth * 1.5); // 3:2 aspect ratio

  // Check saved/watched/tracking status when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Check if in watchlist
        const watchlistDoc = await getDoc(
          doc(db, "users", user.uid, "watchlist", String(id))
        );
        setIsInWatchlist(watchlistDoc.exists());

        if (isMovie) {
          // Check if watched (only for movies)
          const ticketDoc = await getDoc(
            doc(db, "users", user.uid, "tickets", String(id))
          );
          setIsWatched(ticketDoc.exists());
        } else {
          // Check if tracking (only for TV shows)
          const progressDoc = await getDoc(
            doc(db, "users", user.uid, "tv_progress_", String(id))
          );
          setIsTracking(progressDoc.exists());
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    checkStatus();
  }, [id, auth.currentUser, isMovie]);

  // Updated function to toggle watchlist
  const handleToggleWatchlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/(auth)/login");
      return;
    }

    setLoading(true);
    try {
      const watchlistRef = doc(db, "users", user.uid, "watchlist", String(id));
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (isInWatchlist) {
        // Remove from watchlist
        await deleteDoc(watchlistRef);
        setIsInWatchlist(false);

        // Update saved count
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
        // Add to watchlist
        const itemData = {
          id: String(id),
          title,
          poster_path,
          vote_average,
          release_date,
          type: media_type,
          addedAt: new Date(),
        };

        await setDoc(watchlistRef, itemData);
        setIsInWatchlist(true);

        // Update saved count
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

      if (onAddToWatchlist) {
        onAddToWatchlist();
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update watchlist",
      });
    } finally {
      setLoading(false);
      setMenuVisible(false);
    }
  };

  // Updated function to toggle watched status (for movies)
  const handleToggleWatched = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/(auth)/login");
      return;
    }

    setLoading(true);
    try {
      const ticketRef = doc(db, "users", user.uid, "tickets", String(id));
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (isWatched) {
        // Remove from watched
        await deleteDoc(ticketRef);
        setIsWatched(false);

        // Update watched count
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.watchedCount || 0;
          if (currentCount > 0) {
            await updateDoc(userRef, {
              watchedCount: currentCount - 1,
            });
          }
        }

        Toast.show({
          type: "info",
          text1: "Removed from watched",
        });
      } else {
        // Add to watched
        const itemData = {
          id: String(id),
          title,
          poster_path,
          vote_average,
          release_date,
          type: media_type,
          watchedAt: new Date(),
        };

        await setDoc(ticketRef, itemData);
        setIsWatched(true);

        // Update watched count
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.watchedCount || 0;
          await updateDoc(userRef, {
            watchedCount: currentCount + 1,
          });
        }

        // If it was in watchlist, remove it
        if (isInWatchlist) {
          const watchlistRef = doc(
            db,
            "users",
            user.uid,
            "watchlist",
            String(id)
          );
          await deleteDoc(watchlistRef);
          setIsInWatchlist(false);

          // Update saved count
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

        Toast.show({
          type: "success",
          text1: "Added to watched",
        });
      }
    } catch (error) {
      console.error("Error toggling watched status:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update watched status",
      });
    } finally {
      setLoading(false);
      setMenuVisible(false);
    }
  };

  // New function to start tracking TV show
  const handleStartTracking = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/(auth)/login");
      return;
    }

    setLoading(true);
    try {
      // First, check if already tracking to avoid duplicate work
      if (isTracking) {
        // If already tracking, just navigate to details page
        router.push(`/tvs/${id}`);
        return;
      }

      // Show loading toast
      Toast.show({
        type: "info",
        text1: "Setting up episode tracking...",
        autoHide: false,
      });

      // Fetch TV show details
      const tvDetails = await fetchTVShowDetails(String(id));

      if (!tvDetails) {
        throw new Error("Failed to fetch TV show details");
      }

      // Prepare season data
      const seasons: {
        [key: string]: {
          episodes_watched: number[];
          total_episodes: number;
        };
      } = {};

      // Fetch details for each season or use available data
      for (let i = 1; i <= (tvDetails.number_of_seasons || 1); i++) {
        // Try to get episode count from the response, fallback to default if not available
        const seasonData = tvDetails.seasons?.find(
          (s: { season_number: number }) => s.season_number === i
        );
        const episodeCount = seasonData?.episode_count || 10;

        seasons[i.toString()] = {
          episodes_watched: [],
          total_episodes: episodeCount,
        };
      }

      // Create initial progress object
      const initialProgress = {
        show_info: {
          id: id,
          title: title,
          poster_path: poster_path,
          vote_average: vote_average,
          first_air_date: release_date,
          total_seasons: tvDetails.number_of_seasons || 1,
          total_episodes: tvDetails.number_of_episodes || 10,
        },
        current_season: 1,
        current_episode: 1,
        last_watched: new Date(),
        status: "watching",
        seasons: seasons,
      };

      // Save to Firestore
      const progressRef = doc(
        db,
        "users",
        user.uid,
        "tv_progress_",
        String(id)
      );
      await setDoc(progressRef, initialProgress);

      // Update local state
      setIsTracking(true);

      // If in watchlist, remove it (similar to watched movies)
      if (isInWatchlist) {
        const watchlistRef = doc(
          db,
          "users",
          user.uid,
          "watchlist",
          String(id)
        );
        await deleteDoc(watchlistRef);
        setIsInWatchlist(false);

        // Update user saved count
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

      // Hide the initial toast
      Toast.hide();

      // Show success message
      Toast.show({
        type: "success",
        text1: "Started tracking show!",
        text2: "You can now track episodes",
      });

      // Navigate to the TV show details page after a short delay
      setTimeout(() => {
        router.push(`/tvs/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Error starting tracking:", error);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Failed to start tracking",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
      setMenuVisible(false);
    }
  };

  return (
    <View style={{ width: cardWidth }} className="mr-4 relative">
      <TouchableOpacity
        className="absolute top-1 right-1 z-10 bg-black/40 rounded-full p-1.5"
        onPress={() => setMenuVisible(!menuVisible)}
      >
        <MaterialIcons name="more-vert" size={16} color="#fff" />
      </TouchableOpacity>

      {/* Action menu popup */}
      {menuVisible && (
        <View className="absolute top-8 right-1 z-20 bg-[#161f24] rounded-lg border border-[#3cab9340] p-1 w-28">
          {/* Watchlist option - for both movies and TV shows */}
          <TouchableOpacity
            className="flex-row items-center p-2"
            onPress={handleToggleWatchlist}
            disabled={loading || isTracking}
          >
            <MaterialIcons
              name={isInWatchlist ? "bookmark" : "bookmark-border"}
              size={20}
              color={isTracking ? "#555" : "#3cab93"}
            />
            <Text
              className={`text-xs ml-1 ${isTracking ? "text-gray" : "text-white"}`}
            >
              {isInWatchlist ? "Remove" : "Save"}
            </Text>
          </TouchableOpacity>

          {/* Movie-specific: Watched option */}
          {isMovie && (
            <TouchableOpacity
              className="flex-row items-center p-2"
              onPress={handleToggleWatched}
              disabled={loading}
            >
              <MaterialIcons
                name={isWatched ? "check-circle" : "check-circle-outline"}
                size={20}
                color="#3cab93"
              />
              <Text className="text-white text-xs ml-1">
                {isWatched ? "Unwatch" : "Watched"}
              </Text>
            </TouchableOpacity>
          )}

          {/* TV-specific: Track option */}
          {!isMovie && (
            <TouchableOpacity
              className="flex-row items-center p-2"
              onPress={handleStartTracking}
              disabled={loading}
            >
              <MaterialIcons
                name={isTracking ? "play-circle" : "play-circle-outline"}
                size={20}
                color="#3cab93"
              />
              <Text className="text-white text-xs ml-1">
                {isTracking ? "Episodes" : "Track"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Link href={`/${media_type}s/${id}`} asChild>
        <TouchableOpacity className="w-full">
          <View className="relative">
            <Image
              source={
                poster_path
                  ? { uri: `https://image.tmdb.org/t/p/w500${poster_path}` }
                  : placeholderImage
              }
              style={{
                width: "100%",
                height: imageHeight,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#3cab9320",
              }}
              resizeMode="cover"
            />

            {/* Badge for media type */}
            <View className="absolute top-0 left-0 bg-[#3cab93] px-1.5 py-0.5 rounded-br-lg rounded-tl-lg">
              <MaterialIcons
                name={isMovie ? "local-movies" : "tv"}
                size={10}
                color="#fff"
              />
            </View>

            {/* Status indicators */}
            {isMovie && isWatched && (
              <View className="absolute bottom-1 left-1">
                <MaterialIcons name="check-circle" size={16} color="#3cab93" />
              </View>
            )}
            {!isMovie && isTracking && (
              <View className="absolute bottom-1 left-1">
                <MaterialIcons name="play-circle" size={16} color="#3cab93" />
              </View>
            )}
            {isInWatchlist && !isWatched && !isTracking && (
              <View className="absolute bottom-1 right-1">
                <MaterialIcons name="bookmark" size={16} color="#3cab93" />
              </View>
            )}
          </View>

          <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
            {title}
          </Text>

          <View className="flex-row items-center justify-between w-full mt-1">
            <View className="flex-row items-center">
              <MaterialIcons name="star" size={14} color="#FACC15" />
              <Text className="text-xs text-white ml-0.5">
                {(vote_average / 2).toFixed(1)}
              </Text>
            </View>

            <Text className="text-[10px] text-gray">{year}</Text>
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default PosterCard;
