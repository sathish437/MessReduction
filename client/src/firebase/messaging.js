import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, isFirebaseConfigured } from './firebaseConfig';
import apiClient from '../api/apiClient';

let messagingInstance = null;
let isMessagingSupported = null;

export const checkMessagingSupport = async () => {
  if (isMessagingSupported !== null) {
    return isMessagingSupported;
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
    isMessagingSupported = false;
    return false;
  }
  if (!isFirebaseConfigured() || !app) {
    isMessagingSupported = false;
    return false;
  }
  try {
    isMessagingSupported = await isSupported();
    return isMessagingSupported;
  } catch (e) {
    isMessagingSupported = false;
    return false;
  }
};

export const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;
  const supported = await checkMessagingSupport();
  if (supported && app) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

/**
 * Requests notification permission, retrieves FCM device registration token,
 * and registers it with the Spring Boot backend.
 */
export const requestFcmToken = async () => {
  try {
    const supported = await checkMessagingSupport();
    if (!supported) {
      return null;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const registration = await navigator.serviceWorker.ready;

    const tokenOptions = {
      serviceWorkerRegistration: registration,
    };
    if (vapidKey && vapidKey.trim()) {
      tokenOptions.vapidKey = vapidKey.trim();
    }

    const currentToken = await getToken(messaging, tokenOptions);

    if (currentToken) {
      const alreadyRegistered = sessionStorage.getItem('fcm_token_registered');
      if (alreadyRegistered !== currentToken) {
        await apiClient.post('/api/notifications/fcm-token', {
          token: currentToken,
          platform: 'web',
        });
        sessionStorage.setItem('fcm_token_registered', currentToken);
        localStorage.setItem('fcm_current_token', currentToken);
      }
      return currentToken;
    }
  } catch (error) {
    // Non-blocking error handling
  }
  return null;
};

/**
 * Unregisters the current device's FCM token with the backend upon logout.
 */
export const unregisterFcmToken = async () => {
  try {
    const currentToken = localStorage.getItem('fcm_current_token') || sessionStorage.getItem('fcm_token_registered');
    if (currentToken) {
      await apiClient.delete('/api/notifications/fcm-token', {
        data: { token: currentToken },
      });
    }
    sessionStorage.removeItem('fcm_token_registered');
    localStorage.removeItem('fcm_current_token');
  } catch (error) {
    // Non-blocking cleanup
  }
};

/**
 * Sets up a listener for foreground FCM messages.
 * Returns a cleanup function for React useEffect to avoid duplicate listeners in StrictMode.
 */
export const setupForegroundNotificationListener = (callback) => {
  let unsubscribe = () => {};
  let isSubscribed = true;

  getMessagingInstance().then((messaging) => {
    if (messaging && isSubscribed) {
      unsubscribe = onMessage(messaging, (payload) => {
        if (callback && typeof callback === 'function') {
          callback(payload);
        }
      });
    }
  });

  return () => {
    isSubscribed = false;
    if (unsubscribe) {
      unsubscribe();
    }
  };
};
