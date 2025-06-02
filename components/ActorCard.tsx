// components/ActorCard.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ActorCardProps {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  known_for?: Array<any>; // For showing what they're known for
}

const ActorCard: React.FC<ActorCardProps> = ({
  id,
  name,
  profile_path,
  known_for_department = "Acting",
  known_for = [],
}) => {
  const router = useRouter();

  // Get the most popular work they're known for
  const mostKnownFor =
    known_for && known_for.length > 0
      ? known_for[0]?.title || known_for[0]?.name
      : null;

  return (
    <TouchableOpacity
      className="w-full" // Use full width of the parent container
      onPress={() => router.push(`/actor/${id}`)}
      activeOpacity={0.8}
    >
      <View className="items-center">
        {/* Actor Image */}
        <View className="w-full aspect-[2/3] rounded-md mb-2 overflow-hidden">
          <Image
            source={
              profile_path
                ? { uri: `https://image.tmdb.org/t/p/w185${profile_path}` }
                : require("@/assets/images/poster-placeholder.png")
            }
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Actor Name */}
        <Text
          className="text-white text-xs font-bold text-center w-full"
          numberOfLines={2}
        >
          {name}
        </Text>

        {/* Department or Known For */}
        <Text
          className="text-gray text-[10px] text-center mt-1"
          numberOfLines={1}
        >
          {mostKnownFor || known_for_department}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ActorCard;
