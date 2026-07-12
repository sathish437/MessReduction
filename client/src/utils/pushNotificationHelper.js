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
    console.warn("Service Workers or Push Notifications are not supported by this browser.");
    return;
  }

  console.log("Service worker registration started");
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("Registration success:", registration);
    
    let permission = Notification.permission;
    console.log("Notification permission status:", permission);
    if (permission === "default") {
      permission = await Notification.requestPermission();
      console.log("Requested notification permission. New status:", permission);
    }

    if (permission !== "granted") {
      console.warn("Notification permission denied.");
      return;
    }

    console.log("Push subscription creation checking existing subscription...");
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log("getSubscription() returned null. Subscribing to new push subscription...");
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      };
      subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log("New Browser push subscription created successfully:", subscription);
    } else {
      console.log("Existing push subscription found:", subscription);
    }

    console.log("Subscription endpoint:", subscription.endpoint);

    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.keys || !subscriptionJson.keys.p256dh || !subscriptionJson.keys.auth) {
      console.error("Subscription is missing keys! Keys must exist for encryption.", subscriptionJson);
      return;
    }

    const payload = {
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth
    };

    console.log("Sending subscription payload to Spring Boot backend...", payload);
    const response = await apiClient.post("/api/push/subscribe", payload);
    console.log("Backend subscription API response:", response.status, response.data);
    console.log("Push subscription synchronized with backend.");
  } catch (error) {
    console.error("Error setting up browser push notifications:", error);
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
        console.log("Push subscription removed from backend.");
      } catch (err) {
        console.error("Failed to delete push subscription from backend:", err);
      }

      await subscription.unsubscribe();
      console.log("Browser push subscription unsubscribed.");
    }
  } catch (error) {
    console.error("Error during push unsubscription:", error);
  }
}
