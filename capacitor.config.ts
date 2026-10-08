import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'

/**
 * Mobile bootstrap for the community fork.
 *
 * The upstream repository ships Capacitor dependencies and mobile build scripts
 * but does not version the generated native Android project. Keep the native
 * project generated from this config so it can be reproduced locally and in CI.
 *
 * appId is intentionally distinct from the official Chatbox application so
 * test APKs can coexist with it on the same Android device.
 */
const config: CapacitorConfig = {
  appId: 'io.github.joselofariasbyte.chatbox',
  appName: 'Chatbox Fork',
  webDir: 'release/app/dist/renderer',
  backgroundColor: '#ffffff',
  loggingBehavior: 'debug',
  android: {
    path: 'android',
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
}

export default config
