# Film Data Guide

This app uses Google Sheets as the editorial source for film data. The app reads the published CSV and shows every valid row automatically.

## Add A Film

1. Add a new row in the Google Sheet.
2. Fill the required fields.
3. Add the packshot file to `img/`.
4. Enter the exact image filename in the `Bilder` column.
5. Commit and push the new image file.

The Sheet row appears automatically. The image appears after the image file is deployed through GitHub/Vercel.

## Required Fields

- `ID`
- `Marke`
- `Name`
- `ISO`
- `Typ`
- `Bilder`
- `Einsatz`
- `Formate`
- `Kurzbeschreibung`
- `Look Beschreibung`

Tips and technical fields can be filled progressively, but complete entries make the Guide more useful.

## ID Rules

The `ID` is the stable technical key for a film. It does not need to match the image filename.

Use:
- lowercase letters
- numbers
- underscores
- brand + film name + ISO where useful

Examples:

```txt
kodak_portra_400
kodak_gold_200
ilford_hp5_plus_400
fujifilm_velvia_50
cinestill_800t
```

Avoid changing IDs after publishing. Existing rolls link back to films by ID.

## Image Rules

Store packshots in:

```txt
img/
```

In the Sheet column `Bilder`, enter only the filename:

```txt
kodak-colorplus-200.jpg
```

The app loads it as:

```txt
img/kodak-colorplus-200.jpg
```

Recommended filename style:

```txt
brand-film-name-iso.jpg
```

Example:

```txt
kodak-colorplus-200.jpg
```

## Format Rules

Use consistent format values:

```txt
135, 120, 4x5, 8x10, Instax
```

The app normalizes `35mm`, `35`, and `135mm` to `135`, but the Sheet should use `135` directly.

## Copy Style

Keep descriptions short, practical, and consistent.

- `Kurzbeschreibung`: 1-2 sentences about use and character.
- `Look Beschreibung`: visible rendering: color, contrast, grain, mood.
- `Tipp: Belichtung`: practical exposure behavior.
- `Tipp: Dev`: process and push/pull notes.
- `Tipp: Scan`: scan/editing guidance.

## Packshot Helper

Use the helper to copy a local image into `img/` with a clean filename:

```bash
npm run add-packshot -- /path/to/source.jpg kodak-colorplus-200.jpg
```

Then commit and push:

```bash
git add img/kodak-colorplus-200.jpg
git commit -m "Add Kodak ColorPlus 200 packshot"
git push
```
