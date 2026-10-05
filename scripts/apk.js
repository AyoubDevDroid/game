// Fabrique l'appli Android du jeu.
//   npm run apk                       → APK de test : apk/astres-eteints.apk (à installer sur ton téléphone)
//   npm run aab -- --version=2:1.0.1   → fichier signé pour le Play Store : apk/astres-eteints.aab
// Prérequis : SDK Android et Java (ceux d'Android Studio). Sous Windows, ils sont trouvés tout seuls.
// Pour l'AAB : la clé de publication dans cles/key.properties (dossier ignoré par git), au format :
//   storeFile=astres.jks  storePassword=…  keyAlias=…  keyPassword=…   (une valeur par ligne)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIN = process.platform === 'win32';
const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (WIN ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : path.join(process.env.HOME || '', 'Android', 'Sdk'));
const JAVA = process.env.JAVA_HOME || (WIN ? 'C:\\Program Files\\Android\\Android Studio\\jbr' : '');
const AAB = process.argv.includes('--aab');
const [CODE, NOM] = ((process.argv.find(a => a.startsWith('--version=')) || '--version=1:0.1.0').slice(10)).split(':');

const run = (cmd, cwd = ROOT, env = {}) => { console.log('  $ ' + cmd); execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } }); };
const javaEnv = JAVA ? { JAVA_HOME: JAVA } : {};

if (!fs.existsSync(SDK)) throw new Error(`SDK Android introuvable (${SDK}). Installe Android Studio, ou indique son chemin dans ANDROID_HOME.`);

// 1. Le jeu web, puis copie dans le projet Android
run('npx vite build');
run('npx cap sync android');

// 2. Version et chemin du SDK
const adir = path.join(ROOT, 'android');
fs.writeFileSync(path.join(adir, 'local.properties'), 'sdk.dir=' + SDK.replace(/\\/g, '\\\\').replace(/:/g, '\\:') + '\n');
const gradle = path.join(adir, 'app', 'build.gradle');
fs.writeFileSync(gradle, fs.readFileSync(gradle, 'utf8').replace(/versionCode \d+/, 'versionCode ' + CODE).replace(/versionName "[^"]*"/, `versionName "${NOM}"`));

// 3. Compilation
const gradlew = '"' + path.join(adir, WIN ? 'gradlew.bat' : 'gradlew') + '"';
if (!WIN) fs.chmodSync(path.join(adir, 'gradlew'), 0o755);
fs.mkdirSync(path.join(ROOT, 'apk'), { recursive: true });

if (!AAB) {
  run(gradlew + ' assembleDebug --console=plain', adir, javaEnv);
  const dest = path.join(ROOT, 'apk', 'astres-eteints.apk');
  fs.copyFileSync(path.join(adir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'), dest);
  console.log(`\n✓ ${dest} (${Math.round(fs.statSync(dest).size / 1024)} Ko) — copie-le sur ton téléphone et ouvre-le pour l'installer.`);
} else {
  const kpFile = path.join(ROOT, 'cles', 'key.properties');
  if (!fs.existsSync(kpFile)) throw new Error('Clé de publication absente : cles/key.properties');
  run(gradlew + ' bundleRelease --console=plain', adir, javaEnv);
  const kp = Object.fromEntries(fs.readFileSync(kpFile, 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  const dest = path.join(ROOT, 'apk', 'astres-eteints.aab');
  fs.copyFileSync(path.join(adir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'), dest);
  const jarsigner = JAVA ? `"${path.join(JAVA, 'bin', 'jarsigner')}"` : 'jarsigner';
  run(`${jarsigner} -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${path.join(ROOT, 'cles', kp.storeFile)}" -storepass "${kp.storePassword}" -keypass "${kp.keyPassword}" "${dest}" ${kp.keyAlias}`);
  console.log(`\n✓ ${dest} (version ${NOM}, code ${CODE}) — à envoyer sur la Play Console.`);
}
