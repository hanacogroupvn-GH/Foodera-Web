#!/usr/bin/env python3
"""
Bulk product importer — no CMS required.

Workflow:
  1. Open data/products-import.csv in Excel/Google Sheets.
  2. Add/edit rows. For a product's photo, put the image file in
     public/media/products/ and write just the filename in the `image` column
     (e.g. "cashew-ww210-optimized.webp").
  3. Save/export as CSV (keep UTF-8 encoding), overwriting data/products-import.csv.
  4. Run:  python3 scripts/import_products.py
     (or:  npm run products:import)
  5. Check the printed warnings, then reload the site.

CSV columns:
  id, slug, category, subCategory, name, shortDescription, description,
  image, gallery, specifications, filters, isActive, status

- specifications / filters: "Key: Value; Key2: Value2" (semicolon-separated)
- gallery: extra image filenames, semicolon-separated (optional)
- isActive: TRUE/FALSE (optional, defaults to TRUE for new products)
- status: draft / published / archived (optional, defaults to "published")
- Leave a cell blank to keep whatever is already in products.json for that
  field (only applies to products that already exist).
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "products-import.csv"
JSON_PATH = ROOT / "data" / "products.json"
IMAGES_DIR = ROOT / "public" / "media" / "products"


def parse_kv_list(raw: str) -> dict:
    result = {}
    for chunk in raw.split(";"):
        chunk = chunk.strip()
        if not chunk:
            continue
        if ":" not in chunk:
            print(f"  WARNING: skipping malformed entry (missing ':'): {chunk!r}")
            continue
        key, value = chunk.split(":", 1)
        result[key.strip()] = value.strip()
    return result


def resolve_image(filename: str, row_id: str, warnings: list) -> str:
    filename = filename.strip()
    if not filename:
        return ""
    if filename.startswith("http://") or filename.startswith("https://") or filename.startswith("/"):
        return filename
    if not (IMAGES_DIR / filename).exists():
        warnings.append(f"{row_id}: image file not found in public/media/products/: {filename}")
    return f"/media/products/{filename}"


def resolve_gallery(raw: str, row_id: str, warnings: list):
    raw = raw.strip()
    if not raw:
        return None
    if raw == "-":
        return None
    urls = []
    for filename in raw.split(";"):
        filename = filename.strip()
        if not filename:
            continue
        urls.append(resolve_image(filename, row_id, warnings))
    return urls or None


def parse_bool(raw: str, default: bool) -> bool:
    raw = raw.strip().lower()
    if not raw:
        return default
    return raw in ("true", "1", "yes", "y")


def main():
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found.")
        sys.exit(1)

    existing = json.loads(JSON_PATH.read_text(encoding="utf-8")) if JSON_PATH.exists() else []
    by_id = {p["id"]: p for p in existing}
    order = [p["id"] for p in existing]

    warnings = []
    errors = []
    created, updated = 0, 0

    with CSV_PATH.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for line_no, row in enumerate(reader, start=2):
            row = {k: (v or "").strip() for k, v in row.items()}
            row_id = row.get("id", "")
            if not row_id:
                errors.append(f"line {line_no}: missing id, row skipped")
                continue

            current = by_id.get(row_id)

            image = resolve_image(row.get("image", ""), row_id, warnings)
            if not image and not current:
                errors.append(f"line {line_no} ({row_id}): new product needs an `image` value, row skipped")
                continue

            gallery = resolve_gallery(row.get("gallery", ""), row_id, warnings)
            specs_raw = row.get("specifications", "")
            filters_raw = row.get("filters", "")

            if current:
                product = dict(current)
                for field in ("slug", "category", "subCategory", "name", "shortDescription", "description"):
                    if row.get(field):
                        product[field] = row[field]
                if image:
                    product["image"] = image
                if gallery is not None:
                    product["gallery"] = gallery
                if specs_raw:
                    product["specifications"] = parse_kv_list(specs_raw)
                if filters_raw:
                    product["filters"] = parse_kv_list(filters_raw)
                if row.get("isActive"):
                    product["isActive"] = parse_bool(row["isActive"], True)
                if row.get("status"):
                    product["status"] = row["status"]
                updated += 1
            else:
                missing = [f for f in ("slug", "category", "subCategory", "name", "shortDescription", "description") if not row.get(f)]
                if missing:
                    errors.append(f"line {line_no} ({row_id}): missing required field(s) {missing}, row skipped")
                    continue
                product = {
                    "id": row_id,
                    "slug": row["slug"],
                    "name": row["name"],
                    "isActive": parse_bool(row.get("isActive", ""), True),
                    "status": row.get("status") or "published",
                    "category": row["category"],
                    "subCategory": row["subCategory"],
                    "description": row["description"],
                    "shortDescription": row["shortDescription"],
                    "image": image,
                }
                if gallery is not None:
                    product["gallery"] = gallery
                product["specifications"] = parse_kv_list(specs_raw)
                product["filters"] = parse_kv_list(filters_raw)
                order.append(row_id)
                created += 1

            by_id[row_id] = product

    result = [by_id[pid] for pid in order]
    JSON_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"\nDone: {created} product(s) created, {updated} updated.")
    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  - {w}")
    if errors:
        print(f"\n{len(errors)} row(s) skipped due to errors:")
        for e in errors:
            print(f"  - {e}")
    print(f"\nWrote {JSON_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
