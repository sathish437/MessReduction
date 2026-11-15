/*
 * Firebase Cloud Messaging Service Worker (Background Push & Click Handler)
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase Web App configuration for background service worker
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

if (firebase.apps.length === 0 && firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = (firebase.apps.length > 0) ? firebase.messaging() : null;

// Background Message Handler
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);

    if (!payload || (!payload.notification && !payload.data)) {
      console.warn("FCM notification payload is missing", payload);
      return;
    }

    let title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title);
    let body = (payload.notification && payload.notification.body) || (payload.data && payload.data.message) || (payload.data && payload.data.body);
    const url = (payload.data && payload.data.url) || '/';

    if (title) title = title.trim();
    if (body) body = body.trim();

    // If both are completely missing, do not show any notification
    if (!title && !body) {
      console.warn("FCM notification payload is missing or empty.");
      return;
    }

    // Fallbacks if one is missing but not both
    if (!title) title = 'Mess Reduction Update';
    if (!body) body = 'You have a new update.';

    const notificationOptions = {
      body: body,
      icon: '/logo.png',
      badge: '/badge.png',
      data: {
        url: url,
        formId: payload.data ? payload.data.formId : null,
        type: payload.data ? payload.data.type : null,
        status: payload.data ? payload.data.status : null
      },
      tag: (payload.data && payload.data.formId && Number(payload.data.formId) > 0) ? 'form-' + payload.data.formId : (payload.data && payload.data.type ? payload.data.type.toLowerCase() + '-alert' : 'general-alert'),
      renotify: true
    };

    self.registration.showNotification(title, notificationOptions);
  });
}

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  event.notification.close();

  let targetUrl = '/';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(absoluteUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});
