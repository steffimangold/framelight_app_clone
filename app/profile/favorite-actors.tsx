// app/profile/favorite-actors.tsx
import FavoriteActorCard from "@/components/FavoriteActorCard";
import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface FavoriteActorData {
  id: string;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  addedAt: any; // Firestore timestamp
}

export default function FavoriteActorsScreen() {
  const [actors, setActors] = useState<FavoriteActorData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const screenWidth = Dimensions.get("window").width;

  const numColumns = 2;
  const cardWidth = (screenWidth - 40) / numColumns; // 40 = padding (16 * 2 + gap 8)

  useEffect(() => {
    fetchFavoriteActors();
  }, []);

  const fetchFavoriteActors = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }

    try {
      setLoading(true);
      const actorsRef = collection(db, "users", user.uid, "favoriteActors");
      const q = query(actorsRef, orderBy("addedAt", "desc"));
      const actorsSnap = await getDocs(q);

      const actorsData = actorsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as FavoriteActorData[];

      setActors(actorsData);
    } catch (error) {
      console.error("Error fetching favorite actors:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load favorite actors",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-10">
      <View className="bg-[#172730] p-8 rounded-3xl items-center w-72 border border-[#3cab9340]">
        <View className="bg-[#3cab9320] p-4 rounded-full mb-4">
          <MaterialIcons name="people" size={50} color="#3cab93" />
        </View>
        <Text className="text-white font-semibold text-lg text-center mb-2">
          No favorite actors yet
        </Text>
        <Text className="text-gray text-center text-sm mb-4">
          When you favorite an actor, they'll appear here
        </Text>
        <TouchableOpacity
          className="bg-[#3cab93] py-3 px-6 rounded-full"
          onPress={() => router.push("../(tabs)")}
        >
          <Text className="text-white font-medium">Explore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActorItem = ({
    item,
    index,
  }: {
    item: FavoriteActorData;
    index: number;
  }) => (
    <View style={{ width: cardWidth, padding: 4 }}>
      <FavoriteActorCard
        id={item.id}
        name={item.name}
        profile_path={item.profile_path}
        known_for_department={item.known_for_department}
        onPress={() => router.push(`/actor/${item.id}`)}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-primary pb-10">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="w-full flex-row items-center mt-12 mb-6 px-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Favorite Actors</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3cab93" />
        </View>
      ) : actors.length === 0 ? (
        renderEmptyList()
      ) : (
        <FlatList
          data={actors}
          renderItem={renderActorItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns.toString()}
          contentContainerStyle={{ padding: 8 }}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          ListHeaderComponent={
            <View className="px-4 mb-4">
              <Text className="text-white text-sm">
                {actors.length} {actors.length === 1 ? "Actor" : "Actors"}
              </Text>
            </View>
          }
        />
      )}

      <Toast />
    </View>
  );
}
