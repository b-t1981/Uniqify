import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const plistPath = join(process.cwd(), 'ios', 'App', 'App', 'Info.plist')

if (!existsSync(plistPath)) {
  console.log('Info.plist introuvable — exécutez « npx cap add ios » d’abord.')
  process.exit(0)
}

const permissions = {
  NSPhotoLibraryUsageDescription:
    'Uniqify accède à vos photos pour détecter les doublons et les supprimer de votre galerie.',
  NSPhotoLibraryAddUsageDescription:
    'Uniqify supprime les doublons sélectionnés dans votre photothèque.',
  NSPhotoLibraryFullLibraryUsageDescription:
    'Uniqify a besoin d’un accès complet pour supprimer les doublons dans toute votre galerie.',
}

let content = readFileSync(plistPath, 'utf8')

for (const [key, value] of Object.entries(permissions)) {
  if (content.includes(`<key>${key}</key>`)) {
    content = content.replace(
      new RegExp(`(<key>${key}</key>\\s*<string>)[^<]*(</string>)`),
      `$1${value}$2`,
    )
    continue
  }

  const insertion = `\t<key>${key}</key>\n\t<string>${value}</string>\n`
  content = content.replace('</dict>\n</plist>', `${insertion}</dict>\n</plist>`)
}

if (!content.includes('<key>UISupportedInterfaceOrientations</key>')) {
  // noop — orientations already set by Capacitor template
}

writeFileSync(plistPath, content)
console.log('Permissions photothèque iOS mises à jour')
