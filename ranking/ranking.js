(() => {
  const listKurumi = document.getElementById("list-kurumi");
  const list2025 = document.getElementById("list-2025");

  const renderList = (el, data) => {
    if (!el) return;
    el.innerHTML = "";
    data.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "r-item";

      const rank = document.createElement("span");
      rank.className = "r-rank";
      const crownIdx = idx + 1;
      if (crownIdx >= 1 && crownIdx <= 10) {
        rank.innerHTML = `<img src="../assets/imgs/crown/no${crownIdx}.png" alt="${crownIdx}位" />`;
      } else {
        rank.textContent = String(crownIdx);
      }

      const name = document.createElement("span");
      name.className = "r-name";
      name.textContent = item.name || "名無し";

      const score = document.createElement("span");
      score.className = "r-score";
      score.textContent = item.score;

      li.append(rank, name, score);
      el.appendChild(li);
    });
  };

  const fetchRanking = async (game) => {
    const fn = window.firebaseGetRanking;
    if (typeof fn !== "function") throw new Error("Firebase not ready");
    const data = await fn(game, 10);
    return data;
  };

  const load = async () => {
    try {
      const [a, b] = await Promise.all([fetchRanking("KurumiChoice"), fetchRanking("2025")]);
      renderList(listKurumi, a);
      renderList(list2025, b);
    } catch (err) {
      console.error(err);
      // fallback dummy data
      const dummy = Array.from({ length: 5 }, (_, i) => ({ score: 0, name: "N/A" }));
      renderList(listKurumi, dummy);
      renderList(list2025, dummy);
    }
  };

  load();
})();
