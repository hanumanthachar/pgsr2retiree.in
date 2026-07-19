/* POWERGRID Medical Reimbursement & Aabhaar Scheme Compendium — site logic
   Reads COMPENDIUM_DATA (see assets_data.js) and drives all tab/search/filter
   rendering. No build step, no framework, no external dependencies. */

(function () {
  "use strict";

  var DATA = (typeof COMPENDIUM_DATA !== "undefined" ? COMPENDIUM_DATA : null) ||
    { circulars: [], sections: {}, hospitals: [], labs: [] };

  /* ---------- helpers ---------- */

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderSubject(c) {
    var subj = escapeHtml(c.subject);
    if (c.highlight) {
      var esc = escapeHtml(c.highlight);
      var idx = subj.indexOf(esc);
      if (idx >= 0) {
        return subj.slice(0, idx) + '<span class="hl-red">' + esc + "</span>" + subj.slice(idx + esc.length);
      }
    }
    return subj;
  }

  function matchesQuery(haystackParts, q) {
    if (!q) return true;
    var hay = haystackParts.join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  /* ---------- tab switching ---------- */

  function initTabs() {
    var btns = document.querySelectorAll(".tab-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateTab(btn.getAttribute("data-tab"));
      });
    });
  }

  function activateTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
    });
    document.querySelectorAll(".tab-panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "tab-" + tabName);
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* ---------- circulars tab ---------- */

  var circState = { query: "", section: "ALL" };

  function buildCircFilters() {
    var container = document.getElementById("circFilters");
    if (!container) return;
    var html = '<button class="chip active" data-section="ALL">All Circulars (' + DATA.circulars.length + ")</button>";
    Object.keys(DATA.sections).forEach(function (key) {
      var sec = DATA.sections[key];
      var count = DATA.circulars.filter(function (c) { return c.section === key; }).length;
      html +=
        '<button class="chip" data-section="' + escapeHtml(key) + '" style="border-color:' + sec.color +
        '" data-color="' + sec.color + '">' + escapeHtml(sec.label) + " (" + count + ")</button>";
    });
    html += '<button class="chip" data-section="AABHAAR" style="border-color:#6b2a6e">AABHAAR SCHEME</button>';
    container.innerHTML = html;

    container.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var section = chip.getAttribute("data-section");
        if (section === "AABHAAR") {
          activateTab("aabhaar");
          return;
        }
        circState.section = section;
        container.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        renderCirculars();
      });
    });
  }

  function renderCirculars() {
    var resultsEl = document.getElementById("circResults");
    var emptyEl = document.getElementById("circEmpty");
    if (!resultsEl) return;

    var q = circState.query.trim().toLowerCase();
    var filtered = DATA.circulars.filter(function (c) {
      if (circState.section !== "ALL" && c.section !== circState.section) return false;
      return matchesQuery([c.subject, c.ref, c.date, c.type, c.sectionLabel, String(c.sl)], q);
    });

    if (filtered.length === 0) {
      resultsEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    // group by section, preserving first-seen order in the filtered list
    var order = [];
    var groups = {};
    filtered.forEach(function (c) {
      if (!groups[c.section]) {
        groups[c.section] = [];
        order.push(c.section);
      }
      groups[c.section].push(c);
    });

    var html = "";
    order.forEach(function (secKey) {
      var sec = DATA.sections[secKey] || { label: secKey, color: "#333" };
      html += '<div class="section-heading" style="background:' + sec.color + '">' + escapeHtml(sec.label) + "</div>";
      groups[secKey].forEach(function (c) {
        html += renderCircRow(c);
      });
    });
    resultsEl.innerHTML = html;
  }

  function renderCircRow(c) {
    var noteHtml = c.note ? '<div class="circ-note">' + escapeHtml(c.note) + "</div>" : "";
    return (
      '<div class="circ-row">' +
      '<div class="circ-sl">Sl.&nbsp;' + escapeHtml(c.sl) + "</div>" +
      '<div class="circ-subject">' +
      '<span class="circ-type-badge" style="background:' + c.color + '">' + escapeHtml(c.type) + "</span><br>" +
      renderSubject(c) +
      noteHtml +
      "</div>" +
      '<div class="circ-ref">' + escapeHtml(c.ref) + "</div>" +
      '<div class="circ-date">' + escapeHtml(c.date) + "</div>" +
      '<div style="font-size:12.5px;color:var(--muted);text-align:right;white-space:nowrap;">' + escapeHtml(c.pages) + "&nbsp;pp</div>" +
      '<div class="circ-action"><a class="btn-view" href="' + escapeHtml(c.pdf) + '" target="_blank" rel="noopener">' +
      "View / Download PDF &middot; page " + escapeHtml(c.pageInFullCompendium) + " of Full Compendium</a></div>" +
      "</div>"
    );
  }

  function initCirculars() {
    buildCircFilters();
    renderCirculars();
    var search = document.getElementById("circSearch");
    if (search) {
      search.addEventListener("input", function () {
        circState.query = search.value;
        renderCirculars();
      });
    }
  }

  /* ---------- hospitals / labs tab ---------- */

  var hospState = { query: "", group: "hospitals" };

  function renderHospitals() {
    var resultsEl = document.getElementById("hospResults");
    var emptyEl = document.getElementById("hospEmpty");
    if (!resultsEl) return;

    var q = hospState.query.trim().toLowerCase();
    var isHosp = hospState.group === "hospitals";
    var list = isHosp ? DATA.hospitals : DATA.labs;

    var filtered = list.filter(function (r) {
      var parts = isHosp ? [r.name, r.city, r.addr] : [r.city, r.addr];
      return matchesQuery(parts, q);
    });

    if (filtered.length === 0) {
      resultsEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    var order = [];
    var groups = {};
    filtered.forEach(function (r) {
      var g = r.group || "Other";
      if (!groups[g]) {
        groups[g] = [];
        order.push(g);
      }
      groups[g].push(r);
    });

    var html = "";
    order.forEach(function (g) {
      html += '<div class="hosp-group-heading" style="background:var(--navy)">' + escapeHtml(g) + "</div>";
      groups[g].forEach(function (r) {
        if (isHosp) {
          html +=
            '<div class="hosp-row">' +
            '<div class="hosp-sl">' + escapeHtml(r.sl) + "</div>" +
            '<div class="hosp-portal">Sl.&nbsp;' + escapeHtml(r.portal) + '<span class="star-red">*</span></div>' +
            '<div class="hosp-name">' + escapeHtml(r.name) + '<div class="hosp-addr">' + escapeHtml(r.addr) + "</div></div>" +
            '<div class="hosp-city">' + escapeHtml(r.city) + "</div>" +
            "</div>";
        } else {
          html +=
            '<div class="lab-row">' +
            '<div class="lab-sl">' + escapeHtml(r.sl) + "</div>" +
            '<div class="lab-city">' + escapeHtml(r.city) + "</div>" +
            '<div class="lab-addr">' + escapeHtml(r.addr) + "</div>" +
            "</div>";
        }
      });
    });
    resultsEl.innerHTML = html;
  }

  function initHospitals() {
    renderHospitals();
    var search = document.getElementById("hospSearch");
    if (search) {
      search.addEventListener("input", function () {
        hospState.query = search.value;
        renderHospitals();
      });
    }
    document.querySelectorAll('.chip[data-hgroup]').forEach(function (chip) {
      chip.addEventListener("click", function () {
        hospState.group = chip.getAttribute("data-hgroup");
        document.querySelectorAll('.chip[data-hgroup]').forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        renderHospitals();
      });
    });
  }

  /* ---------- FAQs tab ---------- */

  var faqState = { query: "", category: "ALL" };

  function circularBySl(sl) {
    for (var i = 0; i < DATA.circulars.length; i++) {
      if (DATA.circulars[i].sl === sl) return DATA.circulars[i];
    }
    return null;
  }

  function buildFaqFilters() {
    var container = document.getElementById("faqFilters");
    if (!container) return;
    if (!DATA.faqs || DATA.faqs.length === 0) {
      container.innerHTML = "";
      return;
    }
    var cats = [];
    DATA.faqs.forEach(function (f) {
      var c = f.category || "General";
      if (cats.indexOf(c) === -1) cats.push(c);
    });
    var html = '<button class="chip active" data-category="ALL">All FAQs (' + DATA.faqs.length + ")</button>";
    cats.forEach(function (c) {
      var count = DATA.faqs.filter(function (f) { return (f.category || "General") === c; }).length;
      html += '<button class="chip" data-category="' + escapeHtml(c) + '">' + escapeHtml(c) + " (" + count + ")</button>";
    });
    container.innerHTML = html;

    container.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        faqState.category = chip.getAttribute("data-category");
        container.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        renderFaqs();
      });
    });
  }

  function renderFaqs() {
    var resultsEl = document.getElementById("faqResults");
    var emptyEl = document.getElementById("faqEmpty");
    var comingSoonEl = document.getElementById("faqComingSoon");
    var controlsEl = document.querySelector("#tab-faqs .controls");
    if (!resultsEl) return;

    if (!DATA.faqs || DATA.faqs.length === 0) {
      resultsEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "none";
      if (comingSoonEl) comingSoonEl.style.display = "block";
      if (controlsEl) controlsEl.style.display = "none";
      return;
    }
    if (controlsEl) controlsEl.style.display = "";
    if (comingSoonEl) comingSoonEl.style.display = "none";

    var q = faqState.query.trim().toLowerCase();
    var filtered = DATA.faqs.filter(function (f) {
      var cat = f.category || "General";
      if (faqState.category !== "ALL" && cat !== faqState.category) return false;
      return matchesQuery([f.question, f.answer, cat], q);
    });

    if (filtered.length === 0) {
      resultsEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    var order = [];
    var groups = {};
    filtered.forEach(function (f) {
      var cat = f.category || "General";
      if (!groups[cat]) {
        groups[cat] = [];
        order.push(cat);
      }
      groups[cat].push(f);
    });

    var html = "";
    order.forEach(function (cat) {
      html += '<div class="faq-group-heading">' + escapeHtml(cat) + "</div>";
      groups[cat].forEach(function (f) {
        var relatedHtml = "";
        if (f.relatedSl && f.relatedSl.length) {
          var links = f.relatedSl.map(function (sl) {
            var c = circularBySl(sl);
            if (!c) return "Sl. " + escapeHtml(sl);
            return '<a href="' + escapeHtml(c.pdf) + '" target="_blank" rel="noopener">Sl. ' + escapeHtml(sl) + " &ndash; " + escapeHtml(c.subject) + "</a>";
          });
          relatedHtml = '<div class="faq-related">Related circular(s): ' + links.join(", ") + "</div>";
        }
        html +=
          '<details class="faq-item">' +
          "<summary>" + escapeHtml(f.question) + "</summary>" +
          '<div class="faq-answer">' + f.answer + relatedHtml + "</div>" +
          "</details>";
      });
    });
    resultsEl.innerHTML = html;
  }

  function initFaqs() {
    buildFaqFilters();
    renderFaqs();
    var search = document.getElementById("faqSearch");
    if (search) {
      search.addEventListener("input", function () {
        faqState.query = search.value;
        renderFaqs();
      });
    }
  }

  /* ---------- boot ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initCirculars();
    initHospitals();
    initFaqs();
  });
})();
