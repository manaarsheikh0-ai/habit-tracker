self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/")
  );
});

self.addEventListener("message", function (event) {
  if (event.data.type === "schedule") {
    const { title, body, time } = event.data;

    const delay = time - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: "/manifest.json",
        });
      }, delay);
    }
  }
});
