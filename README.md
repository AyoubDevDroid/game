# Astres éteints (version 0.2)

Jeu de plateforme 3D original pour mobile : **Fanal**, une petite lanterne vivante, court tout autour des planètes de 15 galaxies pour ramasser des braises, rallumer leurs phares et libérer les petits gardiens. L'univers est décrit dans [`UNIVERS.md`](UNIVERS.md).

## Lancer le jeu

Il faut [Node.js](https://nodejs.org) (version LTS).

```
git clone https://github.com/AyoubDevDroid/game.git
cd game
npm install
npm run dev
```

Ouvrir l'adresse affichée (`http://localhost:5173`). Pour tester sur ton téléphone : même Wi-Fi que l'ordinateur, puis ouvrir l'adresse « Network » affichée par la commande.

- **Ordinateur** : flèches ou ZQSD/WASD pour courir, Espace pour sauter (appuie une deuxième fois en l'air pour le double saut).
- **Téléphone** : pouce gauche n'importe où sur la moitié gauche = joystick, bouton SAUT à droite.
- **La Luciole** : une colonne de lumière et une flèche au bord de l'écran montrent où elle est garée. Près du vaisseau, bouton « Embarquer » (touche E) : décollage, puis l'univers en 3D (glisser pour tourner, pincer ou molette pour zoomer, toucher une planète puis « Y aller »). Le vol est automatique.
- **Paysage** : le jeu se joue en mode paysage (verrouillé dans l'appli Android).

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
- **Sauvegarde** : phares rallumés, gardiens libérés, galaxies ouvertes, éclats ; « Continuer » reprend sur la dernière planète visitée.
- **Qualité automatique** : si le téléphone peine, la résolution du rendu baisse toute seule.

## Ce que contient le jeu

- **15 galaxies de 15 planètes** (225 planètes générées) avec **gravité sphérique** : on fait le tour complet de chaque planète.
- Braises à ramasser et phares à rallumer : la planète retrouve ses couleurs quand son phare se rallume, et le **petit gardien** prisonnier est libéré.
- **Boss** sur la 15e planète de chaque galaxie : la Grande Ombrelle garde le Grand Phare.
- **La Luciole** : univers en 3D (galaxie, orbites, planètes), vol automatique avec décollage et atterrissage, saut hyperespace entre galaxies.
- Ennemis **Ombrelles**, double saut.
- Héros animé (course, saut, clignement des yeux, flamme qui grandit avec les braises).
- Particules, halo de lumière, ciel étoilé.
- **Sons et musique générés par le code** (aucun fichier audio, aucun droit d'auteur tiers).
- Commandes clavier + tactiles, caméra adaptée au portrait et au paysage.

## Brancher les modèles 3D (Meshy, Tripo…)

Dépose les fichiers `.glb` dans `public/modeles/` avec ces noms, puis relance `npm run dev` : ils remplacent automatiquement les formes dessinées par le code.

| Fichier | Remplace |
|---|---|
| `fanal.glb` | Fanal. Modèle **riggé et animé** (Meshy, Mixamo…) : ses animations sont jouées toutes seules selon leur nom — `idle`/repos, `walk`/marche, `run`/course, `jump`/saut. Modèle fixe : le globe **vide**, la flamme-visage reste celle du code |
| `vaisseau.glb` | la Luciole (nez vers +Z) |
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
src/main.js       boucle de jeu : gravité, caméra, braises, phares ; enchaîne planète → carte → trajet
src/univers.js    les 15 galaxies, les 10 biomes, la génération des planètes, la sauvegarde
src/world.js      une planète (relief, phare, braises, décors, brume) et le ciel de la galaxie
src/cosmos.js     l'univers en 3D : galaxie, planètes, choix de la destination, vol automatique, hyperespace
src/vaisseau.js   la Luciole
src/gardien.js    les petits gardiens prisonniers et leur libération
src/lumiere.js    l'effet « éteint → coloré » (vague de couleur depuis le phare, fissures de lave…)
src/amenagement.js aménagement des planètes en objets 3D : ambiance par biome, escaliers, îlots flottants, cachettes, collisions
src/decor.js      décors dessinés par le code (secours si les objets 3D ne se chargent pas)
public/decors/    objets 3D des packs Kenney (CC0, voir CREDITS.md)
src/modeles.js    chargement des modèles .glb de public/modeles
src/fanal.js      le héros et sa flamme-visage (5 expressions)
src/controls.js   clavier, joystick tactile, bouton de saut
src/audio.js      effets sonores et musique de synthèse
src/mobile.js     vibrations, plein écran, écran toujours allumé
src/ombrelles.js  ennemis Ombrelles et boss Grande Ombrelle
```

## Prochaines étapes

1. Tester sur téléphone et régler la difficulté (Ombrelles, astéroïdes, boss).
2. Un boss différent par galaxie, mécaniques par biome (glace qui glisse, fleurs rebondissantes).
3. Vrais graphismes : modèles 3D Meshy de Fanal, de la Luciole et des décors.
4. Boutique de cosmétiques avec les éclats d'étoile.
5. Version iPhone (il faudra un Mac, ou un Mac en ligne, et un compte développeur Apple).
