# Liste Meshy : ce qu'il faut créer (budget 1000 crédits)

Un objet texturé coûte 30 crédits, donc environ **33 objets possibles**.
On en prévoit **27**, et on garde environ 190 crédits pour refaire ceux qui ratent.
Les prompts complets sont dans `prompts-3d.md` : colle le STYLE COMMUN, puis le prompt de l'objet.

## Comment économiser

- **Une seule image Gemini par objet** : une planche « face / profil / dos » dans la même image. Avec le forfait gratuit, fais-en quelques-unes par jour, dans l'ordre ci-dessous.
- **Un seul modèle pour plusieurs usages** : le jeu recolore les modèles. Un gardien sert donc pour les 18 peuples, un arbre pour tous les mondes, etc.
- **Les skins plus tard** : un skin = le même modèle avec une autre texture. Garde toujours le modèle de base de Fanal pour les retexturer.
- **Personnages qui bougent** (Fanal, gardien, Mamie Mèche) :
  - demande à Gemini la pose « **A-pose**, arms slightly away from the body, legs apart » ;
  - c'est indispensable pour que Meshy pose le squelette correctement ;
  - c'est aussi ce qui permettra au multijoueur de partager les mêmes animations.
- **Les animaux** : on garde ceux du jeu actuel pour l'instant.

## Ordre de création

### Lot 1 : le cœur du jeu (8 objets, 240 crédits). À faire en premier.

| # | Fichier | Quoi | Remarques |
|---|---|---|---|
| 1 | `fanal.glb` | Fanal, le héros | A-pose, puis auto-rig + animations idle, walk, run, jump. Il servira de base au multijoueur. |
| 2 | `ombrelle.glb` | ennemi de base | Le plus présent dans le jeu. |
| 3 | `phare.glb` | le phare | Le but de chaque planète. |
| 4 | `cristal.glb` | cristal de lumière | Petit et simple. |
| 5 | `vaisseau.glb` | la Luciole | Le nez doit pointer vers l'avant. |
| 6 | `gardien.glb` | habitant / gardien prisonnier | A-pose et couleurs claires : le jeu le recolore pour chaque peuple. |
| 7 | `decor-tous-ilot.glb` | île flottante | Voir le prompt plus bas. Très importante pour l'ambiance. |
| 8 | `decor-tous-arbre-1.glb` | arbre rond et touffu | Voir le prompt plus bas. Le jeu change la couleur des feuilles selon le monde. |

### Lot 2 : les ennemis (8 objets, 240 crédits)

| # | Fichier | Quoi |
|---|---|---|
| 9 | `ombrelle-sauteuse.glb` | sauteuse |
| 10 | `crabe.glb` | crabe d'ombre |
| 11 | `herisson.glb` | hérisson de lave |
| 12 | `gelee.glb` | gelée sucrée |
| 13 | `follet.glb` | feu-follet |
| 14 | `meduse.glb` | électro-méduse |
| 15 | `tireuse.glb` | ombrelle tireuse |
| 16 | `boss-ombrelle.glb` | la Grande Ombrelle (boss) |

### Lot 3 : objets et décors (8 objets, 240 crédits)

| # | Fichier | Quoi |
|---|---|---|
| 17 | `coffre.glb` | coffre au trésor |
| 18 | `relais.glb` | lanterne-relais (point de sauvegarde) |
| 19 | `cage-ombre.glb` | cage d'ombre des prisonniers |
| 20 | `decor-tous-rocher.glb` | gros rocher arrondi sur lequel on peut monter |
| 21 | `decor-tous-champi.glb` | champignon géant (on peut sauter dessus) |
| 22 | `decor-tous-petit.glb` | grande fleur colorée |
| 23 | `decor-tous-escalier-moyen.glb` | bloc de pierre et d'herbe pour grimper |
| 24 | `decor-tous-arbre-2.glb` | 2e arbre (palmier courbé ou arbre en boule) |

### Lot 4 : histoire (3 objets, 90 crédits)

| # | Fichier | Quoi |
|---|---|---|
| 25 | `mamie-meche.glb` | Mamie Mèche (A-pose) |
| 26 | `nocturna.glb` | Nocturna, boss finale |
| 27 | `givron.glb` | givron (mondes de neige) |

## Prompts des décors (après « Stylized 3D game prop, », à la place du style personnage)

- **Île flottante** (`decor-tous-ilot`) :
  `A floating sky island chunk for a platform game: flat grassy top with short lush grass and two tiny flowers, thick layered rocky cliff sides in warm beige and brown stone, the bottom tapering to a point with hanging roots and small vines, chunky rounded shapes, bright cheerful colors.`
- **Arbre rond** (`decor-tous-arbre-1`) :
  `A cute cartoon tree with a short thick curvy trunk, smooth brown bark with soft grooves, a big round puffy canopy made of several clumped leaf balls, lush saturated green leaves, chunky toy-like proportions.`
- **Arbre 2** (`decor-tous-arbre-2`) :
  `A cartoon palm tree with a bent segmented trunk and big glossy fan leaves, toy-like proportions.`
- **Rocher** (`decor-tous-rocher`) :
  `A big rounded boulder with a flat-ish top you can stand on, soft beige-grey stone with moss patches and small grass tufts at the base.`
- **Champignon** (`decor-tous-champi`) :
  `A giant bouncy mushroom with a wide round cap, white polka dots, thick cream stem, cap color bright red.`
- **Fleur** (`decor-tous-petit`) :
  `A big cartoon flower with large glossy petals, a golden center and two broad leaves, cheerful.`
- **Bloc pour grimper** (`decor-tous-escalier-moyen`) :
  `A chunky square stone block with rounded edges, grass growing on the top, small cracks and pebbles, platform-game building block.`

## Réglages Meshy

- *Image to 3D*, style **Cartoon / Stylized**, texture PBR.
- Personnages : 10 000 à 20 000 polygones. Décors : 5 000 à 10 000, car ils sont répétés beaucoup de fois.
- Export **.glb**.
- Dépose les fichiers dans `public/modeles/` ou envoie-les-moi. Chaque fichier remplace tout seul l'ancienne version.
