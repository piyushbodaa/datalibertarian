(() => {
  const box = document.querySelector("[data-district-map]");
  if (!box || !window.L) return;
  const L = window.L;
  const canvas = box.querySelector(".dm-canvas");
  const list = box.querySelector("ol");
  const input = box.querySelector("input");
  const fmt = new Intl.NumberFormat("en-IN");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  fetch(box.dataset.src).then((r) => r.json()).then((data) => {
    const places = data.places;
    const max = places.reduce((m, p) => Math.max(m, p.cases), 1);
    const map = L.map(canvas, { minZoom: 4, scrollWheelZoom: false, maxBounds: L.latLngBounds([0, 55], [40, 108]) });
    // Official boundaries from Bhuvan (ISRO / NRSC, Department of Space), not a commercial or crowd-sourced map.
    L.tileLayer.wms("https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms", {
      layers: "basemap:admin_group",
      format: "image/png",
      transparent: true,
      maxZoom: 10,
      attribution: 'Boundaries: <a href="https://bhuvan.nrsc.gov.in/">Bhuvan, ISRO/NRSC</a>',
    }).addTo(map);
    const radius = (cases, zoom) => Math.max(2.5, Math.min(24, (1.6 + 6 * Math.sqrt(cases / max)) * Math.pow(1.45, zoom - 5)));
    const markers = places.map((p) =>
      L.circleMarker([p.lat, p.lon], { radius: radius(p.cases, 5), color: "#FFFFFF", weight: 1, fillColor: "#B8651B", fillOpacity: 0.85 })
        .bindPopup(`<strong>${esc(p.name)}</strong><br>${esc(p.state)}<br>${fmt.format(p.cases)} rape cases registered, 2022`)
        .addTo(map),
    );
    const fit = () => { map.invalidateSize(); map.fitBounds([[6.4, 68], [35.7, 97.5]], { padding: [12, 12], animate: false }); };
    fit();
    setTimeout(fit, 200);
    map.on("zoomend", () => markers.forEach((m, i) => m.setRadius(radius(places[i].cases, map.getZoom()))));

    const order = places.map((p, i) => i).sort((a, b) => places[b].cases - places[a].cases);
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const hits = order.filter((i) => !q || `${places[i].name} ${places[i].state}`.toLowerCase().includes(q));
      list.innerHTML = hits.slice(0, 60).map((i) =>
        `<li><button type="button" data-i="${i}"><span>${esc(places[i].name)}<small>${esc(places[i].state)}</small></span><span class="v">${fmt.format(places[i].cases)}</span></button></li>`,
      ).join("");
    };
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      const i = Number(b.dataset.i);
      map.flyTo([places[i].lat, places[i].lon], Math.max(map.getZoom(), 8), { duration: 0.5 });
      markers[i].openPopup();
    });
    input.addEventListener("input", draw);
    draw();
  });
})();
