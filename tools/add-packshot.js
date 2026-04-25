const fs = require('fs');
const path = require('path');

const [, , sourceArg, targetArg] = process.argv;
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function slugifyFilename(value) {
  const ext = path.extname(value).toLowerCase();
  const base = path.basename(value, path.extname(value));
  const slug = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug}${ext}`;
}

if (!sourceArg || !targetArg) {
  fail('Usage: npm run add-packshot -- /path/to/source.jpg target-filename.jpg');
}

const sourcePath = path.resolve(sourceArg);
const targetFilename = slugifyFilename(targetArg);
const targetExt = path.extname(targetFilename).toLowerCase();
const targetPath = path.resolve('img', targetFilename);

if (!fs.existsSync(sourcePath)) {
  fail(`Source file not found: ${sourcePath}`);
}

if (!allowedExtensions.has(targetExt)) {
  fail(`Unsupported file type: ${targetExt}. Use jpg, jpeg, png, webp, or avif.`);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });

if (fs.existsSync(targetPath)) {
  fail(`Target already exists: ${targetPath}`);
}

fs.copyFileSync(sourcePath, targetPath);

console.log(`Packshot added: img/${targetFilename}`);
console.log('');
console.log('Enter this in the Google Sheet column "Bilder":');
console.log(targetFilename);
console.log('');
console.log('Then commit and push:');
console.log(`git add img/${targetFilename}`);
console.log(`git commit -m "Add ${targetFilename} packshot"`);
console.log('git push');
