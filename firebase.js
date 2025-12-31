/* global firebase */
(function () {
  const getConfig = () => {
    if (typeof "AIzaSyCQHe6oqqp9dWPLTnbuSevPtH-OM61nmmg" !== "undefined") {
      return {
        apiKey: "AIzaSyCQHe6oqqp9dWPLTnbuSevPtH-OM61nmmg",
        authDomain: "hideend-8d9cc.firebaseapp.com",
        projectId: "hideend-8d9cc",
        storageBucket: "hideend-8d9cc.firebasestorage.app",
        messagingSenderId: "73697262710",
        appId: "1:73697262710:web:ba8aa964343f65e11cf357",
        measurementId: "G-4YW1T5E2B6"
      };
    }
    if (window.FIREBASE_CONFIG) return window.FIREBASE_CONFIG;
    console.warn("Firebase config is not defined.");
    return null;
  };

  const config = getConfig();
  if (!config || !window.firebase) {
    console.warn("Firebase not initialized. Missing config or firebase SDK.");
    return;
  }

  const app = firebase.initializeApp(config);
  if (firebase.analytics) {
    firebase.analytics(app);
  }
  const db = firebase.firestore();

  const addComment = async ({ text, name }) => {
    const docRef = await db.collection("comments").add({
      text,
      name: name || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      source: "home"
    });
    return docRef.id;
  };

  const addRanking = async ({ name, score, game }) => {
    const col = db.collection("ranking");
    const docRef = await col.add({
      name: name || "名無し",
      score: Number(score) || 0,
      game: game || "unknown",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  };

  const getRanking = async (game, limitCount = 5) => {
    const snap = await db.collection("ranking").get();
    const filtered = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => d.game === game);
    filtered.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    return filtered.slice(0, limitCount);
  };

  const getComments = async (limitCount = 30) => {
    try {
      const snap = await db.collection("comments").orderBy("createdAt", "desc").limit(limitCount).get();
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => typeof d.text === "string" && d.text.trim() !== "")
        .map((d) => d.text.trim());
    } catch (err) {
      console.error("comments fetch failed", err);
      return [];
    }
  };

  window.firebaseAddComment = addComment;
  window.firebaseAddRanking = addRanking;
  window.firebaseGetRanking = getRanking;
  window.firebaseGetComments = getComments;
})();
