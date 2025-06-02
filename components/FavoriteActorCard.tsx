import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

interface FavoriteActorCardProps {
  id: string;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  onPress: () => void;
  variant?: "default" | "small";
}

const FavoriteActorCard = ({
  id,
  name,
  profile_path,
  known_for_department,
  onPress,
  variant = "default", // Default to the regular size
}: FavoriteActorCardProps) => {
  const screenWidth = Dimensions.get("window").width;
  // Adjust card width based on variant
  const cardWidth =
    variant === "small" ? screenWidth * 0.25 : screenWidth * 0.4;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: cardWidth,
        marginHorizontal: variant === "small" ? 3 : 4,
      }}
      className={variant === "small" ? "mb-2" : "mb-4"}
    >
      <View className="rounded-xl overflow-hidden bg-[#161f24]">
        {/* Actor Image with Gradient */}
        <View className="relative">
          <Image
            source={{
              uri: profile_path
                ? `https://image.tmdb.org/t/p/${variant === "small" ? "w185" : "w342"}${profile_path}`
                : "https://placeholder.co/600x400/1a1a1a/ffffff.png",
            }}
            style={{
              width: "100%",
              height: variant === "small" ? cardWidth * 1.2 : cardWidth * 1.5,
            }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(22, 31, 36, 0.8)", "#161f24"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: variant === "small" ? 40 : 70,
            }}
          />

          {/* Favorite Icon - only show in default variant */}
          {variant === "default" && (
            <View className="absolute top-2 right-2 bg-[#00000080] rounded-full p-1.5">
              <MaterialIcons name="favorite" size={16} color="#e57373" />
            </View>
          )}
        </View>

        {/* Actor Name and Role */}
        <View className={variant === "small" ? "p-2" : "p-3"}>
          <Text
            className={`text-white font-bold ${variant === "small" ? "text-xs" : "text-base"}`}
            numberOfLines={variant === "small" ? 1 : 2}
          >
            {name}
          </Text>

          {known_for_department && variant === "default" && (
            <View className="mt-1 flex-row items-center">
              <MaterialIcons
                name={
                  known_for_department === "Acting" ? "theater-comedy" : "movie"
                }
                size={14}
                color="#3cab93"
              />
              <Text className="text-gray text-xs ml-1">
                {known_for_department}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FavoriteActorCard;
