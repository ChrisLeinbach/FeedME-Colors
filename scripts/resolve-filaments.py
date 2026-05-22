import json
import sqlite3
from datetime import datetime

conn = sqlite3.connect('filaments.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

with open('filament_stock.json', 'r') as stock_file_handle:
    stock_data = json.load(stock_file_handle)

stock_data['page_last_updated'] = datetime.now().strftime("%B %d, %Y, %I:%M %p")

for filament_dict in stock_data['stock']:
    filament_slug = filament_dict['name']
    cursor.execute("SELECT * FROM brand WHERE slug = ?", (filament_dict["brand"],))
    row = cursor.fetchone()
    if row:
        brand_id = row['id']
        filament_dict['brand_id'] = brand_id
        filament_dict['brand_data'] = dict(row)
    else:
        cursor.execute("SELECT * FROM brand")
        available_brands = [dict(row) for row in cursor.fetchall()]
        print(json.dumps(available_brands, indent=4))
        raise RuntimeError(f"Could not find brand with matching slug \'{filament_dict['brand']}\'.")

    cursor.execute("SELECT * FROM material WHERE brand_id = ? and slug = ?", (brand_id, filament_dict['material'],))
    row = cursor.fetchone()
    if row:
        material_id = row['id']
        filament_dict['material_id'] = material_id
        filament_dict['material_data'] = dict(row)
    else:
        cursor.execute("SELECT * FROM material WHERE brand_id = ?", (brand_id,))
        available_materials = [dict(row) for row in cursor.fetchall()]
        print(json.dumps(available_materials, indent=4))
        raise RuntimeError(f"Could not find material with matching slug \'{filament_dict['material']}\'.")

    cursor.execute("SELECT * FROM filament WHERE brand_id = ? and material_id = ? and slug = ?", (brand_id, material_id, filament_dict['filament'],))
    row = cursor.fetchone()
    if row:
        filament_id = row['id']
        filament_dict['filament_id'] = filament_id
        filament_dict['filament_data'] = dict(row)
    else:
        cursor.execute("SELECT * FROM filament WHERE brand_id = ? and material_id = ?", (brand_id, material_id,))
        available_filaments = [dict(row) for row in cursor.fetchall()]
        print(json.dumps(available_filaments, indent=4))
        raise RuntimeError(f"Could not find filament with matching slug \'{filament_dict['filament']}\'.")

    cursor.execute("SELECT * FROM variant WHERE filament_id = ? and slug = ?", (filament_id, filament_slug, ))
    row = cursor.fetchone()
    if row:
        variant_id = row['id']
        filament_dict['variant_id'] = variant_id
        filament_dict['variant_data'] = dict(row)
    else:
        cursor.execute("SELECT * FROM variant WHERE filament_id = ?", (filament_id, ))
        available_variants = [dict(row) for row in cursor.fetchall()]
        print(json.dumps(available_variants, indent=4))
        raise RuntimeError(f"Could not find variant with matching slug \'{filament_slug}\'.")

with open('./static/resolved_stock.json', 'w') as resolved_file_handle:
    json.dump(stock_data, resolved_file_handle, indent=4)
