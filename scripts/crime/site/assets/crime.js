(() => {
  // Tooltip for any mark with data-tip: pointer and keyboard.
  const tip = document.querySelector(".viz-tip");
  const show = (el, x, y) => {
    if (!tip) return;
    tip.textContent = el.getAttribute("data-tip");
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x + 14));
    const top = y - r.height - 12 < 8 ? y + 18 : y - r.height - 12;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };
  const hide = () => { if (tip) tip.hidden = true; };
  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (el) show(el, e.clientX, e.clientY); else hide();
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (!el) return hide();
    const r = el.getBoundingClientRect();
    show(el, r.left + r.width / 2, r.top);
  });
  document.addEventListener("scroll", hide, { passive: true });

  // Tabs.
  document.querySelectorAll("[data-tabs]").forEach((box) => {
    const buttons = [...box.querySelectorAll("[data-tab]")];
    const panels = [...box.querySelectorAll(":scope > [data-panel]")];
    const pick = (i) => {
      buttons.forEach((b, j) => b.setAttribute("aria-selected", String(i === j)));
      panels.forEach((p, j) => { p.hidden = i !== j; });
    };
    buttons.forEach((b, i) => b.addEventListener("click", () => pick(i)));
    pick(0);
  });

  // Tables: filter by name, sort by any numeric column.
  document.querySelectorAll("[data-table]").forEach((box) => {
    const body = box.querySelector("tbody");
    const rows = [...body.rows];
    const input = box.querySelector("[data-filter]");
    input && input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      rows.forEach((r) => { r.hidden = q !== "" && !r.dataset.name.includes(q); });
    });
    box.querySelectorAll("[data-sort]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const th = btn.closest("th");
        const col = Number(btn.dataset.sort);
        const dir = th.getAttribute("aria-sort") === "descending" ? "ascending" : "descending";
        box.querySelectorAll("th[aria-sort]").forEach((h) => h.removeAttribute("aria-sort"));
        th.setAttribute("aria-sort", dir);
        const s = dir === "descending" ? -1 : 1;
        rows.sort((a, b) => s * (Number(a.cells[col].dataset.v) - Number(b.cells[col].dataset.v)) || a.dataset.name.localeCompare(b.dataset.name));
        rows.forEach((r) => body.appendChild(r));
      });
    });
  });
})();
