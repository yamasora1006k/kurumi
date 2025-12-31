document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("year-title");
  const part202 = titleEl?.querySelector('[data-part="202"]');
  const part5 = titleEl?.querySelector('[data-part="5"]');
  const codeTag = document.querySelector(".code-tag");
  const codePrimary = document.querySelector(".code-tag__primary");
  const codeHover = document.querySelector(".code-tag__hover");
  const startBtn = document.getElementById("start-button");
  const selection = document.getElementById("selection-screen");
  const game = document.getElementById("game-screen");
  const boardEl = document.getElementById("game-board");
  const scoreEl = document.getElementById("game-score");
  const gameover = document.getElementById("gameover-screen");
  const restartBtn = document.getElementById("restart-button");
  const finalScoreEl = document.getElementById("final-score");
  const gameoverBoard = document.getElementById("gameover-board");
  const saveScoreBtn = document.getElementById("save-score-button");
  const footerEl = document.querySelector(".y-footer");
  const modal = document.getElementById("save-modal");
  const modalInput = document.getElementById("save-name-input");
  const modalSubmit = document.getElementById("save-name-submit");
  const modalCancel = document.getElementById("save-name-cancel");

  const footerMessages = [
    "＼ 次の平方年は2116年！ ／",
    "＼ 平方年さようなら ／",
    "＼ 次の平方年まで生きれるかな ／",
    "＼ くるみたんおめ ／"
  ];

  const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

  const size = 4;
  let tiles = []; // {id, value, index}
  let gameActive = false;
  let score = 0;
  let idCounter = 1;

  const nextSquare = (n) => {
    const r = Math.sqrt(n);
    const next = r + 1;
    return next * next;
  };

  const renderTitle = (text202 = "202", text5 = "5") => {
    if (part202) part202.textContent = text202;
    if (part5) part5.textContent = text5;
  };
  const resetTitle = () => renderTitle();

  const handleHoverStart = (target) => {
    if (!part202 || !part5) return;
    if (target === part202) {
      renderTitle("45^2", "");
    } else if (target === part5) {
      renderTitle("202", "6");
    }
  };
  const handleHoverEnd = () => resetTitle();

  const ensureGridBackground = () => {
    if (!boardEl) return;
    boardEl.style.setProperty("--grid-size", size);
    if (!boardEl.querySelector(".g-bg")) {
      const bg = document.createElement("div");
      bg.className = "g-bg";
      boardEl.appendChild(bg);
      for (let i = 0; i < size * size; i += 1) {
        const cell = document.createElement("div");
        cell.className = "g-bg-cell";
        bg.appendChild(cell);
      }
    }
    if (!boardEl.querySelector(".g-tiles")) {
      const tilesLayer = document.createElement("div");
      tilesLayer.className = "g-tiles";
      boardEl.appendChild(tilesLayer);
    }

    const rect = boardEl.getBoundingClientRect();
    const pad = 8;
    const gap = 8;
    const cellSize = (rect.width - pad * 2 - gap * (size - 1)) / size;
    boardEl.style.setProperty("--cell-size-px", `${cellSize}px`);
  };

  const renderTiles = () => {
    if (!boardEl) return;
    ensureGridBackground();
    const layer = boardEl.querySelector(".g-tiles");
    if (!layer) return;
    layer.innerHTML = "";

    tiles.forEach((tile) => {
      const el = document.createElement("div");
      el.className = "g-tile";
      el.textContent = tile.value;
      const row = Math.floor(tile.index / size);
      const col = tile.index % size;
      el.style.gridRow = row + 1;
      el.style.gridColumn = col + 1;
      const color = getTileColor(tile.value);
      el.style.background = color.bg;
      el.style.color = color.fg;
      el.dataset.id = tile.id;
      layer.appendChild(el);
    });
  };

  const getTileColor = (value) => {
    const palette = [
      { val: 1, bg: "#EEE4DA", fg: "#2f2f2f" },
      { val: 4, bg: "#EDE0C8", fg: "#2f2f2f" },
      { val: 9, bg: "#F2B179", fg: "#2f2f2f" },
      { val: 16, bg: "#F59563", fg: "#fff" },
      { val: 25, bg: "#F67C5F", fg: "#fff" },
      { val: 36, bg: "#F65E3B", fg: "#fff" },
      { val: 49, bg: "#EDCF72", fg: "#2f2f2f" },
      { val: 64, bg: "#EDCC61", fg: "#2f2f2f" },
      { val: 81, bg: "#EDC850", fg: "#2f2f2f" },
      { val: 100, bg: "#EDC53F", fg: "#2f2f2f" },
      { val: 121, bg: "#EDC22E", fg: "#2f2f2f" }
    ];
    const found = palette.find((p) => p.val === value);
    if (found) return { bg: found.bg, fg: found.fg };
    // larger squares: darkening
    const darkBg = "#3c3c3c";
    return { bg: darkBg, fg: "#f5f5f5" };
  };

  const setScore = (val = 0) => {
    score = val;
    if (scoreEl) scoreEl.textContent = String(val);
  };

  const getEmptyIndices = () => {
    const occupied = new Set(tiles.map((t) => t.index));
    const empties = [];
    for (let i = 0; i < size * size; i += 1) {
      if (!occupied.has(i)) empties.push(i);
    }
    return empties;
  };

  const placeRandomTile = () => {
    const empties = getEmptyIndices();
    if (!empties.length) return;
    const idx = empties[Math.floor(Math.random() * empties.length)];
    const value = Math.random() < 0.8 ? 1 : 4;
    tiles.push({ id: idCounter++, value, index: idx });
  };

  const spawnInitialTiles = () => {
    tiles = [];
    placeRandomTile();
    placeRandomTile();
  };

  const slideLine = (line) => {
    const filtered = line.filter((t) => t !== null);
    const result = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i += 1) {
      const current = filtered[i];
      const next = filtered[i + 1];
      if (next && current.value === next.value) {
        const newVal = nextSquare(current.value);
        result.push({ id: idCounter++, value: newVal, mergedFrom: [current.id, next.id] });
        gained += newVal;
        i += 1;
      } else {
        result.push({ ...current });
      }
    }
    while (result.length < size) result.push(null);
    return { result, gained };
  };

  const toGridValues = () => {
    const grid = Array(size * size).fill(0);
    tiles.forEach((t) => {
      grid[t.index] = t.value;
    });
    return grid;
  };

  const rebuildTilesFromValues = (values) => {
    tiles = [];
    values.forEach((val, idx) => {
      if (val) tiles.push({ id: idCounter++, value: val, index: idx });
    });
  };

  const canMove = (values) => {
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === 0) return true;
      const r = Math.floor(i / size);
      const c = i % size;
      const right = c + 1 < size ? values[i + 1] : null;
      const down = r + 1 < size ? values[i + size] : null;
      if (right !== null && right === values[i]) return true;
      if (down !== null && down === values[i]) return true;
    }
    return false;
  };

  // code tag hover lock
  let codeTimer = null;
  const showCodeHover = () => {
    if (!codePrimary || !codeHover) return;
    codePrimary.style.display = "none";
    codeHover.style.display = "inline-block";
  };
  const showCodePrimary = () => {
    if (!codePrimary || !codeHover) return;
    codeHover.style.display = "none";
    codePrimary.style.display = "inline-block";
  };
  const lockHover = () => {
    showCodeHover();
    if (codeTimer) clearTimeout(codeTimer);
    codeTimer = setTimeout(() => {
      showCodePrimary();
    }, 1000);
  };

  const move = (direction) => {
    if (!gameActive) return;
    const values = toGridValues();
    const grid = [];
    for (let r = 0; r < size; r += 1) {
      grid.push(values.slice(r * size, r * size + size));
    }

    let moved = false;
    let totalGain = 0;

    const slideRow = (row, reverse = false) => {
      const arr = reverse ? [...row].reverse() : [...row];
      const filtered = arr.filter((n) => n !== 0);
      const merged = [];
      for (let i = 0; i < filtered.length; i += 1) {
        if (filtered[i + 1] !== undefined && filtered[i] === filtered[i + 1]) {
          const newVal = nextSquare(filtered[i]);
          merged.push(newVal);
          totalGain += newVal;
          i += 1;
          moved = true;
        } else {
          merged.push(filtered[i]);
        }
      }
      while (merged.length < size) merged.push(0);
      const out = reverse ? merged.reverse() : merged;
      if (!moved) {
        for (let i = 0; i < size; i += 1) {
          if (row[i] !== out[i]) {
            moved = true;
            break;
          }
        }
      }
      return out;
    };

    if (direction === "left" || direction === "right") {
      for (let r = 0; r < size; r += 1) {
        grid[r] = slideRow(grid[r], direction === "right");
      }
    } else {
      for (let c = 0; c < size; c += 1) {
        const col = grid.map((row) => row[c]);
        const newCol = slideRow(col, direction === "down");
        for (let r = 0; r < size; r += 1) {
          grid[r][c] = newCol[r];
        }
      }
    }

    const flat = grid.flat();
    rebuildTilesFromValues(flat);
    if (totalGain) setScore(score + totalGain);
    if (!canMove(flat)) {
      renderTiles();
      endGame();
      return;
    }
    placeRandomTile();
    renderTiles();
  };

  const startGame = () => {
    selection?.classList.add("is-hidden");
    game?.classList.remove("is-hidden");
    gameover?.classList.add("is-hidden");
    gameActive = true;
    setScore(0);
    spawnInitialTiles();
    renderTiles();
  };

  const renderGameoverBoard = () => {
    if (!gameoverBoard) return;
    gameoverBoard.innerHTML = "";
    const snapshot = Array(size * size).fill(0);
    tiles.forEach((t) => {
      snapshot[t.index] = t.value;
    });
    snapshot.forEach((val) => {
      const cell = document.createElement("div");
      cell.className = "gameover__cell";
      cell.textContent = val || "";
      gameoverBoard.appendChild(cell);
    });
  };

  const endGame = () => {
    gameActive = false;
    game?.classList.add("is-hidden");
    selection?.classList.add("is-hidden");
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    renderGameoverBoard();
    gameover?.classList.remove("is-hidden");
  };

  const closeSaveModal = () => {
    modal?.classList.add("is-hidden");
    if (modal) modal.setAttribute("aria-hidden", "true");
  };

  const openSaveModal = () => {
    if (!modal || !modalInput) return;
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    modalInput.value = "";
    modalInput.focus();
  };

  const submitSave = async () => {
    if (!modalInput) return;
    const trimmed = modalInput.value.trim();
    if (!trimmed) return;
    const fn = window.firebaseAddRanking;
    if (typeof fn !== "function") {
      alert("スコア記録ができません（Firebase未準備）");
      return;
    }
    try {
      await fn({ name: trimmed, score, game: "2025" });
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

  if (part202 && part5) {
    part202.addEventListener("mouseenter", () => handleHoverStart(part202));
    part202.addEventListener("mouseleave", handleHoverEnd);
    part5.addEventListener("mouseenter", () => handleHoverStart(part5));
    part5.addEventListener("mouseleave", handleHoverEnd);
  }

  startBtn?.addEventListener("click", startGame);
  restartBtn?.addEventListener("click", startGame);
  saveScoreBtn?.addEventListener("click", openSaveModal);
  modalSubmit?.addEventListener("click", submitSave);
  modalCancel?.addEventListener("click", closeSaveModal);
  modalInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSave();
    } else if (e.key === "Escape") {
      closeSaveModal();
    }
  });

  if (footerEl && footerMessages.length) {
    footerEl.textContent = pickRandom(footerMessages);
  }

  if (codeTag) {
    codeTag.addEventListener("mouseenter", lockHover);
  }

  document.addEventListener("keydown", (event) => {
    if (!gameActive) return;
    if (event.key === "ArrowLeft") move("left");
    else if (event.key === "ArrowRight") move("right");
    else if (event.key === "ArrowUp") move("up");
    else if (event.key === "ArrowDown") move("down");
  });

  // タッチスワイプ対応（モバイル操作）
  (() => {
    let startX = 0;
    let startY = 0;
    const threshold = 30;
    const target = game || document;

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
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
      if (e.cancelable) e.preventDefault();
    };

    target?.addEventListener("touchstart", onStart, { passive: true });
    target?.addEventListener("touchend", onEnd, { passive: false });
  })();
});
