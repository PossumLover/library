// Universal search — full-text search across every article, powered by the
// Pagefind index generated at build time (see "build" in package.json).
(function () {
  const dialog = document.querySelector(".search-dialog");
  if (!dialog) return;

  const form = dialog.querySelector(".search-form");
  const input = dialog.querySelector(".search-input");
  const status = dialog.querySelector(".search-status");
  const list = dialog.querySelector(".search-results");
  const moreButton = dialog.querySelector(".search-more");

  const PAGE_SIZE = 10;
  let results = [];
  let shown = 0;
  let active = -1;
  let searchId = 0;

  let pagefindLoading = null;

  function loadPagefind() {
    if (!pagefindLoading) {
      pagefindLoading = (async () => {
        const pf = await import("/pagefind/pagefind.js");
        await pf.options({ excerptLength: 28 });
        pf.init();
        return pf;
      })().catch((err) => {
        pagefindLoading = null;
        status.textContent =
          "Search index not found. Run “npm run build” to generate it.";
        throw err;
      });
    }
    return pagefindLoading;
  }

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    input.select();
    loadPagefind().catch(() => {});
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function setActive(index) {
    const items = list.querySelectorAll(".search-result a");
    if (!items.length) return;
    active = Math.max(0, Math.min(index, items.length - 1));
    items.forEach((el, i) => el.setAttribute("aria-selected", i === active));
    items[active].scrollIntoView({ block: "nearest" });
  }

  function renderResult(data) {
    const li = document.createElement("li");
    li.className = "search-result";

    const a = document.createElement("a");
    a.href = data.url;

    const title = document.createElement("span");
    title.className = "search-result-title";
    title.textContent = data.meta.title || data.url;
    a.append(title);

    if (data.meta.date) {
      const date = document.createElement("span");
      date.className = "search-result-date";
      date.textContent = data.meta.date;
      a.append(date);
    }

    // Pagefind excerpts are pre-escaped HTML with <mark> around matches
    const excerpt = document.createElement("span");
    excerpt.className = "search-result-excerpt";
    excerpt.innerHTML = data.excerpt;
    a.append(excerpt);

    li.append(a);
    return li;
  }

  async function showMore(id) {
    const batch = results.slice(shown, shown + PAGE_SIZE);
    const data = await Promise.all(batch.map((r) => r.data()));
    if (id !== searchId) return;
    for (const d of data) list.append(renderResult(d));
    shown += batch.length;
    moreButton.hidden = shown >= results.length;
  }

  async function runSearch() {
    const id = ++searchId;
    const query = input.value.trim();

    if (!query) {
      results = [];
      shown = 0;
      active = -1;
      list.replaceChildren();
      moreButton.hidden = true;
      status.textContent = "";
      return;
    }

    let pf;
    try {
      pf = await loadPagefind();
    } catch {
      return;
    }

    const search = await pf.debouncedSearch(query, {}, 150);
    // null means a newer keystroke superseded this search
    if (search === null || id !== searchId) return;

    results = search.results;
    shown = 0;
    active = -1;
    list.replaceChildren();

    const n = results.length;
    status.textContent = n
      ? `${n} ${n === 1 ? "article" : "articles"} matching “${query}”`
      : `No articles matching “${query}”`;

    await showMore(id);
  }

  // Open with the header button, "/" or Ctrl/Cmd+K from anywhere
  document.querySelectorAll("[data-search-open]").forEach((btn) =>
    btn.addEventListener("click", open)
  );

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const typing =
      target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      dialog.open ? close() : open();
    } else if (e.key === "/" && !typing && !dialog.open) {
      e.preventDefault();
      open();
    }
  });

  dialog.querySelector("[data-search-close]").addEventListener("click", close);

  // Clicking the backdrop (the dialog element itself) closes it
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  input.addEventListener("input", runSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active - 1);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const items = list.querySelectorAll(".search-result a");
    const target = items[active >= 0 ? active : 0];
    if (target) window.location.href = target.href;
  });

  moreButton.addEventListener("click", () => {
    showMore(searchId);
    input.focus();
  });
})();
