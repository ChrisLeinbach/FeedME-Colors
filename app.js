fetch("colors_resolved.json")
  .then(r => r.json())
  .then(data => {
    const container = document.getElementById("colors");

    const colors = Object.values(data.manufacturers).flat();

    colors.forEach(c => {
      const card = document.createElement("div");
      card.className = "card" + (c.quantity === 0 ? " out" : "");

      const swatch = document.createElement("div");
      swatch.className = "swatch";
      swatch.style.background = c.hex;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <strong>${c.name}</strong>
        ${c.material}<br>
        In stock: ${c.quantity}
      `;

      card.appendChild(swatch);
      card.appendChild(meta);

      if (c.quantity > 0) {
        card.onclick = () => {
          navigator.clipboard.writeText(c.fcxyz_swatch_id);
          alert(`Copied swatch ID: ${c.fcxyz_swatch_id}`);
        };
      }

      container.appendChild(card);
    });
  })
  .catch(err => {
    document.getElementById("colors").innerText =
      "Failed to load color data.";
    console.error(err);
  });