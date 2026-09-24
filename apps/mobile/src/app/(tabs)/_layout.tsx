import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="recherche" />
      <Tabs.Screen name="reservations" />
      <Tabs.Screen name="compte" />
    </Tabs>
  );
}
