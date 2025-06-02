import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon = ({
  focused,
  iconName,
}: {
  focused: boolean;
  iconName: string;
}) => {
  return (
    <View className="size-full justify-center items-center">
      <MaterialIcons
        name={iconName as any}
        size={25}
        color={focused ? "#dfe3f0" : "#155443"}
      />
    </View>
  );
};

const CustomNavBar = () => {
  const router = useRouter();
  const currentPath = usePathname();
  const insets = useSafeAreaInsets();

  const navItems = [
    { path: "/(tabs)/dashboard", icon: "home-filled", label: "Home" },
    { path: "/(tabs)/saved", icon: "bookmark-outline", label: "Saved" },
    { path: "/(tabs)/tracker", icon: "queue", label: "Tracker" },
    { path: "/(tabs)/search", icon: "search", label: "Search" },
    { path: "/(tabs)/profile", icon: "person", label: "Profile" },
  ];

  if (currentPath.startsWith("/(auth)")) {
    return null;
  }

  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row pt-3"
      style={{
        backgroundColor: "#3cab93",
        height: 40 + insets.bottom,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderColor: "#155443",
        elevation: 5,
      }}
    >
      {navItems.map((item) => {
        const isActive =
          currentPath.includes(item.path) ||
          (item.path.includes("dashboard") && currentPath === "/");

        return (
          <TouchableOpacity
            key={item.path}
            className="flex-1 justify-center items-center"
            onPress={() => {
              switch (item.label) {
                case "Home":
                  router.replace("/(tabs)/dashboard");
                  break;
                case "Search":
                  router.replace("/(tabs)/search");
                  break;
                case "Saved":
                  router.replace("/(tabs)/saved");
                  break;
                case "Tracker":
                  router.replace("/(tabs)/tracker");
                  break;
                case "Profile":
                  router.replace("/(tabs)/profile");
                  break;
                default:
                  router.replace("/");
              }
            }}
          >
            <TabIcon focused={isActive} iconName={item.icon} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomNavBar;
