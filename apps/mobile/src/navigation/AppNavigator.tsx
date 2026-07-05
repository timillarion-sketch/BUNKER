import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAccent } from '../core/AccentContext';
import { theme as baseTheme } from '../theme';
import FloatingTabBar from '../components/FloatingTabBar';

import LoginScreen from '../screens/LoginScreen';
import LobbyScreen from '../screens/LobbyScreen';
import BrowserScreen from '../screens/BrowserScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserChatScreen from '../screens/UserChatScreen';
import SecretArchiveScreen from '../screens/SecretArchiveScreen';
import SurvivalMenuScreen from '../screens/SurvivalMenuScreen';
import AdminTemplatesScreen from '../screens/AdminTemplatesScreen';
import AiChatScreen from '../screens/AiChatScreen';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  SurvivalMenu: undefined;
  AdminTemplates: undefined;
};

type PersonalStackParamList = {
  Lobby: undefined;
  AiChat: { characterId: string; characterName: string; characterAvatar: string; systemPrompt?: string };
  Chat: { characterId: string; characterName: string; characterAvatar: string };
};

type ChatStackParamList = {
  ChatList: undefined;
  UserChat: { peerId: string; roomId: string };
  SecretArchive: undefined;
  SecretContactSearch: { mode: string };
  SurvivalMenu: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const PersonalStack = createNativeStackNavigator<PersonalStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();

function PersonalNavigator() {
  return (
    <PersonalStack.Navigator screenOptions={{ headerShown: false }}>
      <PersonalStack.Screen name="Lobby" component={LobbyScreen} />
      <PersonalStack.Screen
        name="AiChat"
        component={AiChatScreen}
        options={{ headerShown: true }}
      />
      <PersonalStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: true }}
      />
    </PersonalStack.Navigator>
  );
}

function ChatStackScreen() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen
        name="UserChat"
        component={UserChatScreen}
        options={{ headerShown: true }}
      />
      <ChatStack.Screen
        name="SecretArchive"
        component={SecretArchiveScreen}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen
        name="SurvivalMenu"
        component={SurvivalMenuScreen}
        options={{ headerShown: false }}
      />
    </ChatStack.Navigator>
  );
}

export const TAB_BAR_HEIGHT = 80;

function MainTabs() {
  const { accent } = useAccent();
  const theme = { ...baseTheme, colors: { ...baseTheme.colors, accent } };

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        swipeEnabled: false,
      }}
    >
      <Tab.Screen name="Персонал" component={PersonalNavigator} />
      <Tab.Screen name="Браузер" component={BrowserScreen} />
      <Tab.Screen
        name="Сообщения"
        component={ChatStackScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.reset({ index: 0, routes: [{ name: 'Сообщения' }] });
          },
        })}
      />
      <Tab.Screen name="Контент" component={FeedScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="SurvivalMenu" component={SurvivalMenuScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="AdminTemplates" component={AdminTemplatesScreen} options={{ headerShown: false }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
