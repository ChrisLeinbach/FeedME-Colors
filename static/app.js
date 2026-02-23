// Load JSON
fetch("colors_resolved.json")
  .then(res => res.json())
  .then(data => {
    const inStockContainer = document.getElementById("in-stock");
    const outStockContainer = document.getElementById("out-stock");

    const colors = Object.values(data.manufacturers).flat();

    colors.forEach(c => {
      const card = document.createElement("div");
      card.className = "card" + (c.is_available ? "" : " out");

      // Use front image or fallback to color hex
      const swatchDiv = document.createElement("div");
      swatchDiv.className = "swatch";
      if (c.images?.front) {
        swatchDiv.style.backgroundImage = `url(${c.images.front})`;
      } else {
        swatchDiv.style.background = `#${c.hex}`;
      }

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <strong>${c.name}</strong>
        <span>${c.brand || ""} - ${c.material || ""}</span>
        <span>Hex: #${c.hex}</span>
      `;

      card.appendChild(swatchDiv);
      card.appendChild(meta);

      if (c.is_available) {
        card.onclick = () => window.open(c.url, "_blank");
        inStockContainer.appendChild(card);
      } else {
        outStockContainer.appendChild(card);
      }
    });
  })
  .catch(err => {
    console.error("Failed to load color data:", err);
  });

// Toggle collapse
document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    target.classList.toggle("collapse");
  });
});