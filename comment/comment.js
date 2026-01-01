document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const gridEl = document.getElementById("wish-grid");

  let wishes = [];

  const setStatus = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
  };

  const normalizeWish = (entry, index) => {
    const text = typeof entry?.text === "string" ? entry.text.trim() : "";
    if (!text) return null;
    const name =
      typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : "匿名";
    return {
      id: entry.id || `wish-${index}`,
      text,
      name
    };
  };

  const createCard = (wish) => {
    const card = document.createElement("article");
    card.className = "card";

    const textEl = document.createElement("p");
    textEl.className = "card-text";
    textEl.textContent = wish.text;

    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent = `from ${wish.name}`;

    card.append(textEl, nameEl);
    return card;
  };

  const renderGrid = () => {
    if (!gridEl) return;
    gridEl.innerHTML = "";

    if (!wishes.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "まだカードがありません。";
      gridEl.appendChild(empty);
      return;
    }

    wishes.forEach((wish) => {
      gridEl.appendChild(createCard(wish));
    });
  };

  const fetchWishes = async () => {
    setStatus("読み込み中…");
    const fetchEntries = window.firebaseGetCommentEntries;
    const fetchLegacy = window.firebaseGetComments;

    try {
      let raw = [];
      if (typeof fetchEntries === "function") {
        raw = await fetchEntries(200);
      } else if (window.firebase?.firestore) {
        const db = window.firebase.firestore();
        const snap = await db.collection("comments").orderBy("createdAt", "desc").limit(200).get();
        raw = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } else if (typeof fetchLegacy === "function") {
        const texts = await fetchLegacy(200);
        raw = texts.map((text, index) => ({ id: `legacy-${index}`, text, name: "" }));
      } else {
        setStatus("Firebaseが準備できていません。", true);
        return;
      }

      wishes = raw.map((entry, index) => normalizeWish(entry, index)).filter(Boolean);

      if (!wishes.length) {
        setStatus("まだカードがありません。", false);
        renderGrid();
        return;
      }

      const countText = `カード ${wishes.length} 件`;
      setStatus(countText, false);
      renderGrid();
    } catch (err) {
      console.error(err);
      setStatus("読み込みに失敗しました。時間をおいて再試行してください。", true);
    }
  };

  fetchWishes();
});
