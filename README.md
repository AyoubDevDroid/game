# Astres éteints (prototype 0.1)

Jeu de plateforme 3D original pour mobile : **Fanal**, une petite lanterne vivante, court tout autour de petites planètes pour ramasser des braises et rallumer leurs phares. L'univers est décrit dans [`UNIVERS.md`](UNIVERS.md).

## Lancer le jeu

Il faut [Node.js](https://nodejs.org) (version LTS).

```
git clone https://github.com/AyoubDevDroid/game.git
cd game
npm install
npm run dev
```

Ouvrir l'adresse affichée (`http://localhost:5173`). Pour tester sur ton téléphone : même Wi-Fi que l'ordinateur, puis ouvrir l'adresse « Network » affichée par la commande.

- **Ordinateur** : flèches ou ZQSD/WASD pour courir, Espace pour sauter.
- **Téléphone** : pouce gauche n'importe où sur la moitié gauche = joystick, bouton SAUT à droite.

`npm run build` fabrique la version finale dans `dist/`.

## Installer le jeu sur ton téléphone Android

Il faut **Android Studio** installé sur le PC : il fournit le SDK Android et Java. Ensuite :

```
npm install
npm run apk
```

Le fichier `apk/astres-eteints.apk` est créé. Copie-le sur ton téléphone (câble USB, Google Drive, mail…) et ouvre-le pour l'installer. Android demande d'autoriser l'installation d'applis « de sources inconnues » : c'est normal pour une appli de test.

Pour le **Play Store** : `npm run aab -- --version=1:0.1.0` fabrique le fichier signé `apk/astres-eteints.aab`. Il faut d'abord une clé de publication dans `cles/key.properties` (voir l'en-tête de `scripts/apk.js`). Ce dossier n'est jamais envoyé sur GitHub.

Identifiant de l'appli : `com.sup762.astres`. Icône et écran de démarrage : `ressources/icone.svg` (le PNG et les icônes Android sont générés à partir de lui).

### Ce qui est prévu pour le téléphone

- Commandes tactiles (joystick + bouton SAUT), caméra adaptée au portrait et au paysage.
- **Vibrations** : saut, braise ramassée, atterrissage, phare rallumé, envol.
- **Plein écran** (barres du système cachées) et **écran toujours allumé** pendant la partie.
- **Pause automatique** quand on quitte l'appli (appel, autre appli) : jeu et son se figent.
- **Sauvegarde** : à chaque phare rallumé ; le bouton « Continuer » reprend à la planète suivante.
- **Qualité automatique** : si le téléphone peine, la résolution du rendu baisse toute seule.

## Ce que contient le prototype

- 3 planètes (Brumelune, Cendrine, Le Grand Phare) avec **gravité sphérique** : on fait le tour complet de chaque planète.
- 19 braises à ramasser, 3 phares à rallumer : la planète retrouve ses couleurs quand son phare se rallume.
- Tremplins d'aurore : vol animé d'une planète à l'autre.
- Héros animé (course, saut, clignement des yeux, flamme qui grandit avec les braises).
- Particules, halo de lumière, ciel étoilé.
- **Sons et musique générés par le code** (aucun fichier audio, aucun droit d'auteur tiers).
- Commandes clavier + tactiles, caméra adaptée au portrait et au paysage.

## Brancher les modèles 3D (Meshy, Tripo…)

Dépose les fichiers `.glb` dans `public/modeles/` avec ces noms, puis relance `npm run dev` : ils remplacent automatiquement les formes dessinées par le code.

| Fichier | Remplace |
|---|---|
| `fanal.glb` | le corps de Fanal (globe **vide** : la flamme-visage reste celle du code) |
| `phare.glb` | les phares |
| `champignon.glb` · `maison.glb` · `cristal.glb` · `rocher.glb` · `touffe.glb` | les décors des planètes |

Les tailles sont ajustées toutes seules. Prompts et réglages conseillés : [`docs/style/CONCEPTS.md`](docs/style/CONCEPTS.md).

## Organisation du code

```
index.html        interface : titre, HUD, boutons, écran de fin
capacitor.config.json  réglages de l'appli mobile (nom, identifiant)
android/          projet Android (Capacitor) — `npm run apk` le met à jour
scripts/apk.js    fabrique l'APK de test ou l'AAB du Play Store
ressources/       icône et écran de démarrage
src/main.js       boucle de jeu : gravité, caméra, braises, phares, tremplins
src/world.js      les planètes, leur relief, leurs décors et le ciel (liste LEVELS à modifier pour créer des niveaux)
src/lumiere.js    l'effet « éteint → coloré » (vague de couleur depuis le phare, fissures de lave…)
src/decor.js      champignons, maisons, cristaux, rochers dessinés par le code
src/modeles.js    chargement des modèles .glb de public/modeles
src/fanal.js      le héros et sa flamme-visage (5 expressions)
src/controls.js   clavier, joystick tactile, bouton de saut
src/audio.js      effets sonores et musique de synthèse
src/mobile.js     vibrations, plein écran, écran toujours allumé
```

## Prochaines étapes

1. Tester sur téléphone et régler les sensations (vitesse, saut, caméra).
2. Ennemis « Ombrelles », double saut, vies et points de contrôle.
3. Vrais graphismes : modèle 3D de Fanal (Blender) et décors par planète.
4. Plus de planètes et de mécaniques (glace, plantes rebondissantes, petites lunes).
5. Version iPhone (il faudra un Mac et un compte développeur Apple).
