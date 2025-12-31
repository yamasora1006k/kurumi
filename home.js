document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("comment-form");
  const input = document.getElementById("comment-input");
  const submitBtn = form?.querySelector(".comment-submit");
  const nameInput = document.getElementById("comment-name");
  const statusEl = document.getElementById("comment-status");
  const playedEl = document.getElementById("played-count");
  const mysteryEl = document.getElementById("mystery-total");
  const todayEl = document.getElementById("today-count");
  const labelPlayed = document.getElementById("label-played");
  const labelMystery = document.getElementById("label-mystery");
  const labelToday = document.getElementById("label-today");



  const saveToFirebase = async (payload) => {
    const fn = window.firebaseAddComment;
    if (typeof fn !== "function") {
      statusEl && (statusEl.textContent = "送信できませんでした（Firebase未準備）");
      return;
    }
    await fn(payload);
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!input) return;
    const name = nameInput ? nameInput.value.trim() : "";
    const text = input.value.trim();
    if (!text) return;
    submitBtn && (submitBtn.disabled = true);
    statusEl && (statusEl.textContent = "送信中...");
    try {
      await saveToFirebase({ text, name });
      statusEl && (statusEl.textContent = "送信しました");
      input.value = "";
    } catch (err) {
      console.error(err);
      statusEl && (statusEl.textContent = "送信に失敗しました");
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const getCookie = (key) => {
    const found = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
    return found ? decodeURIComponent(found.split("=")[1]) : "";
  };

  const ensureUserId = () => {
    const key = "kurumi-user-id";
    const existing = getCookie(key);
    if (existing) return existing;
    const fresh = `u-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    document.cookie = `${key}=${encodeURIComponent(fresh)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    return fresh;
  };

  const loadStats = () => {
    const userId = ensureUserId();
    const storageKey = `stats-data-${userId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const todayKey = new Date().toDateString();
    if (stored.date !== todayKey) {
      stored.date = todayKey;
      stored.today = rand(3, 27);
    }
    stored.played = typeof stored.played === "number" ? stored.played + rand(1, 9) : rand(50, 999);
    stored.mystery = rand(10, 9999);

    const playedLabels = ["Played:", "step:"];
    const mysteryLabels = ["??? /", "Secret /", "???", "??? →"];
    const todayLabels = ["Today:", "???:", "today:"];

    if (labelPlayed) labelPlayed.textContent = pick(playedLabels);
    if (labelMystery) labelMystery.textContent = pick(mysteryLabels);
    if (labelToday) labelToday.textContent = pick(todayLabels);

    localStorage.setItem(storageKey, JSON.stringify(stored));
    if (playedEl) playedEl.textContent = stored.played;
    if (mysteryEl) mysteryEl.textContent = stored.mystery;
    if (todayEl) todayEl.textContent = stored.today;
  };

  loadStats();

  // クリック音：全ボタン共通
  const clickSound = new Audio("assets/voice/PC-Mouse06-1.mp3");
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      try {
        clickSound.currentTime = 0;
        clickSound.play();
      } catch (err) {
        // 再生失敗は黙ってスキップ
        console.debug("click sound skipped", err);
      }
    },
    { capture: true }
  );

  // カード全体（card-wrap）を押したときもクリック音
  document.addEventListener(
    "click",
    (e) => {
      const cardWrap = e.target.closest(".card-wrap");
      if (!cardWrap) return;
      try {
        clickSound.currentTime = 0;
        clickSound.play();
      } catch (err) {
        console.debug("card click sound skipped", err);
      }
    },
    { capture: true }
  );
});
