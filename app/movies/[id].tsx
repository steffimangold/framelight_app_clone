// app/movies/[id].tsx
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
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "@/FirebaseConfig";
import { fetchMovieDetails } from "@/services/api";
import useFetch from "@/services/useFetch";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

const placeholderImage = require("@/assets/images/poster-placeholder.png");

interface MovieInfoProps {
  label: string;
  value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
  <View className="flex-col items-start justify-center mt-4">
    <Text className="text-[#3cab93] font-medium text-sm">{label}</Text>
    <Text className="text-white font-normal text-sm mt-1">
      {value || "N/A"}
    </Text>
  </View>
);

const Details = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string)
  );

  const [bookmarked, setBookmarked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

  // Check if movie is bookmarked and watched when component mounts and movie data is loaded
  useEffect(() => {
    const checkStatus = async () => {
      const user = auth.currentUser;
      if (!user || !movie) return;

      // Check watchlist status
      const watchlistRef = doc(
        db,
        "users",
        user.uid,
        "watchlist",
        movie.id.toString()
      );
      const watchlistSnap = await getDoc(watchlistRef);
      setBookmarked(watchlistSnap.exists());

      // Check watched status
      const ticketRef = doc(
        db,
        "users",
        user.uid,
        "tickets",
        movie.id.toString()
      );
      const ticketSnap = await getDoc(ticketRef);
      setIsWatched(ticketSnap.exists());
    };

    checkStatus();
  }, [movie]);

  const toggleWatchlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("You must be logged in to add to watchlist.");
      return;
    }
    if (!movie) {
      Alert.alert("Movie data not loaded yet.");
      return;
    }

    const watchlistRef = doc(
      db,
      "users",
      user.uid,
      "watchlist",
      movie.id.toString()
    );

    try {
      if (bookmarked) {
        // Remove from watchlist
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

        Toast.show({
          type: "info",
          text1: "Removed from watchlist",
          position: "bottom",
        });
      } else {
        // Add to watchlist
        await setDoc(watchlistRef, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          type: "movie",
          addedAt: new Date(),
        });
        setBookmarked(true);

        // Update saved count
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
          position: "bottom",
        });
      }

      setActionsVisible(false);
    } catch (error) {
      console.error("Error updating watchlist:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update watchlist",
        position: "bottom",
      });
    }
  };

  const markAsWatched = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("You must be logged in to mark as watched.");
      return;
    }
    if (!movie) {
      Alert.alert("Movie data not loaded yet.");
      return;
    }

    try {
      const ticketRef = doc(
        db,
        "users",
        user.uid,
        "tickets",
        movie.id.toString()
      );

      if (isWatched) {
        // Remove from tickets collection
        await deleteDoc(ticketRef);

        // Update watched count
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.watchedCount || 0;
          if (currentCount > 0) {
            await updateDoc(userRef, {
              watchedCount: currentCount - 1,
            });
          }
        }

        setIsWatched(false);
        Toast.show({
          type: "info",
          text1: "Removed from watched movies",
          position: "bottom",
        });
      } else {
        // Add to tickets collection
        const ticketData = {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          type: "movie",
          watchedAt: new Date(),
          runtime: movie.runtime,
          genres: movie.genres?.map((g) => g.name),
        };

        await setDoc(ticketRef, ticketData);

        // Update watched count
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.watchedCount || 0;
          await updateDoc(userRef, {
            watchedCount: currentCount + 1,
          });
        }

        // If it was in watchlist, remove it
        if (bookmarked) {
          const watchlistRef = doc(
            db,
            "users",
            user.uid,
            "watchlist",
            movie.id.toString()
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

        setIsWatched(true);
        Toast.show({
          type: "success",
          text1: "Added to your tickets collection!",
          text2: "Movie ticket collected",
          position: "bottom",
        });
      }

      setActionsVisible(false);
    } catch (error) {
      console.error("Error updating watched status:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update watched status",
        position: "bottom",
      });
    }
  };

  if (loading)
    return (
      <SafeAreaView className="bg-primary flex-1">
        <ActivityIndicator color="#3cab93" size="large" />
      </SafeAreaView>
    );

  if (!movie)
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <Text className="text-white">Movie not found.</Text>
      </SafeAreaView>
    );

  return (
    <View className="bg-primary flex-1 pt-10 pb-24">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={
              movie.poster_path
                ? {
                    uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
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

          {/* Actions popup */}
          {actionsVisible && (
            <View className="absolute -bottom-28 right-5 bg-[#161f24] rounded-lg border border-[#3cab9340] p-2 w-38 z-10">
              <TouchableOpacity
                className="flex-row items-center p-2"
                onPress={toggleWatchlist}
              >
                <MaterialIcons
                  name={bookmarked ? "bookmark" : "bookmark-border"}
                  size={20}
                  color="#3cab93"
                  style={{ width: 24 }}
                />
                <Text className="text-white ml-2">
                  {bookmarked ? "Remove" : "Save"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-2"
                onPress={markAsWatched}
              >
                <MaterialIcons
                  name={isWatched ? "check-circle" : "check-circle-outline"}
                  size={20}
                  color="#3cab93"
                  style={{ width: 24 }}
                />
                <Text className="text-white ml-2">
                  {isWatched ? "Unwatched" : "Watched"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{movie.title}</Text>
          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-gray text-sm">
              {movie.release_date?.split("-")[0]} •
            </Text>
            <Text className="text-gray text-sm">{movie.runtime}m</Text>
          </View>

          <View className="flex-row items-center gap-x-1 mt-2">
            <MaterialIcons name="star" size={18} color="#FACC15" />
            <Text className="text-white font-bold text-sm">
              {(movie.vote_average / 2).toFixed(1)}/5
            </Text>

            <Text className="text-gray text-xs ml-1">
              ({movie.vote_count.toLocaleString()} votes)
            </Text>

            {isWatched && (
              <View className="ml-3 flex-row items-center">
                <MaterialIcons name="check-circle" size={16} color="#3cab93" />
                <Text className="text-[#3cab93] text-xs ml-1">Watched</Text>
              </View>
            )}

            {bookmarked && !isWatched && (
              <View className="ml-3 flex-row items-center">
                <MaterialIcons name="bookmark" size={16} color="#3cab93" />
                <Text className="text-[#3cab93] text-xs ml-1">Watchlist</Text>
              </View>
            )}
          </View>

          <View className="mt-3 flex-row flex-wrap">
            {movie.genres?.map((genre) => (
              <View
                key={genre.id}
                className="bg-[#3cab9320] px-3 py-1 rounded-full mr-2 mb-2"
              >
                <Text className="text-[#3cab93] text-xs">{genre.name}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white font-medium mt-5">Overview</Text>
          <Text className="text-gray text-sm mt-1">{movie.overview}</Text>

          <Text className="text-white font-medium mt-6 mb-2">Top Cast</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {movie.credits?.cast?.slice(0, 10).map((member) => (
              <TouchableOpacity
                key={member.id}
                className="mr-4 items-center"
                onPress={() => router.push(`/actor/${member.id}`)}
              >
                <Image
                  source={{
                    uri: member.profile_path
                      ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                      : "https://placeholder.co/600x400/1a1a1a/ffffff.png",
                  }}
                  className="w-20 h-28 rounded-md mb-1"
                />
                <Text
                  className="text-white text-xs font-bold text-center w-20"
                  numberOfLines={2}
                >
                  {member.name}
                </Text>
                <Text
                  className="text-gray text-[10px] text-center w-20 flex-wrap"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {member.character}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex flex-row justify-between w-full mt-4">
            <MovieInfo
              label="Budget"
              value={
                movie.budget > 0
                  ? `$${(movie.budget / 1_000_000).toFixed(1)}M`
                  : "N/A"
              }
            />
            <MovieInfo
              label="Revenue"
              value={
                movie.revenue > 0
                  ? `$${(movie.revenue / 1_000_000).toFixed(1)}M`
                  : "N/A"
              }
            />
          </View>

          <MovieInfo
            label="Production Companies"
            value={
              movie.production_companies?.map((c) => c.name).join(" • ") ||
              "N/A"
            }
          />
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

export default Details;
