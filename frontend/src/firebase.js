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

let messaging = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  } else {
    console.warn("Firebase Messaging is not supported in this browser/context.");
  }
}).catch((err) => {
  console.warn("Firebase Messaging check failed.", err);
});

export const requestForToken = (userId, apiBase) => {
  if (!messaging) return Promise.resolve(null);
  
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.register('/firebase-messaging-sw.js').then((registration) => {
      return getToken(messaging, { 
        vapidKey: 'BKf3062_Zw0hWPIKJQpPzrs1KRM-MF6Dh8PWqwnoPxG5pqVrQV18su82XKmAlkG0HL3-bvuVQeaIdhD6F6OK4uA',
        serviceWorkerRegistration: registration
      });
    }).then((currentToken) => {
      if (currentToken) {
        console.log('Current FCM Token:', currentToken);
        console.log("Saving FCM token to backend for user:", userId);
        
        return fetch(`${apiBase}/auth/save-fcm-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, fcmToken: currentToken }),
        }).then((res) => res.json()).then((data) => {
          console.log("Backend response for token save:", data);
        }).catch((e) => {
          console.error("Error saving token to backend:", e);
        });
      } else {
        console.log('No registration token available.');
      }
    }).catch((err) => {
      console.log('An error occurred while retrieving token.', err);
    });
  }
  return Promise.resolve(null);
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
