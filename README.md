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

## Ce que contient le prototype

- 3 planètes (Brumelune, Cendrine, Le Grand Phare) avec **gravité sphérique** : on fait le tour complet de chaque planète.
- 19 braises à ramasser, 3 phares à rallumer : la planète retrouve ses couleurs quand son phare se rallume.
- Tremplins d'aurore : vol animé d'une planète à l'autre.
- Héros animé (course, saut, clignement des yeux, flamme qui grandit avec les braises).
- Particules, halo de lumière, ciel étoilé.
- **Sons et musique générés par le code** (aucun fichier audio, aucun droit d'auteur tiers).
- Commandes clavier + tactiles, caméra adaptée au portrait et au paysage.

## Organisation du code

```
index.html        interface : titre, HUD, boutons, écran de fin
src/main.js       boucle de jeu : gravité, caméra, braises, phares, tremplins
src/world.js      les planètes et leur contenu (liste LEVELS à modifier pour créer des niveaux)
src/fanal.js      le héros (formes simples, à remplacer par un vrai modèle 3D plus tard)
src/controls.js   clavier, joystick tactile, bouton de saut
src/audio.js      effets sonores et musique de synthèse
```

## Prochaines étapes

1. Tester sur téléphone et régler les sensations (vitesse, saut, caméra).
2. Ennemis « Ombrelles », double saut, vies et points de contrôle.
3. Vrais graphismes : modèle 3D de Fanal (Blender) et décors par planète.
4. Plus de planètes et de mécaniques (glace, plantes rebondissantes, petites lunes).
5. Emballer en appli Android/iPhone avec Capacitor.
