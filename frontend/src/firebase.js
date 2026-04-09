import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA7v67S1jVmVssE62A_wOKb6EROPqdSQTE",
  authDomain: "icontower-a56b0.firebaseapp.com",
  projectId: "icontower-a56b0",
  storageBucket: "icontower-a56b0.firebasestorage.app",
  messagingSenderId: "1021508222098",
  appId: "1:1021508222098:web:004e3c51b3830cb001ba4b",
  measurementId: "G-TJ4G6MQEVS"
};

const app = initializeApp(firebaseConfig);

// Create a promise that resolves to messaging once supported
const messagingPromise = isSupported().then((supported) => {
  if (supported) {
    const m = getMessaging(app);
    console.log("✅ Firebase Messaging initialized");
    return m;
  } else {
    console.warn("⚠️ Firebase Messaging is not supported in this browser/context.");
    return null;
  }
}).catch((err) => {
  console.warn("⚠️ Firebase Messaging check failed.", err);
  return null;
});

export const requestForToken = async (userId, apiBase) => {
  const messaging = await messagingPromise;
  if (!messaging) {
    console.warn("❌ Messaging not available, skipping token request");
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('❌ Service workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log("✅ Service Worker registered:", registration.scope);

    const currentToken = await getToken(messaging, {
      vapidKey: 'BKf3062_Zw0hWPIKJQpPzrs1KRM-MF6Dh8PWqwnoPxG5pqVrQV18su82XKmAlkG0HL3-bvuVQeaIdhD6F6OK4uA',
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('✅ FCM Token obtained:', currentToken.slice(0, 20) + '...');

      const res = await fetch(`${apiBase}/auth/save-fcm-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fcmToken: currentToken }),
      });
      const data = await res.json();
      console.log("✅ FCM Token saved to backend:", data);
      return currentToken;
    } else {
      console.warn('⚠️ No registration token available. Check notification permissions.');
      return null;
    }
  } catch (err) {
    console.error('❌ FCM Token retrieval failed:', err);
    if (err.code === 'messaging/permission-blocked') {
      console.warn('⚠️ Notifications are blocked by the user. Enable in browser settings.');
    }
    return null;
  }
};

// FIXED: Use a callback-based listener instead of a one-shot Promise.
// This keeps listening for ALL foreground messages, not just the first one.
export const onMessageListener = (callback) => {
  messagingPromise.then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      console.log("🔔 Foreground message received:", payload);
      callback(payload);
    });
    console.log("✅ Foreground message listener active");
  });
};
