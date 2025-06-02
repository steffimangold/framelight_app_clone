import { Tabs } from "expo-router";

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          display: "none", // Hide the default tab bar since we have our custom one
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="tracker" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

export default TabsLayout;
