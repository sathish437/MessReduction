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

  // B. Define default values in case payload is missing or invalid
  let title = "Test Notification";
  let body = "No payload received.";
  let url = "/";

  // C. Parse incoming payload safely
  if (event.data) {
    try {
      // 1. Try to parse as JSON first (Requirement 3 & 5)
      const data = event.data.json();

      // Check if the parsed object is a valid JSON object structure
      if (data && typeof data === "object" && !Array.isArray(data)) {
        console.log("Received JSON payload");
        title = data.title || "Test Notification";
        body = data.message || "No payload received.";
        url = data.url || "/";
      } else {
        // Parsed successfully but not an object, fallback to text format (Requirement 5)
        console.log("Received text payload");
        body = event.data.text() || "No payload received.";
      }
    } catch (err) {
      // 2. If event.data.json() fails, fall back to event.data.text() (Requirement 4, 5 & 7)
      console.log("Received text payload");
      try {
        const textPayload = event.data.text();
        if (textPayload) {
          // Check if the text itself contains a valid JSON string (double safety check)
          try {
            const parsedText = JSON.parse(textPayload);
            if (parsedText && typeof parsedText === "object" && !Array.isArray(parsedText)) {
              title = parsedText.title || "Test Notification";
              body = parsedText.message || "No payload received.";
              url = parsedText.url || "/";
            } else {
              body = textPayload;
            }
          } catch (jsonErr) {
            // If text is not JSON, treat it as plain text payload
            body = textPayload;
          }
        }
      } catch (textErr) {
        console.error("Failed to extract plain text payload:", textErr);
        body = "No payload received.";
      }
    }
  } else {
    // 3. Handle missing payload (Requirement 7)
    console.log("Received text payload");
  }

  // D. Construct options safely, ensuring fallback assets exist
  const options = {
    body: body,
    icon: "/logo.png", // Web app public folder fallback icon
    badge: "/badge.png", // Web app public folder fallback badge
    data: {
      url: url
    }
  };

  // E. Display the notification within the event lifecycle
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("Notification displayed");
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

