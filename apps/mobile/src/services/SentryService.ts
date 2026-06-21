import * as Sentry from '@sentry/react-native';

export function initSentry(): void {
  Sentry.init({
    dsn: process.env.SENTRY_MOBILE_DSN ?? '',
    enabled: !!process.env.SENTRY_MOBILE_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    enableNative: true,
    enableNativeCrashHandling: true,
    attachStacktrace: true,
    sendDefaultPii: false,
  });
}

export { Sentry };
