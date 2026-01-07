/**
 * Platform Detection Utilities
 * Reusable helpers for identifying iOS Safari, installed PWAs, and
 * push notification capability on Apple platforms.
 */

const IOS_VERSION_REGEX = /OS (\d+)[._](\d+)/;
const MIN_IOS_PUSH_VERSION = 16.4;

/** Detects iOS Safari including iPadOS. @public */
export function isIOSSafari(): boolean {
  const userAgent = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
}

/** Parse iOS version from user agent (e.g., 16.3). Returns null on non-iOS platforms. @public */
export function getIOSVersion(): number | null {
  if (!isIOSSafari()) {
    return null;
  }

  const match = navigator.userAgent.match(IOS_VERSION_REGEX);
  if (!match) {
    return null;
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10) || 0;
  return parseFloat(`${major}.${minor}`);
}

/** Check if push notifications are supported (iOS 16.4+). @public */
export function isiOSPushSupported(): boolean {
  const iosVersion = getIOSVersion();
  return iosVersion !== null && iosVersion >= MIN_IOS_PUSH_VERSION;
}

/** Detect if running as installed PWA (checks display-mode and iOS standalone). @public */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** Returns minimum iOS version supporting push notifications (16.4). @internal */
export function getMinimumIOSPushVersion(): number {
  return MIN_IOS_PUSH_VERSION;
}
