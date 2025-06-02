// app/_layout.tsx
import { Stack, usePathname } from "expo-router";
import React from "react";
import { LogBox, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import CustomNavBar from "../components/CustomNavBar";
import FirebaseInit from "./_utils/FirebaseInit";
import "./globals.css";

// Ignore common Firebase warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted",
  "@firebase/auth: Auth",
  "Setting a timer",
  "Constants.platform.ios.model",
  "FirebaseError: Firebase",
  "Component auth has not been registered",
]);

// Root layout component - must be exported as default
export default function RootLayout() {
  const pathname = usePathname();

  const isAuthScreen =
    pathname.includes("(auth)") ||
    pathname.includes("login") ||
    pathname.includes("register") ||
    pathname.includes("welcome") ||
    pathname === "/";

  // Only show navbar on non-auth screens
  const showNavbar = !isAuthScreen;

  return (
    <SafeAreaProvider>
      <FirebaseInit>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <StatusBar hidden={true} />
            <Stack screenOptions={{ headerShown: false }} />
            {showNavbar && <CustomNavBar />}
            <Toast />
          </View>
        </GestureHandlerRootView>
      </FirebaseInit>
    </SafeAreaProvider>
  );
}
