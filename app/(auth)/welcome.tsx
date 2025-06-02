// app/(auth)/welcome.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Welcome() {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar style="light" />

      <View className="flex-1 justify-center items-center px-6">
        {/* App Logo/Branding */}
        <View className="w-24 h-24 mb-8 items-center justify-center">
          <Image
            source={require("../../assets/icons/logo-227.png")}
            style={{ width: 96, height: 96 }}
            resizeMode="contain"
          />
        </View>

        <Text className="text-white text-3xl font-bold mb-4 text-center">
          Welcome to Framelight
        </Text>

        <Text className="text-gray text-center mb-12">
          The perfect app for film and tv show enthusiasts to discover and track
          their favorites.
        </Text>

        {/* Action Buttons */}
        <View className="w-full space-y-4">
          <TouchableOpacity
            className="bg-light-100 py-4 rounded-full items-center mb-3"
            onPress={() => router.push("/(auth)/login")}
          >
            <Text className="text-white font-semibold text-lg">Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-transparent border border-gray py-4 rounded-full items-center"
            onPress={() => router.push("/(auth)/register")}
          >
            <Text className="text-white font-semibold text-lg">
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* App features highlights */}
        <View className="mt-12">
          <Text className="text-gray text-sm text-center mb-4">
            • Discover new films and tv shows
          </Text>
          <Text className="text-gray text-sm text-center mb-4">
            • Track your watched movies and watchlist
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
