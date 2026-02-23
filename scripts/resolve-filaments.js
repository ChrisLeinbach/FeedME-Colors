import fs from "fs";

const inventory = JSON.parse(
  fs.readFileSync("filaments.json", "utf8")
);

const API_BASE = "https://filamentcolors.xyz/api/swatch/";

const USER_AGENT = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "application/json"
}

const resolved = {
  selection_last_updated: inventory.selection_last_updated,
  page_last_updated: new Date().toISOString(),
  manufacturers: {}
};

async function fetchSwatches(manufacturerId, ids) {
  const params = new URLSearchParams({
    format: "json",
    manufacturer: manufacturerId,
    id__in: ids.join(",")
  });

  const url = `${API_BASE}?${params.toString()}`;
  const res = await fetch(url, {headers: USER_AGENT});

  if (!res.ok) {
    throw new Error(`Failed to fetch swatches for manufacturer ${manufacturerId}`);
  }

  return res.json();
}

for (const [manufacturerId, items] of Object.entries(inventory.manufacturers)) {
  const ids = items.map(i => i.fcxyz_swatch_id);

  const swatches = await fetchSwatches(manufacturerId, ids);

  const swatchMap = {};
  for (const swatch of swatches.results) {
    swatchMap[swatch.id] = swatch;
  }

  resolved.manufacturers[manufacturerId] = items.map(item => {
    const swatch = swatchMap[item.fcxyz_swatch_id];

    if (!swatch) {
      console.warn(`Missing swatch ${item.fcxyz_swatch_id}`);
      return null;
    }

    return {
      fcxyz_swatch_id: item.fcxyz_swatch_id,
      fcxyz_slug: item.fcxyz_slug,
      quantity: item.quantity,

      name: swatch.color_name,
      brand: swatch.manufacturer?.name,
      material: swatch.filament_type?.name,
      hex: swatch.hex_color,
      images: {
        front: swatch.image_front,
        back: swatch.image_back,
        card: swatch.card_img
      },
      fcxyz_url: `https://filamentcolors.xyz/swatch/${item.fcxyz_slug}/`,
      mfr_url: swatch.mfr_purchase_link,
      mfr_is_available: swatch.is_available
    };
  }).filter(Boolean);
}

fs.writeFileSync(
  "static/colors_resolved.json",
  JSON.stringify(resolved, null, 2)
);