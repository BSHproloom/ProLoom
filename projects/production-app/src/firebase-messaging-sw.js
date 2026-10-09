importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBFt5u7lHBDJkCgBfVb82wSyNp7Fa7H6Ow",
  authDomain: "proloom-bsh.firebaseapp.com",
  projectId: "proloom-bsh",
  storageBucket: "proloom-bsh.firebasestorage.app",
  messagingSenderId: "497053348447",
  appId: "1:497053348447:web:32355b283cddff86b8a1ea",
  measurementId: "G-F304GG9E92"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
