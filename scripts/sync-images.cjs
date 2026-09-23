const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

const folderVariants = [
  'SeenSoldThere',
  'seensold there',
  'seensoldthere',
  'SeenSold There',
  'images'
];

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.ico']);

function isImage(file) {
  return imageExtensions.has(path.extname(file).toLowerCase());
}

// 1. Discover all images across the repo
const imageSourceMap = new Map(); // filename -> fullPath

function scanDir(dir, depth = 0) {
  if (depth > 3 || !fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'docs' || entry.name === 'tmp' || entry.name === '.aistudio') {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, depth + 1);
      } else if (entry.isFile() && isImage(entry.name)) {
        if (!imageSourceMap.has(entry.name)) {
          imageSourceMap.set(entry.name, fullPath);
        }
      }
    }
  } catch (err) {
    // ignore unreadable
  }
}

scanDir(rootDir);

console.log(`[sync-images] Found ${imageSourceMap.size} unique image assets across repo.`);

// 2. Targets to populate
const targetDirs = [
  path.join(rootDir, 'public'),
  path.join(rootDir, 'public', 'images'),
  ...folderVariants.map(v => path.join(rootDir, 'public', v)),
  ...folderVariants.map(v => path.join(rootDir, v)),
];

if (fs.existsSync(path.join(rootDir, 'dist'))) {
  targetDirs.push(path.join(rootDir, 'dist'));
  targetDirs.push(path.join(rootDir, 'dist', 'images'));
  folderVariants.forEach(v => targetDirs.push(path.join(rootDir, 'dist', v)));
}

if (fs.existsSync(path.join(rootDir, 'docs'))) {
  targetDirs.push(path.join(rootDir, 'docs'));
  targetDirs.push(path.join(rootDir, 'docs', 'images'));
  folderVariants.forEach(v => targetDirs.push(path.join(rootDir, 'docs', v)));
}

// 3. Ensure target directories exist and copy files
for (const targetDir of targetDirs) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const [filename, sourcePath] of imageSourceMap.entries()) {
    const destPath = path.join(targetDir, filename);
    try {
      if (path.resolve(sourcePath) !== path.resolve(destPath)) {
        // Copy if dest doesn't exist or size is different
        if (!fs.existsSync(destPath) || fs.statSync(sourcePath).size !== fs.statSync(destPath).size) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    } catch (err) {
      // ignore copy errors
    }
  }
}

console.log(`[sync-images] Successfully synced images across ${targetDirs.length} target directories.`);
process.exit(0);
