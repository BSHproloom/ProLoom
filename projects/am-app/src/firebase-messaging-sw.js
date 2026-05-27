importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDf2QdH38aOtghzhJrP349vYhJCCBzfK5k",
  authDomain: "proloom-2026-3bb5a.firebaseapp.com",
  projectId: "proloom-2026-3bb5a",
  storageBucket: "proloom-2026-3bb5a.firebasestorage.app",
  messagingSenderId: "429232642189",
  appId: "1:429232642189:web:d24150a8b2458eb412aac4",
  measurementId: "G-RVQ9D6XEQ4"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
