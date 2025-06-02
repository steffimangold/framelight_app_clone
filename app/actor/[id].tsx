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
import { fetchActorDetails } from "@/services/api";
import useFetch from "@/services/useFetch";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

const placeholderImage = require("@/assets/images/poster-placeholder.png");

interface ActorDetails {
  id: number;
  name: string;
  birthday: string | null;
  deathday: string | null;
  biography: string;
  place_of_birth: string | null;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  also_known_as: string[];

  credits?: {
    cast: Array<{
      id: number;
      title?: string; // For movies
      name?: string; // For TV shows
      media_type: string; // "movie" or "tv"
      character: string;
      poster_path: string | null;
      credit_id: string;
    }>;
    crew?: Array<any>;
  };

  // Optional additional fields
  images?: {
    profiles: Array<{
      file_path: string;
      width: number;
      height: number;
    }>;
  };

  external_ids?: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
}

interface ActorInfoProps {
  label: string;
  value?: string | number | null;
}

const ActorInfo = ({ label, value }: ActorInfoProps) => (
  <View className="flex-col items-start justify-center mt-4">
    <Text className="text-[#3cab93] font-medium text-sm">{label}</Text>
    <Text className="text-white font-normal text-sm mt-1">
      {value || "N/A"}
    </Text>
  </View>
);

const ActorDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: actor, loading } = useFetch<ActorDetails>(() =>
    fetchActorDetails(id as string)
  );

  // Check if actor is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const user = auth.currentUser;
      if (!user || !actor) return;

      const favoriteRef = doc(
        db,
        "users",
        user.uid,
        "favoriteActors",
        actor.id.toString()
      );
      const docSnap = await getDoc(favoriteRef);
      setIsFavorite(docSnap.exists());
    };

    checkFavoriteStatus();
  }, [actor]);

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to add favorite actors.");
      return;
    }
    if (!actor) {
      Alert.alert("Error", "Actor data not loaded yet.");
      return;
    }

    try {
      const favoriteRef = doc(
        db,
        "users",
        user.uid,
        "favoriteActors",
        actor.id.toString()
      );

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (isFavorite) {
        // Remove from favorites
        await deleteDoc(favoriteRef);

        // Update favorite actors count in profile
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.favoriteActorsCount || 0;
          if (currentCount > 0) {
            await updateDoc(userRef, {
              favoriteActorsCount: currentCount - 1,
            });
          }
        }

        setIsFavorite(false);
        Toast.show({
          type: "info",
          text1: "Removed from favorites",
          position: "bottom",
        });
      } else {
        // Add to favorites
        await setDoc(favoriteRef, {
          id: actor.id,
          name: actor.name,
          profile_path: actor.profile_path,
          known_for_department: actor.known_for_department,
          addedAt: new Date(),
        });

        // Update favorite actors count in profile
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCount = userData.favoriteActorsCount || 0;
          await updateDoc(userRef, {
            favoriteActorsCount: currentCount + 1,
          });
        }

        setIsFavorite(true);
        Toast.show({
          type: "success",
          text1: "Added to favorites",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update favorites",
        position: "bottom",
      });
    }
  };

  if (loading)
    return (
      <View className="bg-primary flex-1 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color="#3cab93" size="large" />
      </View>
    );

  if (!actor)
    return (
      <View className="bg-primary flex-1 items-center justify-center">
        <StatusBar barStyle="light-content" />
        <Text className="text-white">Actor not found.</Text>
      </View>
    );

  // Calculate age if birthday is available
  const calculateAge = () => {
    if (!actor.birthday) return null;

    const birthDate = new Date(actor.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const age = calculateAge();

  return (
    <View className="bg-primary flex-1 pt-10 pb-24">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={{
              uri: actor.profile_path
                ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                : placeholderImage,
            }}
            className="w-full h-[500px]"
            resizeMode="cover"
          />

          <TouchableOpacity
            className="absolute -bottom-8 right-5 rounded-full size-16 bg-[#161f24] flex items-center justify-center border-2 border-[#3cab9330]"
            onPress={toggleFavorite}
          >
            <MaterialIcons
              name={isFavorite ? "favorite" : "favorite-border"}
              size={30}
              color={isFavorite ? "#e57373" : "#e57373"}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{actor.name}</Text>

          {actor.known_for_department && (
            <View className="bg-[#3cab9320] px-3 py-1 rounded-full mt-2">
              <Text className="text-[#3cab93] text-xs">
                {actor.known_for_department}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mt-4">
            <View className="flex-row items-center mr-4">
              <MaterialIcons name="cake" size={16} color="#3cab93" />
              <Text className="text-white text-sm ml-1">
                {actor.birthday
                  ? new Date(actor.birthday).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Unknown"}
                {age ? ` (${age})` : ""}
              </Text>
            </View>

            {actor.deathday && (
              <View className="flex-row items-center">
                <MaterialIcons name="event" size={16} color="#e57373" />
                <Text className="text-white text-sm ml-1">
                  Died:{" "}
                  {new Date(actor.deathday).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center mt-2">
            <MaterialIcons name="location-on" size={16} color="#3cab93" />
            <Text className="text-white text-sm ml-1">
              {actor.place_of_birth || "Unknown birthplace"}
            </Text>
          </View>

          <View className="flex-row items-center mt-3  rounded-lg ">
            <View className="bg-[#3cab9320] flex-row p-1.5 rounded-lg items-center">
              <MaterialIcons name="trending-up" size={20} color="#FACC15" />
              <Text className="text-white font-bold text-sm ml-2">
                {actor.popularity.toFixed(1)}
              </Text>
              <Text className="text-gray text-xs ml-1">Popularity Score</Text>
            </View>
            {isFavorite && (
              <View className="ml-5 flex-row items-center bg-[#ffc4c445] rounded-full p-1.5">
                <MaterialIcons name="favorite" size={16} color="#e57373" />
                <Text className="text-[#e57373] text-xs ml-1">Favorite</Text>
              </View>
            )}
          </View>

          <Text className="text-white font-medium mt-5">Biography</Text>
          <Text className="text-gray text-sm mt-1">
            {actor.biography || "No biography available."}
          </Text>

          {actor.also_known_as && actor.also_known_as.length > 0 && (
            <ActorInfo
              label="Also Known As"
              value={actor.also_known_as.join(", ")}
            />
          )}
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

export default ActorDetails;
