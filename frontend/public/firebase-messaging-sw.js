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
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Modify this to your icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
