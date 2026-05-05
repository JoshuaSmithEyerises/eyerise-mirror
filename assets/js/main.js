/* =====================================================================
   EyeRise — main.js
   Vanilla, no dependencies. Handles:
     - dark mode toggle (with localStorage persistence)
     - reading progress bar on article pages
     - archive page filters (topic/year/keyword)
   ===================================================================== */

(function () {
  // ---------- Theme toggle ----------
  const root = document.documentElement;
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (stored === "dark" || (!stored && prefersDark)) {
    root.setAttribute("data-theme", "dark");
  }

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // ---------- Reading progress (article pages only) ----------
  const article = document.getElementById("articleBody");
  const bar = document.getElementById("readingProgress");
  if (article && bar) {
    const update = () => {
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(100, (scrolled / total) * 100));
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  // ---------- Archive filters ----------
  const list = document.getElementById("archiveList");
  if (list) {
    const items = Array.from(list.querySelectorAll(".archive-item"));
    const empty = document.getElementById("archiveEmpty");
    const topicSel = document.getElementById("filterTopic");
    const yearSel = document.getElementById("filterYear");
    const kwInput = document.getElementById("filterKeyword");

    // Populate year dropdown from items
    const years = [...new Set(items.map((i) => i.dataset.year))]
      .filter(Boolean)
      .sort((a, b) => b - a);
    for (const y of years) {
      const opt = document.createElement("option");
      opt.value = y; opt.textContent = y;
      yearSel.appendChild(opt);
    }

    function apply() {
      const topic = topicSel.value;
      const year = yearSel.value;
      const kw = kwInput.value.trim().toLowerCase();
      let visible = 0;
      for (const li of items) {
        const matchTopic = !topic || li.dataset.topic === topic;
        const matchYear = !year || li.dataset.year === year;
        const matchKw =
          !kw ||
          li.dataset.title.includes(kw) ||
          (li.dataset.excerpt && li.dataset.excerpt.includes(kw));
        const show = matchTopic && matchYear && matchKw;
        li.hidden = !show;
        if (show) visible++;
      }
      empty.hidden = visible > 0;
    }

    [topicSel, yearSel, kwInput].forEach((el) =>
      el.addEventListener("input", apply)
    );
  }
})();
