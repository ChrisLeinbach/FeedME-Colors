fetch("resolved_stock.json")
  .then(res => res.json())
  .then(data => {
    const inStockContainer = document.getElementById("in-stock");
    const outStockContainer = document.getElementById("out-stock");

    const updateInfo = document.getElementById("update-info");
    if (updateInfo) {
      updateInfo.innerHTML = `
        <div>Page Last Updated: ${data.page_last_updated}</div>
      `;
    }

    const colors = data.stock.map(c => {
      return {
        quantity: c.quantity,
        hex: c.variant_data.color_hex.replace(/^#/, ""),
        name: c.variant_data.color_name.replace(/_/g, " "),
        brand: c.brand_data.name,
        material: c.material_data.material,
        filament: c.filament_data.name
      };
    });

    colors.forEach(c => {
      const card = document.createElement("div");
      card.className = "card";

      const swatchDiv = document.createElement("div");
      swatchDiv.className = "swatch";
      swatchDiv.style.background = `#${c.hex}`;

      const meta = document.createElement("div");
      meta.className = "meta";

      const badges = [];
      if (c.quantity < 1) {
        badges.push('<span class="badge out-stock">Out of Stock</span>');
      }

      meta.innerHTML = `
        <div class="line name"><strong>${c.name}</strong></div>
        <div class="line">${c.brand || ""} - ${c.filament || ""}</div>
        <div class="line">Hex: #${c.hex}</div>
        <div class="line">Rolls Available: ${c.quantity}</div>
        <div class="badges">
          ${badges.join("")}
        </div>
      `;

      card.appendChild(swatchDiv);
      card.appendChild(meta);

      if (c.quantity > 0) {
        inStockContainer.appendChild(card);
      } else {
        outStockContainer.appendChild(card);
      }
    });

    document.querySelectorAll(".swatch-grid").forEach(grid => {
      if (!grid.classList.contains("show")) {
        grid.style.maxHeight = "0px";
      } else {
        grid.style.maxHeight = grid.scrollHeight + "px";
      }
    });
  })
  .catch(err => console.error("Failed to load color data:", err));

document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);

    if (target.classList.contains("show")) {
      target.style.maxHeight = target.scrollHeight + "px";
      requestAnimationFrame(() => {
        target.style.maxHeight = "0px";
      });
      target.classList.remove("show");
    } else {
      if (target.id === "out-stock" && target.children.length === 0) {
        const msg = document.createElement("div");
        msg.className = "empty-message";
        msg.textContent = "No out of stock items to show.";
        target.appendChild(msg);
      }

      target.classList.add("show");
      target.style.maxHeight = target.scrollHeight + "px";
    }
  });
});
