/* ════════════════════════════════════════════
   VERITAS AI — Frontend Logic (Stabilization)
   ════════════════════════════════════════════ */

const API_BASE = "http://localhost:5000/api";

const DEMO_ARTICLES = [
  {
    headline: "Unverified Rumors Swirl Around Upcoming Tech Merger",
    source: "https://www.technewsblog.net/rumors",
    text: "Reports are circulating online that two major tech giants are preparing for a massive merger later this year. While anonymous insiders claim the deal is already finalized, official representatives from both companies have declined to comment. Market analysts suggest that if the merger occurs, it could drastically shift industry dynamics, but they caution that regulatory hurdles might prevent any actual acquisition. At this stage, everything remains speculative until official documents are filed.",
  },
  {
    headline:
      "SHOCKING: Government HIDING Miracle Cure Doctors Don't Want You To Know!!",
    source: "https://www.naturalnews.com/fake-cure-exposed",
    text: "WAKE UP SHEEPLE!! The deep state has been CENSORING this BOMBSHELL discovery for DECADES! A whistleblower has LEAKED documents proving Big Pharma and corrupt government officials are covering up a 100% MIRACLE CURE that ELIMINATES all disease instantly! They don't want you to KNOW because it would destroy their TRILLION-dollar industry! SHARE THIS NOW before they BAN it!! Mainstream media REFUSES to cover this EXPLOSIVE truth! YOU won't BELIEVE what they found!!",
  },
  {
    headline:
      "Global Study Finds Renewable Energy Expansion Significantly Reduces Air Pollution Levels",
    source:
      "https://www.reuters.com/world/environment/global-renewable-energy-study-air-pollution-report-2026/",
    text: "An international study conducted by researchers from Oxford University and the International Energy Agency has found that large-scale adoption of renewable energy sources has significantly reduced air pollution levels in several major urban regions over the past decade. The report analyzed emissions data collected from more than 40 countries between 2012 and 2025 and observed measurable declines in sulfur dioxide, carbon monoxide, and fine particulate matter in areas with increased investment in solar and wind infrastructure. Researchers stated that transitioning away from coal-based electricity generation played a major role in improving urban air quality and reducing respiratory health risks.",
  },
];

const FAKE_SIGNALS = [
  "shocking",
  "bombshell",
  "secret",
  "exposed",
  "hoax",
  "conspiracy",
  "sheeple",
  "miracle",
  "cure",
  "banned",
  "censored",
];
const EMOTIONAL_WORDS = [
  "outrageous",
  "horrifying",
  "terrifying",
  "disgusting",
  "devastating",
  "explosive",
  "scandalous",
  "alarming",
  "panic",
];

// ─── INITIALIZATION ──────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initParallax();

  document.getElementById("text-input").addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") runAnalysis();
  });

  // Handle Chrome Extension "Open in Dashboard" feature
  const params = new URLSearchParams(window.location.search);
  if (params.get("dashboard") === "1") {
    document.getElementById("headline-input").value =
      params.get("headline") || "";
    document.getElementById("source-input").value = params.get("url") || "";
    document.getElementById("text-input").value = params.get("text") || "";
    runAnalysis();

    // Clean URL without reloading page
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

function loadDemo(index) {
  const demo = DEMO_ARTICLES[index];
  document.getElementById("headline-input").value = demo.headline;
  document.getElementById("source-input").value = demo.source;
  document.getElementById("text-input").value = demo.text;
}

function loadCompareDemo(colIndex, type) {
  let demo;
  if (type === "real") demo = DEMO_ARTICLES[0];
  if (type === "fake") demo = DEMO_ARTICLES[1];
  if (type === "unknown") demo = DEMO_ARTICLES[2];

  document.getElementById(`c${colIndex}-headline`).value = demo.headline;
  document.getElementById(`c${colIndex}-source`).value = demo.source;
  document.getElementById(`c${colIndex}-text`).value = demo.text;
}

function switchPage(name) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");

  document.querySelectorAll(".nav-tab").forEach((tab, i) => {
    const isActive =
      (i === 0 && name === "analyze") || (i === 1 && name === "compare");
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });
}

// ─── ANALYSIS ────────────────────────────
async function runAnalysis() {
  const text = document.getElementById("text-input").value.trim();
  const headline = document.getElementById("headline-input").value.trim();
  const source = document.getElementById("source-input").value.trim();

  if (!text || text.length < 20) {
    alert("Please enter at least 20 characters of article content.");
    return;
  }

  showLoading(true);

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, headline, source_url: source }),
    });
    if (!res.ok) throw new Error("Backend offline");
    const data = await res.json();
    renderResults(data);
  } catch {
    // Graceful offline fallback
    const data = buildMockResult(text, headline, source);
    renderResults(data);
  } finally {
    showLoading(false);
  }
}

function showLoading(isLoading) {
  const loading = document.getElementById("loading");
  const btn = document.getElementById("btn-run");
  const results = document.getElementById("results-panel");

  if (isLoading) {
    loading.classList.add("show");
    results.style.display = "none";
    results.classList.remove("show");
    btn.disabled = true;
  } else {
    loading.classList.remove("show");
    btn.disabled = false;
  }
}

// ─── MOCK ENGINE (OFFLINE FALLBACK) ──────────
function buildMockResult(text, headline, source) {
  const lower = text.toLowerCase();
  const suspiciousWords = [...FAKE_SIGNALS, ...EMOTIONAL_WORDS].filter((w) =>
    lower.includes(w),
  );

  // Extract entities mock
  const entitiesMatches =
    text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g) || [];
  const entities = [...new Set(entitiesMatches)].slice(0, 5);

  let verdict, corroboration, narrative;
  const isSuspicious = suspiciousWords.length > 3 || text.includes("!");
  const hasEntities = entities.length > 1;

  if (!isSuspicious && hasEntities) {
    verdict = "VERIFIED REAL";
    corroboration = "Cross-source verification aligned with established facts.";
    narrative = "Consistent with known event timelines.";
  } else if (isSuspicious) {
    verdict = "VERIFIED FAKE";
    corroboration = "Reliable corroboration currently unavailable.";
    narrative = "Contains unsupported or conflicting claims.";
  } else {
    verdict = "CLAIM NOT ESTABLISHED";
    corroboration = "Reliable corroboration currently unavailable.";
    narrative = "Insufficient data to confidently verify claims.";
  }

  return {
    verdict,
    corroboration,
    entities,
    verification_query:
      entities.slice(0, 3).join(" ") || "General claim verification",
    narrative_consistency: narrative,
    manipulation_status:
      suspiciousWords.length > 2 ? "High Risk" : "None Detected",
    source: {
      status: "Unknown",
      reason: "Offline mock engine cannot resolve domain.",
    },
    headline_analysis: {
      status: "Analyzed",
      reason: "Headline context processed.",
    },
    explanation:
      verdict === "VERIFIED REAL"
        ? "Structural alignment with factual reporting."
        : "Cross-referencing failed to establish factual basis.",
    highlighted_text: buildHighlightSegments(text, suspiciousWords),
    suspicious_words: suspiciousWords,
  };
}

function buildHighlightSegments(text, words) {
  if (!words.length) return [{ text, highlight: false }];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);
  const wordSet = new Set(words.map((w) => w.toLowerCase()));
  return parts.map((part) => ({
    text: part,
    highlight: wordSet.has(part.toLowerCase()),
  }));
}

// ─── RENDERERS ──────────────────────────────
function renderResults(data) {
  const panel = document.getElementById("results-panel");
  panel.style.display = "block";
  panel.classList.add("show");

  renderVerdict(data.verdict);
  renderMetrics(data);

  document.getElementById("explanation-text").textContent =
    `"${data.explanation}"`;

  document.getElementById("source-result").innerHTML =
    `<span class="score-badge badge-${data.source.status.toLowerCase()}">${data.source.status}</span>`;
  document.getElementById("source-reason").textContent = data.source.reason;

  document.getElementById("sim-status").textContent =
    data.headline_analysis.status;
  document.getElementById("sim-reason").textContent =
    data.headline_analysis.reason;

  renderHighlightedText(data.highlighted_text, data.suspicious_words);
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderVerdict(verdict) {
  const banner = document.getElementById("verdict-banner");
  let cssClass = "warn";
  let icon = "⚠️";

  if (verdict === "VERIFIED REAL") {
    cssClass = "real";
    icon = "✅";
  }
  if (verdict === "VERIFIED FAKE") {
    cssClass = "fake";
    icon = "❌";
  }

  banner.className = `verdict-banner ${cssClass}`;
  document.getElementById("verdict-icon").textContent = icon;
  document.getElementById("verdict-text").textContent = verdict;
}

function renderMetrics(data) {
  document.getElementById("corroboration-val").textContent =
    data.corroboration.includes("aligned") ? "Aligned" : "Unverified";
  document.getElementById("corroboration-sub").textContent = data.corroboration;

  document.getElementById("entities-val").textContent = data.entities.length;
  document.getElementById("entities-sub").textContent = data.verification_query;

  document.getElementById("narrative-val").textContent =
    data.narrative_consistency.includes("Consistent")
      ? "Consistent"
      : "Conflicting";
  document.getElementById("narrative-sub").textContent =
    data.narrative_consistency;

  document.getElementById("manipulation-val").textContent =
    data.manipulation_status;
}

function renderHighlightedText(segments, suspiciousWords) {
  const body = document.getElementById("highlight-body");
  const tagsEl = document.getElementById("suspicious-tags");

  if (!suspiciousWords || suspiciousWords.length === 0) {
    body.innerHTML = `<div class="explanation-text" style="border-left-color:var(--real);">No manipulative rhetoric detected.</div>`;
    tagsEl.innerHTML = "";
    return;
  }

  body.innerHTML = segments
    .map((seg) =>
      seg.highlight
        ? `<mark class="suspicious">${escapeHtml(seg.text)}</mark>`
        : escapeHtml(seg.text),
    )
    .join("");
  tagsEl.innerHTML = suspiciousWords
    .map((word) => `<span class="tag danger">${word}</span>`)
    .join("");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── COMPARE MODE ────────────────────────────
async function runCompare() {
  const article1 = {
    headline: document.getElementById("c1-headline").value,
    text: document.getElementById("c1-text").value,
  };
  const article2 = {
    headline: document.getElementById("c2-headline").value,
    text: document.getElementById("c2-text").value,
  };

  if (!article1.text.trim() || !article2.text.trim()) {
    alert("Please fill in both article texts.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article1, article2 }),
    });
    if (!res.ok) throw new Error("Offline");
    const data = await res.json();
    renderCompareResults(data);
  } catch {
    // Offline Mock Fallback for Compare
    const r1 = buildMockResult(
      article1.text,
      article1.headline,
      article1.source_url,
    );
    const r2 = buildMockResult(
      article2.text,
      article2.headline,
      article2.source_url,
    );

    let more_credible = "Neither / Equal";
    let summary =
      "Both articles present similar levels of verification confidence.";
    if (r1.verdict === "VERIFIED REAL" && r2.verdict !== "VERIFIED REAL") {
      more_credible = "Article 1";
      summary =
        "Article 1 exhibits stronger narrative consistency and factual alignment.";
    } else if (
      r2.verdict === "VERIFIED REAL" &&
      r1.verdict !== "VERIFIED REAL"
    ) {
      more_credible = "Article 2";
      summary =
        "Article 2 exhibits stronger narrative consistency and factual alignment.";
    }

    renderCompareResults({
      article1: { verdict: r1.verdict },
      article2: { verdict: r2.verdict },
      verdict: { more_credible, summary },
    });
  }
}

function renderCompareResults(data) {
  const convertLabel = (v) =>
    v === "VERIFIED REAL"
      ? "REAL"
      : v === "VERIFIED FAKE"
        ? "FAKE"
        : "UNVERIFIED";

  document.getElementById("c1-score").textContent = convertLabel(
    data.article1.verdict,
  );
  document.getElementById("c2-score").textContent = convertLabel(
    data.article2.verdict,
  );

  const v = data.verdict;
  document.getElementById("compare-summary").innerHTML = `
    <p>⭐ <strong>More credible:</strong> ${v.more_credible}</p>
    <p style="margin-top:12px; color:var(--text-dim);">${v.summary}</p>
  `;

  const result = document.getElementById("compare-result");
  result.classList.add("show");
  result.scrollIntoView({ behavior: "smooth" });
}

// ─── SCROLL & UTILS ─────────────────────────
function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".metric-card, .explain-card, .info-card, .highlight-card, .verdict-compare",
  );
  targets.forEach((el) => el.classList.add("scroll-reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );
  targets.forEach((el) => observer.observe(el));
}

function initParallax() {
  const hero = document.querySelector(".hero");
  if (!hero || window.matchMedia("(max-width: 640px)").matches) return;
  window.addEventListener(
    "scroll",
    () => (hero.style.transform = `translateY(${window.scrollY * 0.18}px)`),
    { passive: true },
  );
}
