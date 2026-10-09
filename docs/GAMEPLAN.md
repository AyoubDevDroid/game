# Astres éteints : plan de jeu (architecture façon Astro Bot)

> But : un platformer **court, dense, généreux et sans frustration**, où chaque niveau rapporte quelque chose qu'on **voit vivre dans le hub**.
> On garde notre univers (Fanal, Mamie Mèche, la Luciole, Nocturna, les phares) et notre identité visuelle.

---

## 1. La structure : ce qu'on change

| Aujourd'hui | Demain |
|---|---|
| 15 galaxies × 15 planètes = 225 planètes générées au hasard, trop grandes, qui se ressemblent | **6 galaxies × 6 niveaux + finale = 37 niveaux**, chacun pensé avec un thème, un rythme et un gadget |
| Planètes rondes qu'on traverse en tous sens | **Niveaux-parcours de 3 à 5 minutes** : îles flottantes, de la Luciole au phare. Quelques **mini-planètes rondes** restent en bonus (façon Mario Galaxy) |
| Collecte surtout « utilitaire » (cristaux, ressources) | **Collection qui se voit** : chaque habitant sauvé vient vivre dans la Luciole |
| Tous les pouvoirs en même temps | **Un gadget par galaxie**, et ses niveaux sont construits autour de lui |
| Vaisseau = menu de voyage | **La Luciole = le hub**, un vrai lieu où l'on marche |

### Une galaxie = 6 niveaux

1. **Niveau 1, découverte** : on reçoit le gadget de la galaxie, on apprend à s'en servir.
2. **Niveaux 2 et 3, variations** : le gadget dans des situations nouvelles (vitesse, hauteur, ennemis).
3. **Niveau 4, mélange** : le gadget combiné aux pouvoirs déjà acquis.
4. **Niveau défi (caché)** : court et difficile, débloqué par un portail secret. Pour les joueurs qui visent le 100 %.
5. **Boss** : un lieutenant de Nocturna, en 3 phases, qui utilise le gadget contre toi.

Finale : **la station spatiale de Nocturna** (modules de station + phénix géant), un long niveau avec beaucoup de points de reprise.

---

## 2. Les 6 galaxies et leurs gadgets

| Galaxie | Ambiance | Gadget (1 seul bouton) | Ce qu'il permet dans les niveaux |
|---|---|---|---|
| 1. Prairie de Brumelune | herbe, fleurs, îles douces | (aucun) : saut, double saut, **planer**, coup de flamme | apprendre à jouer |
| 2. Forge de Cendrine | lave, volcans | **Braise-fusée** : un élan horizontal | traverser de grands trous, foncer sur les ennemis |
| 3. Givre | neige, glace | **Coup de marteau** : on frappe le sol en tombant | casser la glace, enfoncer des piliers, assommer en zone |
| 4. Abysses | océan, coraux | **Bulle** : on flotte et on nage dans une bulle | descendre sous l'eau, remonter par les courants |
| 5. Confiserie | bonbons, gâteaux | **Lasso-réglisse** : on s'accroche et on se balance | se balancer entre des îles, tirer des plateformes |
| 6. Orage | nuages, éclairs | **Décharge** : on active des circuits | allumer des ponts, des ascenseurs, des aimants |

Le tir de braise et l'éclair actuels deviennent les gadgets des galaxies 2 et 6.

---

## 3. Le niveau type (3 à 5 minutes)

```
Luciole ─► zone d'accueil ─► [section A] ─► relais ─► [section B] ─► relais ─► [section C] ─► relais ─► PHARE
              (tuto du gadget)   saut + pièces     ennemis + caisses    gadget + vide          final spectaculaire
                     └── chemin secret ──► habitant caché / fragment / portail défi
```

- **Une surprise toutes les 10 à 15 secondes** : un habitant à libérer, une caisse, un passage caché, un ennemi nouveau, une plateforme qui bouge.
- **Une lanterne-relais toutes les 20 secondes environ**, réapparition en moins d'une demi-seconde (✅ déjà fait).
- **Les pièces dessinent le chemin** : lignes et arcs qui montrent où sauter (✅ déjà fait).
- **À chaque niveau, on ramène :**
  - **6 à 10 habitants** à libérer (cachés, mais visibles avec un petit détour) ;
  - **1 fragment de mémoire** : il raconte l'histoire de Nocturna dans le journal (✅ existe déjà) ;
  - **les pièces ✨**, qui servent de monnaie.
- **Fin de niveau** : on rallume le phare, la planète se colore (✅ déjà fait), puis on voit le compteur « habitants sauvés ».

### Comment on fabrique les niveaux (technique)

On arrête le « tout au hasard ». Chaque niveau devient **une liste de modules**, choisis à la main dans un fichier :

```js
{ galaxie: 2, niveau: 1, theme: 'lave', gadget: 'fusee',
  modules: ['accueil', 'sauts-simples', 'relais', 'fusee-tuto', 'trou-fusee', 'relais',
            'arene-ombrelles', 'secret-habitant', 'plateformes-mobiles', 'relais', 'phare'] }
```

Chaque module est un petit morceau de parcours qu'on règle une fois et qu'on réutilise : îles, trous, ennemis, caisses, pièces, habitants. Le générateur actuel sert à **assembler** ces modules et à les **décorer** selon le thème. On garde ainsi la variété, tout en contrôlant le rythme et la difficulté.

---

## 4. Le hub : la Luciole

- Un **pont de vaisseau où l'on marche**, avec Mamie Mèche au poste radio.
- **Chaque habitant sauvé vient vivre à bord**, avec une petite animation à son peuple : il danse, jardine, pêche, joue de la musique. Plus on joue, plus la Luciole se remplit et s'agrandit (nouvelles salles à 50, 100 et 200 habitants).
- **La carte des galaxies** : on choisit son niveau en marchant jusqu'au hublot.
- **La machine à souvenirs** (gacha) : on dépense ses pièces ✨ pour gagner des **costumes pour Fanal**, des **peintures pour la Luciole** et des **décorations du hub**.
- **La vitrine** : les trophées des boss et les fragments de mémoire, exposés.

---

## 5. Zéro frustration (✅ en partie fait)

- Pas de vies limitées, pas de game over.
- Lanterne-relais toutes les 20 secondes environ, réapparition quasi instantanée.
- 3 flammes de vie, rechargées à chaque relais. La difficulté est surtout dans les **niveaux défi** optionnels.

## 6. La sensation de jeu (le « juice »)

- ✅ Déjà en place : tremblement de caméra, arrêt sur image aux coups, pièces aimantées, son qui monte en série.
- À faire :
  - Fanal qui **s'écrase et s'étire** au saut et à l'atterrissage, avec de la poussière.
  - **Un son par matière** : herbe, pierre, bois, verre, métal.
  - Une **musique qui change** selon le gadget et les moments de tension.
  - **Vibration du téléphone** dosée selon chaque action.

---

## 7. Modèle économique (free-to-play éthique)

- Le jeu complet est **gratuit**. On n'achète **que du cosmétique** : aucun avantage pour gagner.
- **Pass de saison** : une piste de costumes et de décorations, en version gratuite et premium.
- **Boutique** de skins pour Fanal et pour la Luciole. Les pièces ✨ gagnées en jouant alimentent la machine à souvenirs.
- **Multijoueur (plus tard)** : coopération à 2 dans les niveaux, et visite du hub des amis.

---

## 8. Feuille de route

| Étape | Contenu | Résultat jouable |
|---|---|---|
| **1. Fondations** | 6 galaxies × 6 niveaux, carte simplifiée, écran de fin de niveau, compteur d'habitants | on enchaîne de vrais niveaux courts |
| **2. Modules** | bibliothèque de modules + éditeur de niveau en liste ; galaxie 1 réglée à la main | la galaxie 1 est fun de bout en bout |
| **3. Hub Luciole** | pont jouable, habitants qui s'installent, vitrine | la collection prend vie |
| **4. Gadgets + boss** | gadgets et boss des galaxies 2 et 3 | la variété arrive |
| **5. Finition** | sons par matière, squash & stretch, musique dynamique, modèles Meshy (Fanal avec squelette, décors) | la qualité « console » |
| **6. Économie** | machine à souvenirs, costumes, pass | prêt pour le store |
| **7. Finale + multijoueur** | station spatiale, phénix, coopération | version complète |

## 9. Ce qu'il faut créer dans Meshy (par ordre d'importance)

1. **Fanal avec squelette et animations** (repos, marche, course, saut) : c'est ce qu'on voit tout le temps.
2. **Les décors de la galaxie 1** : arbre rond, rocher, île flottante, fleur, champignon (voir `liste-meshy.md`).
3. **Mamie Mèche** et **un habitant par peuple**, pour le hub.
4. **Les boss** des galaxies 1 à 3.
