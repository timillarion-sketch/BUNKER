import { install } from 'react-native-quick-crypto';
install();
import { initSentry } from './src/services/SentryService';
initSentry();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
