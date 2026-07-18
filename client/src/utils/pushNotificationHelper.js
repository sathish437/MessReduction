import apiClient from "../api/apiClient";

const VAPID_PUBLIC_KEY = "BPejw3UgSdG7KbS1f25tJX4GBOelpocpuEzEXoO86xHFfXPsUeJDkCtaigahspBtTbt6c107BFJlcmImfY1sZhg";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return;
    }

    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      };
      subscription = await registration.pushManager.subscribe(subscribeOptions);
    } else {
    }


    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.keys || !subscriptionJson.keys.p256dh || !subscriptionJson.keys.auth) {
      return;
    }

    const payload = {
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth
    };

    const response = await apiClient.post("/api/push/subscribe", payload);
  } catch (error) {
  }
}

export async function unregisterPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const endpoint = subscription.endpoint;
      
      try {
        await apiClient.delete(`/api/push/unsubscribe`, { data: { endpoint } });
      } catch (err) {
      }

      await subscription.unsubscribe();
    }
  } catch (error) {
  }
}
