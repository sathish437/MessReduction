/*
 * Service Worker for Mess Reduction App.
 * Handles push notifications and notification click actions.
 */

// 1. Push Event Listener: Triggered when a push notification is received from the server or DevTools.
self.addEventListener("push", (event) => {
  // Log receipt of the push event
  console.log("Push event received");

  // A. Check Notification Permission Issues
  if (Notification.permission !== "granted") {
    console.warn("Notification permission is not granted. Current state:", Notification.permission);
    return;
  }

  // B. Parse incoming payload safely
  let title = "";
  let body = "";
  let url = "/";
  let formId = null;
  let type = null;
  let status = null;

  if (event.data) {
    try {
      // Try to parse as JSON first
      const data = event.data.json();
      console.log("Parsed JSON payload:", data);

      if (data && typeof data === "object" && !Array.isArray(data)) {
        // Check if this is a nested FCM payload structure
        const hasNotification = data.notification && typeof data.notification === "object";
        const hasData = data.data && typeof data.data === "object";

        if (hasNotification || hasData) {
          title = (data.notification && data.notification.title) || 
                  (data.data && data.data.title) || 
                  data.title;
          body = (data.notification && data.notification.body) || 
                 (data.data && data.data.message) || 
                 (data.data && data.data.body) || 
                 data.message || 
                 data.body;
          url = (data.data && data.data.url) || data.url || "/";
          formId = (data.data && data.data.formId) || data.formId || null;
          type = (data.data && data.data.type) || data.type || null;
          status = (data.data && data.data.status) || data.status || null;
        } else {
          // Flat JSON structure (e.g. from VAPID PushNotificationService)
          title = data.title;
          body = data.message || data.body;
          url = data.url || "/";
          formId = data.formId || null;
          type = data.type || null;
          status = data.status || null;
        }
      } else {
        // Parsed successfully but not an object, fallback to text format
        body = event.data.text();
      }
    } catch (err) {
      // Fall back to event.data.text()
      try {
        const textPayload = event.data.text();
        if (textPayload) {
          try {
            const parsedText = JSON.parse(textPayload);
            if (parsedText && typeof parsedText === "object" && !Array.isArray(parsedText)) {
              const hasNotification = parsedText.notification && typeof parsedText.notification === "object";
              const hasData = parsedText.data && typeof parsedText.data === "object";

              if (hasNotification || hasData) {
                title = (parsedText.notification && parsedText.notification.title) || 
                        (parsedText.data && parsedText.data.title) || 
                        parsedText.title;
                body = (parsedText.notification && parsedText.notification.body) || 
                       (parsedText.data && parsedText.data.message) || 
                       (parsedText.data && parsedText.data.body) || 
                       parsedText.message || 
                       parsedText.body;
                url = (parsedText.data && parsedText.data.url) || parsedText.url || "/";
                formId = (parsedText.data && parsedText.data.formId) || parsedText.formId || null;
                type = (parsedText.data && parsedText.data.type) || parsedText.type || null;
                status = (parsedText.data && parsedText.data.status) || parsedText.status || null;
              } else {
                title = parsedText.title;
                body = parsedText.message || parsedText.body;
                url = parsedText.url || "/";
                formId = parsedText.formId || null;
                type = parsedText.type || null;
                status = parsedText.status || null;
              }
            } else {
              body = textPayload;
            }
          } catch (jsonErr) {
            body = textPayload;
          }
        }
      } catch (textErr) {
        console.error("Failed to extract plain text payload:", textErr);
      }
    }
  }

  // Clean values
  if (title) title = title.trim();
  if (body) body = body.trim();

  // If both are completely missing, do not show any notification
  if (!title && !body) {
    console.warn("FCM notification payload is missing or empty.");
    return;
  }

  // Fallback defaults only if one of them is missing but not both
  if (!title) title = "Mess Reduction Update";
  if (!body) body = "You have a new update in the Mess Reduction portal.";

  // D. Construct options safely, ensuring fallback assets exist
  const options = {
    body: body,
    icon: "/logo.png", // Web app public folder fallback icon
    badge: "/badge.png", // Web app public folder fallback badge
    data: {
      url: url,
      formId: formId,
      type: type,
      status: status
    },
    tag: formId ? 'form-' + formId : 'general-alert',
    renotify: true
  };

  // E. Display the notification within the event lifecycle
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("Notification displayed successfully");
      })
      .catch((err) => {
        console.error("Failed to display push notification:", err);
      })
  );
});

// 2. Notification Click Event Listener: Handles user interaction when notification is clicked.
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked");

  // Close the notification window immediately
  event.notification.close();

  // Retrieve the target URL from notification data, fallback to "/" if missing
  let targetUrl = "/";
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  // Create absolute URL based on self.location.origin
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  // Wait until clients are matched and focused or a new window is opened
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Iterate through existing open window clients to see if one matches our origin
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin && "focus" in client) {
            // Focus on the already open tab and navigate it to the destination URL
            return client.focus().then((focusedClient) => {
              if ("navigate" in focusedClient) {
                return focusedClient.navigate(absoluteUrl);
              }
            });
          }
        }
        // If no matching tab is open, open a new window with the destination URL
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
      })
      .catch((err) => {
        console.error("Error handling notification click:", err);
      })
  );
});

