# Astres éteints — univers du jeu

*Titre provisoire. Tout ici est original : à faire évoluer librement.*

## L'histoire

Dans les **15 galaxies**, chaque planète a un **phare** qui éclaire la nuit. Une nuit, une grande ombre est passée : tous les phares se sont éteints, les planètes sont devenues grises et froides, et les Ombrelles ont enfermé les petits gardiens de phare dans des cages d'ombre.

Il reste **Fanal**, le plus petit gardien. À bord de sa **Luciole**, il voyage de planète en planète, ramasse les **braises** tombées au sol et rallume chaque phare. Quand un phare se rallume, la planète retrouve ses couleurs, la cage fond et le **petit gardien** prisonnier rejoint l'équipage de la Luciole.

## Le héros : Fanal

- Une petite **lanterne vivante** : corps rond en verre, une **flamme** à l'intérieur, deux petites jambes, une poignée sur la tête.
- Plus il ramasse de braises, plus sa flamme brille.
- Caractère : courageux, un peu maladroit, il parle peu (des petits sons).

## Les 15 galaxies (src/univers.js)

Archipel du Ciel · Nébuleuse Framboise · Spirale Menthe · Voile d'Ambre · Nuée Lagon · Couronne de Givre · Jardin des Comètes · Mer de Lucioles · Anneau Mandarine · Brume Violette · Ruche d'Étoiles · Cascade Aurore · Forge Céleste · Abysse Nacré · **Cœur de l'Ombre** (la dernière). Chacune a son ciel.

**15 planètes par galaxie**, générées à partir d'une graine (identiques à chaque partie) :
- **Planètes 1 à 14** : rayon 15 à 26, un phare, 7 à 13 braises, des Ombrelles, un **petit gardien prisonnier**. 10 biomes : menthe, lave, étoilée, givre, verdoyance, dunes, corail, marais, lagon, volcan. Brumelune et Cendrine sont les deux premières.
- **Planète 15 : le Grand Phare**, gardé par le **boss**, la **Grande Ombrelle** (ombrelle framboise, couronne de piquants dorés). Il faut l'écraser 3 fois (plus dans les galaxies lointaines) ; à chaque coup elle est sonnée puis accélère. Le Grand Phare rallumé **libère la galaxie** et ouvre la suivante.

**Progression** : au départ, 3 planètes sont ouvertes ; chaque phare rallumé en ouvre une de plus. Le Grand Phare s'ouvre après **8 phares** rallumés dans la galaxie. Les Ombrelles sont plus nombreuses et plus rapides de galaxie en galaxie.

**La Luciole** (le vaisseau) est garée sur chaque planète, signalée par une colonne de lumière et une flèche. « Embarquer » : Fanal monte à bord, la Luciole **décolle**, et l'**univers en 3D** s'ouvre (noyau lumineux, bras d'étoiles, orbites, les 15 planètes). On choisit sa destination : le **vol est automatique** (cinématique), puis la Luciole **se pose** et Fanal en sort. Vers une autre galaxie : **saut hyperespace**.

Idées pour la suite : planètes de glace (on glisse), planètes-jardins (plantes rebondissantes), planètes creuses, petites lunes à sauter de l'une à l'autre, un boss différent par galaxie, boutique de cosmétiques avec les éclats.

## Le style visuel : « coloré avec du peps »

Planche de référence : [`docs/style/planche.png`](docs/style/planche.png). **Concepts validés** (images finales du look) : [`docs/style/CONCEPTS.md`](docs/style/CONCEPTS.md).

- **Low-poly acidulé** : formes simples à facettes, couleurs vives et saturées.
- **Le contraste est le cœur du jeu** : une planète éteinte est **sombre, grise et fade** ; quand son phare se rallume, la couleur **se répand en vague** depuis le phare et tout devient éclatant. Ce passage du fade au coloré est la récompense principale du joueur.
- **Palette** : Soleil `#ffd23f` · Mandarine `#ff7a00` · Framboise `#ff3d81` · Raisin `#b44dff` · Lagon `#00d2ff` · Menthe `#3ee6a8` · Citron vert `#a7f432` · Nuit `#3b1f5c` (contours et yeux).
- **Ciel** : dégradé violet → rose, étoiles blanches.
- **Fanal** : cadre framboise, poignée et pieds dorés, **écharpe lagon** qui flotte quand il court. **Sa flamme est son visage** : ravie, surprise, bleue quand il a froid ou peur, rose en super-lumière. Elle grandit avec les braises.
- **Planètes** : Brumelune (menthe, champignons framboise et soleil), Cendrine (mandarine, cristaux framboise), Givrelle (glace lagon, aurores), Verdoyance (citron vert, fleurs qui font rebondir).

## Les mécaniques

- **Gravité sphérique** : on court tout autour de chaque planète, le « haut » change en permanence.
- **Saut**, et passage d'une planète à l'autre par les tremplins d'aurore.
- **Collecte** : braises, puis phare à rallumer.
- **Double saut** : un deuxième appui en l'air, avec une pirouette.
- **Chaque planète a son identité** (univers.js) : une **humeur** (bonbon, néon, tropical, crépuscule, givré, féérique) qui règle le ciel, la saturation et les particules dans l'air (bulles, lucioles, pollen, braises, neige, étoiles) ; une **palette** vive tirée de sa teinte, appliquée au sol et aux objets ; un **relief** (doux, terrasses, pics, dunes) ; un **élément signature** (champignons géants, forêt de cristaux, archipel d'îlots en spirale, cercle de colonnes, jardin de fleurs géantes, canyon) ; et sa **ressource** à collecter en traînées (pétales, rubis, poussière d'étoile, perles, cœurs de lune, glands d'or, cristaux chantants, anneaux d'aurore), gardée pour la future boutique.
- **Ombrelles** : petites ombres coiffées d'une ombrelle violette. Elles errent, repèrent Fanal (leurs yeux virent au rose) et le poursuivent, un peu moins vite que lui. Si elles le touchent, elles soufflent une braise, qui retourne à sa place. On les chasse en leur sautant dessus (Fanal rebondit), et la vague de couleur du phare rallumé les dissout. Brumelune 2, Cendrine 4, Grand Phare 3.
- **Plus tard** : attaque de lumière, boss de fin d'archipel, pièces/cosmétiques.

## Modes de jeu

### Mode histoire (en cours)
Fanal rallume les phares de l'archipel, planète après planète.

### Multijoueur 3 contre 3 (idée validée, après le mode histoire)
Deux équipes s'affrontent sur une planète : les **Gardiens** (lanternes, lumière) contre les **Ombrelles** (ombres, obscurité).

- **Course aux cristaux** : récupérer le plus de cristaux et les rapporter à son phare avant la fin du temps.
- **Conquête de territoire** : chaque équipe colore le sol en courant ; à la fin du chrono, l'équipe qui a la plus grande surface gagne. C'est la suite logique du jeu : la vague de couleur qui part du phare devient l'arme des Gardiens, l'ombre qui éteint devient celle des Ombrelles.
- **Phares à capturer** : 3 phares sur la planète, chaque équipe doit les allumer (ou les éteindre) et les tenir.

Étapes prévues : 1) version contre l'ordinateur (bots) pour régler le fun, 2) multijoueur sur le même Wi-Fi, 3) multijoueur en ligne (serveur de jeu, salons, classement).

## Commandes

- **Téléphone** : joystick à gauche (n'importe où sur la moitié gauche de l'écran), bouton de saut à droite.
- **Ordinateur** : flèches ou ZQSD/WASD pour bouger, Espace pour sauter.

## Règles d'originalité (à respecter toujours)

1. **Aucun** nom, personnage, objet, son, musique ou niveau repris d'un jeu existant.
2. On peut s'inspirer de **mécaniques** (gravité sphérique, sauts, collecte) : elles ne sont protégées par personne.
3. Pas de ressemblance visuelle volontaire avec un personnage connu (couleurs, silhouette, accessoires).
4. Les sons et musiques sont **générés par le jeu** (synthèse), ou faits par nous, ou viennent de banques **libres de droits** dont on garde la licence.
5. Ne jamais lire ni copier le code d'une décompilation de jeu (Petari ou autre) : tout le code est écrit de zéro.
