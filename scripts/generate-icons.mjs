import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'assets', 'uniqify-app-icon.png')
const publicDir = join(root, 'public')
const iosIconDir = join(
  root,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
)

const outputs = [
  { path: join(publicDir, 'pwa-192.png'), size: 192 },
  { path: join(publicDir, 'pwa-512.png'), size: 512 },
  { path: join(publicDir, 'apple-touch-icon.png'), size: 180 },
  { path: join(publicDir, 'favicon-32.png'), size: 32 },
  { path: join(iosIconDir, 'AppIcon-512@2x.png'), size: 1024 },
]

async function resizeIcon({ path, size }) {
  await mkdir(dirname(path), { recursive: true })
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path)
  console.log(`✓ ${path.replace(root, '.')} (${size}×${size})`)
}

for (const output of outputs) {
  await resizeIcon(output)
}

console.log('Icônes générées depuis assets/uniqify-app-icon.png')
