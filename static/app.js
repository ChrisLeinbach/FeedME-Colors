// Split a quantity like 1.75 into { full: 1, partial: 0.75 }.
// Rounding to 2 decimals first avoids floating point noise (e.g. 2.3 - 2 = 0.2999...).
function splitQuantity(quantity) {
  const total = Math.round((Number(quantity) || 0) * 100) / 100;
  const full = Math.floor(total);
  const partial = Math.round((total - full) * 100) / 100;
  return { full, partial };
}

function buildCard(c, quantityLine, badgeHtml = "") {
  const card = document.createElement("div");
  card.className = "card";

  const swatchDiv = document.createElement("div");
  swatchDiv.className = "swatch";
  swatchDiv.style.background = `#${c.hex}`;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <div class="line name"><strong>${c.name}</strong></div>
    <div class="line">${c.brand || ""} - ${c.filament || ""}</div>
    <div class="line">Hex: #${c.hex}</div>
    <div class="line">${quantityLine}</div>
    <div class="badges">
      ${badgeHtml}
    </div>
  `;

  card.appendChild(swatchDiv);
  card.appendChild(meta);
  return card;
}

fetch("resolved_stock.json")
  .then(res => res.json())
  .then(data => {
    const inStockContainer = document.getElementById("in-stock");
    const partialContainer = document.getElementById("partial-stock");
    const outStockContainer = document.getElementById("out-stock");

    const updateInfo = document.getElementById("update-info");
    if (updateInfo) {
      const localTime = new Date(data.page_last_updated).toLocaleString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
      updateInfo.innerHTML = `
        <div>Page Last Updated: ${localTime}</div>
      `;
    }

    const colors = data.stock.map(c => {
      return {
        quantity: c.quantity,
        hex: c.variant_data.color_hex.replace(/^#/, ""),
        name: c.variant_data.name.replace(/_/g, " "),
        brand: c.brand_data.name,
        material: c.material_data.material,
        filament: c.filament_data.name
      };
    });

    colors.forEach(c => {
      // One inventory entry can show up in more than one section:
      // 1.75 => 1 full roll (In Stock) + 0.75 partial roll (Partial Rolls).
      const { full, partial } = splitQuantity(c.quantity);

      if (full >= 1) {
        inStockContainer.appendChild(buildCard(c, `Rolls Available: ${full} (${(full*1000).toLocaleString()}g)`));
      }

      if (partial > 0) {
        partialContainer.appendChild(buildCard(c, `Partial Roll: ${partial} (${(partial*1000).toLocaleString()}g)`));
      }

      // Only truly empty entries count as out of stock.
      if (full < 1 && partial === 0) {
        outStockContainer.appendChild(
          buildCard(
            c,
            `Rolls Available: 0 (0g)`,
            '<span class="badge out-stock">Out of Stock</span>'
          )
        );
      }
    });

    // Add the empty-state message once, up front, for any section with no cards.
    document.querySelectorAll(".swatch-grid").forEach(grid => {
      if (!grid.querySelector(".card")) {
        const msg = document.createElement("div");
        msg.className = "empty-message";
        msg.textContent = grid.dataset.empty || "Nothing to show.";
        grid.appendChild(msg);
      }
    });

    document.querySelectorAll(".swatch-grid, .collapsible").forEach(grid => {
      if (!grid.classList.contains("show")) {
        grid.style.maxHeight = "0px";
      } else if (grid.querySelector(".collapsible")) {
        grid.style.maxHeight = "none";
      } else {
        grid.style.maxHeight = grid.scrollHeight + "px";
      }
    });
  })
  .catch(err => console.error("Failed to load color data:", err));

// Every toggle button gets a "Show"/"Hide" label and a chevron so it's clear
// the section can be opened or closed.
function updateToggleState(btn) {
  const target = document.getElementById(btn.dataset.target);
  const open = target.classList.contains("show");
  btn.setAttribute("aria-expanded", String(open));
  btn.querySelector(".toggle-hint").textContent = open ? "Hide" : "Show";
}

document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.setAttribute("aria-controls", btn.dataset.target);

  const label = document.createElement("span");
  label.className = "toggle-label";
  label.textContent = btn.textContent.trim();

  const meta = document.createElement("span");
  meta.className = "toggle-meta";
  meta.innerHTML = '<span class="toggle-hint"></span><span class="chevron" aria-hidden="true"></span>';

  btn.textContent = "";
  btn.appendChild(label);
  btn.appendChild(meta);
  updateToggleState(btn);
});

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
      target.classList.add("show");
      target.style.maxHeight = target.scrollHeight + "px";
    }

    // If this section sits inside another open section, let the outer one
    // grow or shrink with it instead of clipping at its old height.
    const parent = target.parentElement.closest(".collapsible");
    if (parent && parent.classList.contains("show")) {
      parent.style.maxHeight = "none";
    }

    updateToggleState(btn);
  });
});

// ---- Parts ("What's in a feeder") ----
// Cards come from parts.json. Each part has:
//   id       - reference name, also the image file: images/<id>.webp
//   name     - display name, like "Tip Foot"
//   quantity - how many to print (number, or null if unknown); standard parts only
//   grams    - filament per piece in grams (number, or null if unknown)
// Each card's total is calculated here; anything with a missing value shows "TBD".
function formatGrams(grams) {
  return `${Math.round(grams * 10) / 10} g`;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function buildPartCard(part, showQuantity = true) {
  const hasQuantity = isNumber(part.quantity);
  const hasGrams = isNumber(part.grams);

  const card = document.createElement("div");
  card.className = "card part-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "part-image";
  const img = document.createElement("img");
  img.src = `images/${part.id}.webp`;
  img.alt = part.name;
  img.width = 180;
  img.height = 120;
  img.loading = "lazy";
  img.addEventListener("error", () => { img.style.display = "none"; });
  imageWrap.appendChild(img);

  const meta = document.createElement("div");
  meta.className = "meta";

  const addLine = (label, value, extraClass) => {
    const line = document.createElement("div");
    line.className = extraClass ? `line ${extraClass}` : "line";
    line.textContent = `${label}${value}`;
    meta.appendChild(line);
  };

  const nameLine = document.createElement("div");
  nameLine.className = "line name";
  const strong = document.createElement("strong");
  strong.textContent = part.name;
  nameLine.appendChild(strong);
  meta.appendChild(nameLine);

  if (showQuantity) {
    addLine("Quantity: ", hasQuantity ? part.quantity : "TBD");
    addLine("Filament (each): ", hasGrams ? formatGrams(part.grams) : "TBD");
    addLine(
      "Total: ",
      hasQuantity && hasGrams ? formatGrams(part.quantity * part.grams) : "TBD",
      "total-line"
    );
  } else {
    // Extra parts have no quantity, so just show the filament they use.
    addLine("Filament: ", hasGrams ? formatGrams(part.grams) : "TBD", "total-line");
  }

  card.appendChild(imageWrap);
  card.appendChild(meta);
  return card;
}

function renderParts(gridId, parts, emptyText, showQuantity = true) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (!parts.length) {
    const msg = document.createElement("div");
    msg.className = "empty-message";
    msg.textContent = emptyText;
    grid.appendChild(msg);
    return;
  }

  parts.forEach(part => grid.appendChild(buildPartCard(part, showQuantity)));
}

// A section that's already open had its height set before the cards existed,
// so measure it again once they're in place.
function remeasureOpenSections(ids) {
  ids.forEach(id => {
    const section = document.getElementById(id);
    if (section && section.classList.contains("show")) {
      section.style.maxHeight = section.querySelector(".collapsible")
        ? "none"
        : section.scrollHeight + "px";
    }
  });
}

fetch("parts.json")
  .then(res => res.json())
  .then(data => {
    renderParts("parts-grid", data.parts || [], "No parts to show.");
    renderParts("extra-parts-grid", data.extra_parts || [], "No extra parts to show.", false);
    remeasureOpenSections(["parts-info", "standard-parts", "extra-parts"]);
  })
  .catch(err => {
    console.error("Failed to load parts data:", err);
    ["parts-grid", "extra-parts-grid"].forEach(id => {
      const grid = document.getElementById(id);
      if (grid) {
        const msg = document.createElement("div");
        msg.className = "empty-message";
        msg.textContent = "Couldn't load the parts list.";
        grid.appendChild(msg);
      }
    });
    remeasureOpenSections(["parts-info", "standard-parts", "extra-parts"]);
  });
