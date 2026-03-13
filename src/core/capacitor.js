/**
 * Capacitor native bridge — initializes plugins when running as iOS/Android app.
 * On web, all calls gracefully no-op or fall back to web APIs.
 */
import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() // 'ios' | 'android' | 'web'

// ── Status Bar ──
export async function initStatusBar() {
  if (!isNative) return
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  await StatusBar.setStyle({ style: Style.Dark })
  await StatusBar.setBackgroundColor({ color: '#1E2830' })
}

// ── Splash Screen ──
export async function hideSplash() {
  if (!isNative) return
  const { SplashScreen } = await import('@capacitor/splash-screen')
  await SplashScreen.hide()
}

// ── Keyboard ──
export async function initKeyboard() {
  if (!isNative) return
  const { Keyboard } = await import('@capacitor/keyboard')
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
  })
  Keyboard.addListener('keyboardWillHide', () => {
    document.body.style.setProperty('--keyboard-height', '0px')
  })
}

// ── Camera ──
export async function takePhoto() {
  if (!isNative) return null
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
  const photo = await Camera.getPhoto({
    quality: 85,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt, // camera or gallery
    width: 1920,
    correctOrientation: true,
  })
  return photo // { base64String, format, webPath }
}

// ── Haptics ──
export async function hapticTap() {
  if (!isNative) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  await Haptics.impact({ style: ImpactStyle.Light })
}

export async function hapticSuccess() {
  if (!isNative) return
  const { Haptics, NotificationType } = await import('@capacitor/haptics')
  await Haptics.notification({ type: NotificationType.Success })
}

// ── Share ──
export async function shareContent({ title, text, url }) {
  if (!isNative) {
    if (navigator.share) return navigator.share({ title, text, url })
    return
  }
  const { Share } = await import('@capacitor/share')
  await Share.share({ title, text, url })
}

// ── Push Notifications ──
export async function initPush(onToken, onNotification) {
  if (!isNative) return
  const { PushNotifications } = await import('@capacitor/push-notifications')

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return

  await PushNotifications.register()

  PushNotifications.addListener('registration', (token) => {
    if (onToken) onToken(token.value)
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    if (onNotification) onNotification(notification)
  })
}

// ── Init all ──
export async function initCapacitor() {
  if (!isNative) return
  await initStatusBar()
  await initKeyboard()
  // Splash hides after app renders
  setTimeout(() => hideSplash(), 500)
}
