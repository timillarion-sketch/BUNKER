import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { theme } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import LobbyScreen from '../screens/LobbyScreen';
import BrowserScreen from '../screens/BrowserScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import VpnScreen from '../screens/VpnScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeedScreen from '../screens/FeedScreen';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

type ChatStackParamList = {
  ChatList: undefined;
  Chat: { characterId: string; characterName: string; characterAvatar: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();

function ChatStackScreen() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.characterName })}
      />
    </ChatStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Лобби': '◈',
    'Браузер': '◎',
    'Лента': '▣',
    'Чат': '◆',
    'VPN': '⬡',
    'Профиль': '◉',
  };
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
        {icons[label] || '●'}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Лобби" component={LobbyScreen} />
      <Tab.Screen name="Браузер" component={BrowserScreen} />
      <Tab.Screen name="Лента" component={FeedScreen} />
      <Tab.Screen name="Чат" component={ChatStackScreen} />
      <Tab.Screen name="VPN" component={VpnScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, color: theme.colors.textMuted },
  iconFocused: { color: theme.colors.accent },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
