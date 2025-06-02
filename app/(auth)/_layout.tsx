import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

export default function AuthLayout() {
  useEffect(() => {
    StatusBar.setHidden(true);

    return () => {};
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
