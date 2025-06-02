import PosterCard from "@/components/PosterCard";
import { fetchMovies, fetchTVShows } from "@/services/api";
import useFetch from "@/services/useFetch";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function Index() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
    refetch: refetchMovies,
  } = useFetch(() => fetchMovies({ query: "", sortBy: "popularity.desc" }));

  const {
    data: tvShows,
    loading: tvLoading,
    error: tvError,
    refetch: refetchTVShows,
  } = useFetch(() => fetchTVShows("trending"));

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both data sources simultaneously
      await Promise.all([refetchMovies(), refetchTVShows()]);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3cab93"]} // Android
            tintColor="#3cab93" // iOS
            title="Pull to refresh" // iOS
            titleColor="#ffffff" // iOS
          />
        }
      >
        {/* Logo */}
        <View className="w-full flex items-center justify-center mt-14 mb-6">
          <Image
            source={require("../../assets/icons/logo-227.png")}
            style={{ width: 75, height: 75 }}
            resizeMode="contain"
          />
        </View>

        {/* Content Container */}
        <View className="px-5">
          {/* Popular Movies */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg text-white font-bold">Popular Movies</Text>
          </View>

          {moviesLoading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#3cab93"
              className="mt-5 self-center"
            />
          ) : moviesError ? (
            <Text className="text-red-500">Error: {moviesError.message}</Text>
          ) : (
            <FlatList
              data={movies}
              renderItem={({ item }) => (
                <View>
                  <PosterCard
                    {...item}
                    media_type="movie"
                    id={Number(item.id)}
                  />
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            />
          )}

          {/* Popular TV Shows */}
          <View className="flex-row items-center justify-between mb-2 mt-8">
            <Text className="text-lg text-white font-bold">
              Popular TV Shows
            </Text>
          </View>

          {tvLoading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#3cab93"
              className="mt-5 self-center"
            />
          ) : tvError ? (
            <Text className="text-red-500">Error: {tvError.message}</Text>
          ) : (
            <FlatList
              data={tvShows}
              renderItem={({ item }) => (
                <View>
                  <PosterCard
                    id={Number(item.id)}
                    title={item.name}
                    poster_path={item.poster_path}
                    vote_average={item.vote_average}
                    release_date={item.first_air_date}
                    media_type="tv"
                  />
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
