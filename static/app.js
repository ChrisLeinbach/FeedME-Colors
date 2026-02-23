fetch("colors_resolved.json")
  .then(res => res.json())
  .then(data => {
    const inStockContainer = document.getElementById("in-stock");
    const outStockContainer = document.getElementById("out-stock");

    const colors = Object.values(data.manufacturers).flat();

    colors.forEach(c => {
      const card = document.createElement("div");
      card.className = "card";

      const swatchDiv = document.createElement("div");
      swatchDiv.className = "swatch";
      swatchDiv.style.background = `#${c.hex}`;

      const meta = document.createElement("div");
      meta.className = "meta";

      const badges = [];
      if (c.mfr_is_available) {
        badges.push('<span class="badge in-stock">Available from Manufacturer</span>');
      }

      meta.innerHTML = `
        <div class="line name"><strong>${c.name}</strong></div>
        <div class="line brand">${c.brand || ""} - ${c.material || ""}</div>
        <div class="line hex">Hex: #${c.hex}</div>
        <div class="badges">
          ${badges.join(" ")}
        </div>
      `;

      card.appendChild(swatchDiv);
      card.appendChild(meta);

      if (c.quantity > 0) {
        card.onclick = () => window.open(c.fcxyz_url, "_blank");
        inStockContainer.appendChild(card);
      } else {
        card.onclick = () => window.open(c.fcxyz_url, "_blank");
        outStockContainer.appendChild(card);
      }
    });
  })
  .catch(err => {
    console.error("Failed to load color data:", err);
  });

document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    target.classList.toggle("show");
  });
});