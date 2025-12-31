// 選択画面のデータ（現状は固定）
const currentChoice = { id: "raisenbetsu", label: "正しい來美はどれ?!" };
const prevChoice = { id: "others", label: "その他" };
const nextChoice = { id: "utsunomiya-kurumi", label: "宇都宮來美" };

// ゲーム用データ
const namePool = [
  { text: "宇都宮來美", isTarget: true },
  { text: "宇都宮來美", isTarget: true }, // 出現頻度を少し上げるため重複
  { text: "宇都宮來美", isTarget: true }, // 出現頻度を少し上げるため重複
  { text: "宇都宮久留美", isTarget: false },
  { text: "宇都宮来美", isTarget: false },
  { text: "宇都宮來実", isTarget: false },
  { text: "宇都宮未來", isTarget: false },
  { text: "宇都宮栗実", isTarget: false },
  { text: "宇都乃宮來美", isTarget: false },
  { text: "宇都管來美", isTarget: false },
];

const GAME_TIME_START = 45.0;
const TIME_BONUS = 0.1;
const TIMER_TICK_MS = 100; // 0.1秒刻み

let score = 0;
let timeLeft = GAME_TIME_START;
let currentCard = null;
let timerId = null;
let gameActive = false;
let inputLocked = false;

const els = {};

const qs = (id) => document.getElementById(id);

const setText = (el, text) => {
  if (el) el.textContent = text;
};

const updateSelectionView = () => {
  setText(qs("choice-title"), currentChoice.label);
  setText(qs("page-title"), `${currentChoice.label} | モード選択`);

  const startEl = qs("start-button");
  if (startEl) {
    startEl.setAttribute("data-choice", currentChoice.id);
    startEl.setAttribute("aria-label", `${currentChoice.label}を開始`);
  }

  setText(qs("prev-label"), prevChoice.label);
  setText(qs("next-label"), nextChoice.label);

  // 矢印は無効のまま
  qs("prev-btn")?.setAttribute("aria-disabled", "true");
  qs("next-btn")?.setAttribute("aria-disabled", "true");
};

const pickCard = () => {
  if (!namePool.length) return null;
  const index = Math.floor(Math.random() * namePool.length);
  return namePool[index];
};

const updateGameUI = () => {
  setText(els.gameName, currentCard ? currentCard.text : "");
  setText(els.scoreBg, String(score));
  setText(els.timer, `${timeLeft.toFixed(1)} s`);
};

const stopTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const endGame = (reason) => {
  gameActive = false;
  stopTimer();

  const game = qs("game-screen");
  const gameover = qs("gameover-screen");
  if (game && gameover) {
    game.classList.add("is-hidden");
    gameover.classList.remove("is-hidden");
  }

  if (els.finalScore) {
    els.finalScore.textContent = String(score);
  }

  renderGameoverRain(score);
};

const startTimer = () => {
  stopTimer();
  timerId = setInterval(() => {
    if (!gameActive) return;
    timeLeft = Math.max(0, timeLeft - TIMER_TICK_MS / 1000);
    updateGameUI();
    if (timeLeft <= 0) {
      endGame("time");
    }
  }, TIMER_TICK_MS);
};

const nextRound = () => {
  currentCard = pickCard();
  updateGameUI();
};

const playSlideAnimation = (direction, onComplete) => {
  const el = els.gameName;
  if (!el) {
    onComplete();
    if (gameActive) inputLocked = false;
    return;
  }

  const outClass = direction === "left" ? "slide-out-left" : "slide-out-right";
  el.classList.remove("slide-out-left", "slide-out-right", "fade-in");
  // 再フローでアニメをリスタート
  void el.offsetWidth;
  el.classList.add(outClass);

  el.addEventListener(
    "animationend",
    () => {
      el.classList.remove(outClass);
      onComplete();
      // 新しいテキストを上からフェードイン
      el.classList.add("fade-in");
      el.addEventListener(
        "animationend",
        () => {
          el.classList.remove("fade-in");
          if (gameActive) {
            inputLocked = false;
          }
        },
        { once: true }
      );
    },
    { once: true }
  );
};

const showBonus = (delta) => {
  const el = els.bonus;
  const img = els.bonusImg;
  if (!el) return;

  // 50%の確率で画像を表示
  const showImg = img && Math.random() < 0.1;

  if (showImg) {
    img.classList.remove("bonus-img-pop", "is-hidden");
    void img.offsetWidth;
    img.classList.add("bonus-img-pop");
    img.addEventListener(
      "animationend",
      () => {
        img.classList.add("is-hidden");
        img.classList.remove("bonus-img-pop");
      },
      { once: true }
    );
    // 画像を出すときは数値表示をスキップ
    return;
  }

  el.textContent = `+${delta.toFixed(1)} s`;
  el.classList.remove("bonus-pop", "is-hidden");
  // アニメーションをリスタート
  void el.offsetWidth;
  el.classList.add("bonus-pop");
  el.addEventListener(
    "animationend",
    () => {
      el.classList.add("is-hidden");
      el.classList.remove("bonus-pop");
    },
    { once: true }
  );
};

const renderGameoverRain = (count) => {
  const container = els.gameoverRain;
  if (!container) return;
  container.innerHTML = "";

  const drops = Math.max(0, Math.min(count, 40));
  for (let i = 0; i < drops; i += 1) {
    const img = document.createElement("img");
    img.src = "../assets/imgs/kurumi01.png";
    img.alt = "";
    img.className = "kc-rain-img";
    img.style.left = `${Math.random() * 100}%`;
    img.style.animationDelay = `${Math.random() * 0.7}s`;
    img.style.animationDuration = `${2.3 + Math.random() * 0.8}s`;
    img.style.opacity = (0.65 + Math.random() * 0.25).toFixed(2);
    container.appendChild(img);
  }
};

const handleChoice = (direction) => {
  if (!gameActive || !currentCard || inputLocked) return;
  inputLocked = true;

  const isCorrect = currentCard.isTarget ? direction === "right" : direction === "left";

  const proceed = () => {
    if (!isCorrect) {
      endGame("mistake");
      return;
    }

    // 正解スワイプごとにスコア加算
    score += 1;
    timeLeft += TIME_BONUS;
    showBonus(TIME_BONUS);
    nextRound();
  };

  if (!isCorrect) {
    gameActive = false;
    stopTimer();
  }

  playSlideAnimation(direction, proceed);
};

const startGame = () => {
  const selection = qs("selection-screen");
  const game = qs("game-screen");
  const gameover = qs("gameover-screen");
  if (selection && game) {
    selection.classList.add("is-hidden");
    game.classList.remove("is-hidden");
  }
  if (gameover) {
    gameover.classList.add("is-hidden");
  }
  if (els.bonus) {
    els.bonus.classList.add("is-hidden");
    els.bonus.classList.remove("bonus-pop");
  }
  if (els.bonusImg) {
    els.bonusImg.classList.add("is-hidden");
    els.bonusImg.classList.remove("bonus-img-pop");
  }
  if (els.gameoverRain) {
    els.gameoverRain.innerHTML = "";
  }

  score = 0;
  timeLeft = GAME_TIME_START;
  gameActive = true;

  nextRound();
  updateGameUI();
  startTimer();
};

const wireGameControls = () => {
  els.leftBtn?.addEventListener("click", () => handleChoice("left"));
  els.rightBtn?.addEventListener("click", () => handleChoice("right"));
  els.gameoverRestart?.addEventListener("click", startGame);
  els.gameoverSave?.addEventListener("click", () => {
    const modal = qs("save-modal");
    const input = qs("save-name-input");
    if (!modal || !input) return;
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    input.value = "";
    input.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (!gameActive) return;
    if (event.key === "ArrowLeft") {
      handleChoice("left");
    } else if (event.key === "ArrowRight") {
      handleChoice("right");
    }
  });

  // タッチスワイプ対応（左右のみ）
  (() => {
    let startX = 0;
    let startY = 0;
    const threshold = 30;
    const target = qs("game-screen") || document;

    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
    };

    const onEnd = (e) => {
      if (!gameActive) return;
      const t = e.changedTouches?.[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
      handleChoice(dx > 0 ? "right" : "left");
      if (e.cancelable) e.preventDefault();
    };

    target?.addEventListener("touchstart", onStart, { passive: true });
    target?.addEventListener("touchend", onEnd, { passive: false });
  })();
};

document.addEventListener("DOMContentLoaded", () => {
  // 画面要素の参照を保持
  els.gameName = qs("game-name");
  els.scoreBg = qs("game-score-bg");
  els.timer = qs("game-timer");
  els.leftBtn = qs("game-left");
  els.rightBtn = qs("game-right");
  els.finalScore = qs("final-score");
  els.gameoverRestart = qs("gameover-restart");
  els.bonus = qs("game-bonus");
  els.bonusImg = qs("game-bonus-img");
  els.gameoverRain = qs("gameover-rain");
  els.gameoverSave = qs("gameover-save");
  els.saveModal = qs("save-modal");
  els.saveInput = qs("save-name-input");
  els.saveSubmit = qs("save-name-submit");
  els.saveCancel = qs("save-name-cancel");

  updateSelectionView();
  wireGameControls();

  const closeSaveModal = () => {
    if (!els.saveModal) return;
    els.saveModal.classList.add("is-hidden");
    els.saveModal.setAttribute("aria-hidden", "true");
  };

  const submitSave = async () => {
    if (!els.saveInput) return;
    const trimmed = els.saveInput.value.trim();
    if (!trimmed) return;
    const fn = window.firebaseAddRanking;
    if (typeof fn !== "function") {
      alert("スコア記録ができません（Firebase未準備）");
      return;
    }
    try {
      await fn({ name: trimmed, score, game: "KurumiChoice" });
      closeSaveModal();
      alert("スコアを記録しました");
      window.location.href = "../ranking/ranking.html";
    } catch (err) {
      console.error(err);
      alert("記録に失敗しました");
    } finally {
      window.scrollTo(0, 0);
    }
  };

  els.saveSubmit?.addEventListener("click", submitSave);
  els.saveCancel?.addEventListener("click", closeSaveModal);
  els.saveInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSave();
    } else if (e.key === "Escape") {
      closeSaveModal();
    }
  });

  qs("start-button")?.addEventListener("click", startGame);
});
