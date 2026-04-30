const LOCAL_ENDPOINT = "data/apis.json";
const API_ENDPOINT = "https://api.publicapis.org/entries";

const fallbackEntries = [
  {
    API: "Open Library",
    Description: "Books, book covers and related data",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://openlibrary.org/developers/api",
    Category: "Books"
  },
  {
    API: "Nager.Date",
    Description: "Public holidays for more than 90 countries",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://date.nager.at",
    Category: "Calendar"
  },
  {
    API: "Met Museum of Art",
    Description: "Met Museum of Art collection",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://metmuseum.github.io/",
    Category: "Art & Design"
  }
];

const state = {
  entries: [],
  filtered: [],
  hasRendered: false
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  authFilter: document.querySelector("#authFilter"),
  httpsFilter: document.querySelector("#httpsFilter"),
  corsFilter: document.querySelector("#corsFilter"),
  docsFilter: document.querySelector("#docsFilter"),
  apiGrid: document.querySelector("#apiGrid"),
  resultCount: document.querySelector("#resultCount"),
  emptyState: document.querySelector("#emptyState"),
  randomButton: document.querySelector("#randomButton"),
  clearButton: document.querySelector("#clearButton"),
  totalApis: document.querySelector("#totalApis"),
  categoryCount: document.querySelector("#categoryCount"),
  noAuthCount: document.querySelector("#noAuthCount")
};

async function loadEntries() {
  try {
    const response = await fetch(LOCAL_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Local catalog request failed: ${response.status}`);
    }

    const data = await response.json();
    state.entries = normalizeEntries(data.entries || []);
  } catch (localError) {
    console.warn("Local catalog could not load. Trying live catalog.", localError);
    await loadLiveEntries();
  }

  populateCategoryFilter();
  updateStats();
  applyFilters();
}

async function loadLiveEntries() {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Catalog request failed: ${response.status}`);
    }

    const data = await response.json();
    state.entries = normalizeEntries(data.entries || []);
  } catch (error) {
    console.warn("Using fallback entries because the live catalog could not load.", error);
    state.entries = normalizeEntries(fallbackEntries);
  }
}

function normalizeEntries(entries) {
  return entries
    .filter((entry) => entry.API && entry.Link)
    .map((entry) => ({
      title: entry.API,
      description: entry.Description || "Public API",
      auth: entry.Auth || "No",
      https: Boolean(entry.HTTPS),
      cors: String(entry.Cors || "unknown").toLowerCase(),
      link: entry.Link,
      finalLink: entry.FinalLink || entry.Link,
      linkStatus: entry.LinkStatus || guessLinkStatus(entry.Link),
      statusCode: entry.LinkStatusCode || null,
      category: entry.Category || "Uncategorized"
    }))
    .sort((a, b) => statusWeight(a.linkStatus) - statusWeight(b.linkStatus) || a.title.localeCompare(b.title));
}

function populateCategoryFilter() {
  const categories = [...new Set(state.entries.map((entry) => entry.category))].sort();
  const options = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
  els.categoryFilter.insertAdjacentHTML("beforeend", options.join(""));
}

function updateStats() {
  const categories = new Set(state.entries.map((entry) => entry.category));
  const noAuth = state.entries.filter((entry) => entry.auth === "No").length;

  els.totalApis.textContent = state.entries.length.toLocaleString();
  els.categoryCount.textContent = categories.size.toLocaleString();
  els.noAuthCount.textContent = noAuth.toLocaleString();
}

function applyFilters() {
  markFiltering();
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const auth = els.authFilter.value;
  const https = els.httpsFilter.value;
  const cors = els.corsFilter.value;
  const docs = els.docsFilter.value;

  state.filtered = state.entries.filter((entry) => {
    const matchesQuery =
      !query ||
      entry.title.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query);
    const matchesCategory = category === "all" || entry.category === category;
    const matchesAuth = auth === "all" || entry.auth === auth;
    const matchesHttps = https === "all" || String(entry.https) === https;
    const matchesCors = cors === "all" || entry.cors === cors;
    const matchesDocs =
      docs === "all" ||
      entry.linkStatus === docs ||
      (docs === "reliable" && ["ok", "github", "limited", "unchecked"].includes(entry.linkStatus));

    return matchesQuery && matchesCategory && matchesAuth && matchesHttps && matchesCors && matchesDocs;
  });

  renderEntries(state.filtered);
}

function renderEntries(entries) {
  els.resultCount.textContent = `${entries.length.toLocaleString()} ${entries.length === 1 ? "API" : "APIs"} found`;
  els.emptyState.hidden = entries.length > 0;
  els.apiGrid.innerHTML = entries.map(renderCard).join("");
  els.apiGrid.classList.toggle("is-empty", entries.length === 0);

  requestAnimationFrame(() => {
    els.apiGrid.classList.remove("is-filtering");
    els.apiGrid.classList.add("has-rendered");
    state.hasRendered = true;
  });
}

function markFiltering() {
  if (!state.hasRendered) return;
  els.apiGrid.classList.add("is-filtering");
}

function renderCard(entry) {
  const authLabel = entry.auth === "No" ? "No auth" : entry.auth;
  const corsClass = entry.cors === "yes" ? "good" : entry.cors === "no" ? "bad" : "warn";
  const docs = getDocsMeta(entry);

  return `
    <article class="api-card">
      <header>
        <div class="card-topline">
          <span class="category-pill">${escapeHtml(entry.category)}</span>
          <span class="docs-status ${docs.className}">${escapeHtml(docs.label)}</span>
        </div>
        <h2>${escapeHtml(entry.title)}</h2>
      </header>
      <p>${escapeHtml(entry.description)}</p>
      <dl class="details-list">
        <div>
          <dt>Access</dt>
          <dd>${escapeHtml(authLabel)}</dd>
        </div>
        <div>
          <dt>Browser use</dt>
          <dd>${entry.cors === "yes" ? "Ready" : entry.cors === "no" ? "Server only" : "Test first"}</dd>
        </div>
      </dl>
      <div class="meta-row" aria-label="API metadata">
        <span class="meta ${entry.auth === "No" ? "good" : "warn"}">${escapeHtml(authLabel)}</span>
        <span class="meta ${entry.https ? "good" : "bad"}">${entry.https ? "HTTPS" : "No HTTPS"}</span>
        <span class="meta ${corsClass}">CORS ${escapeHtml(entry.cors)}</span>
      </div>
      <footer>
        ${renderPrimaryLink(entry, docs)}
        <a class="ghost-link" href="${escapeAttribute(searchUrl(entry))}" target="_blank" rel="noreferrer">Find docs</a>
      </footer>
    </article>
  `;
}

function renderPrimaryLink(entry, docs) {
  if (entry.linkStatus === "bad") {
    return `<span class="disabled-link">Docs need review</span>`;
  }

  return `<a href="${escapeAttribute(entry.finalLink)}" target="_blank" rel="noreferrer">${escapeHtml(docs.action)}</a>`;
}

function getDocsMeta(entry) {
  if (entry.linkStatus === "ok") {
    return { label: "Verified docs", action: "Open docs", className: "ok" };
  }

  if (entry.linkStatus === "github") {
    return { label: "GitHub docs", action: "Open README", className: "github" };
  }

  if (entry.linkStatus === "limited") {
    return { label: "Protected docs", action: "Open source link", className: "limited" };
  }

  if (entry.linkStatus === "bad") {
    return { label: "Needs review", action: "Find docs", className: "bad" };
  }

  return { label: "Unchecked", action: "Open source link", className: "unchecked" };
}

function showRandomApi() {
  const source = state.filtered.length ? state.filtered : state.entries;
  const entry = source[Math.floor(Math.random() * source.length)];
  if (!entry) return;

  els.searchInput.value = entry.title;
  applyFilters();
  document.querySelector("#catalog").scrollIntoView({ behavior: "smooth" });
}

function clearFilters() {
  els.searchInput.value = "";
  els.categoryFilter.value = "all";
  els.authFilter.value = "all";
  els.httpsFilter.value = "all";
  els.corsFilter.value = "all";
  els.docsFilter.value = "all";
  applyFilters();
}

function guessLinkStatus(link) {
  if (!link) return "bad";
  try {
    const host = new URL(link).hostname.toLowerCase();
    if (host === "github.com" || host.endsWith(".github.io")) return "github";
  } catch {
    return "bad";
  }
  return "unchecked";
}

function statusWeight(status) {
  return { ok: 0, github: 1, limited: 2, unchecked: 3, bad: 4 }[status] ?? 3;
}

function searchUrl(entry) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${entry.title} ${entry.category} API documentation`)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

["input", "change"].forEach((eventName) => {
  els.searchInput.addEventListener(eventName, () => {
    els.searchInput.classList.toggle("has-query", els.searchInput.value.trim().length > 0);
    applyFilters();
  });
});

[els.categoryFilter, els.authFilter, els.httpsFilter, els.corsFilter, els.docsFilter].forEach((filter) => {
  filter.addEventListener("change", () => {
    filter.classList.add("filter-changed");
    window.setTimeout(() => filter.classList.remove("filter-changed"), 360);
    applyFilters();
  });
});

els.randomButton.addEventListener("click", showRandomApi);
els.clearButton.addEventListener("click", clearFilters);

loadEntries();
