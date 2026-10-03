/** Petite vibration au toucher (Android). Sans effet sur iPhone / ordinateur. */
export function haptic(ms = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* noop */
  }
}
