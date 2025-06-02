// components/LargeMovieTicket.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

interface LargeMovieTicketProps {
  id: string;
  title: string;
  poster_path: string;
  type: string;
  watchedAt: any; // Firestore timestamp
  vote_average?: number;
  onPress: () => void;
}

const LargeMovieTicket = ({
  id,
  title,
  poster_path,
  type,
  watchedAt,
  vote_average,
  onPress,
}: LargeMovieTicketProps) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "Unknown date";

    const date = timestamp.toDate();

    const day = date.getDate();
    // Get month name in German
    const month = date.toLocaleString("de-DE", { month: "short" });
    const year = date.getFullYear();

    return `${day}. ${month} ${year}`;
  };

  const screenWidth = Dimensions.get("window").width;
  const ticketWidth = screenWidth * 0.85;

  return (
    <View
      style={{ width: ticketWidth, marginHorizontal: 10 }}
      className="bg-[#161f24] rounded-xl overflow-hidden border-r-2 border-l-2 border-b-2 border-secondary "
    >
      {/* Top curve cutout */}
      <View
        style={{
          width: 60,
          height: 30,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          backgroundColor: "#12232F",
          alignSelf: "center",
          position: "absolute",
          top: -15,
          zIndex: 10,
        }}
      />

      {/* Poster with gradient overlay */}
      <View className="relative">
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w500${poster_path}`,
          }}
          style={{ width: "100%", height: 380 }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(22, 31, 36, 0.8)", "#161f24"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
          }}
        />
      </View>

      {/* Title section */}
      <View className="px-4 pt-2 pb-4 items-center">
        <Text className="text-white font-bold text-xl text-center">
          {title.toUpperCase()}
        </Text>

        <View className="flex-row items-center mt-1">
          <MaterialIcons
            name={type === "tv" ? "tv" : "movie"}
            size={14}
            color="#888"
          />
          <Text className="text-gray text-xs ml-1">
            {type === "tv" ? "TV Show" : "Movie"}
          </Text>
        </View>
      </View>

      {/* Ticket divider */}
      <View className="relative">
        {/* Dotted line */}
        <View className="flex-row justify-center py-2">
          {Array(25)
            .fill(0)
            .map((_, i) => (
              <View
                key={i}
                className="h-1.5 w-1.5 mx-1 rounded-full bg-white opacity-30"
              />
            ))}
        </View>
      </View>

      {/* Ticket info section */}
      <View className="flex-row justify-between pl-4 pr-4 pt-2 pb-2">
        <View>
          <Text className="text-gray text-xs">Ticket</Text>
          <Text className="text-[#3cab93] font-bold text-lg">
            #{id.slice(-6)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-gray text-xs text-right">Watched on</Text>
          <Text className="text-[#3cab93] font-bold">
            {formatDate(watchedAt)}
          </Text>
        </View>
      </View>

      {/* Whole ticket is touchable */}
      <TouchableOpacity
        className="absolute top-0 left-0 right-0 bottom-0"
        onPress={onPress}
        activeOpacity={0.8}
      />
    </View>
  );
};

export default LargeMovieTicket;
