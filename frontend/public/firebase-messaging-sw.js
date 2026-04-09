importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyA7v67S1jVmVssE62A_wOKb6EROPqdSQTE",
  authDomain: "icontower-a56b0.firebaseapp.com",
  projectId: "icontower-a56b0",
  storageBucket: "icontower-a56b0.firebasestorage.app",
  messagingSenderId: "1021508222098",
  appId: "1:1021508222098:web:004e3c51b3830cb001ba4b",
  measurementId: "G-TJ4G6MQEVS"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  // Use webpush notification if available, fall back to notification, then data
  const title = payload.notification?.title || payload.data?.title || 'Icon Tower';
  const body = payload.notification?.body || payload.data?.body || 'You have a new update';

  const notificationOptions = {
    body: body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'icon-tower-' + Date.now(), // Unique tag so notifications don't collapse
    requireInteraction: true,        // Stay visible until user clicks
    vibrate: [200, 100, 200],        // Vibrate pattern for mobile
    data: { url: '/' }
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click - open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('ic-project') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow('/');
    })
  );
});
