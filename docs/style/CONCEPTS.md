# Concepts validés

Images de référence générées par IA (octobre 2026). Elles fixent le look du jeu.

| Image | Ce qu'on garde |
|---|---|
| `concepts/fanal-vues.jpg` | **Fanal officiel** : globe de verre, cadre framboise, rivets et anse dorés, écharpe turquoise, petits pieds dorés |
| `concepts/fanal-expressions.jpg` | La flamme-visage : content (orange), peur/froid (bleu), super-lumière (rose) |
| `concepts/brumelune-rallumee.jpg` | Brumelune : collines menthe « pâte à modeler », champignons lumineux rose et jaune, maisonnettes au toit de tuiles |
| `concepts/cendrine-rallumee.jpg` | Cendrine : sol mandarine aux fissures de lave, cristaux framboise et jaunes, volcan sous le phare |
| `concepts/cendrine-eteinte.jpg` | Planète éteinte : gris-bleu, brume, fissures et cristaux sans lumière |

Points communs à respecter : matière douce « pâte à modeler », formes arrondies, phare blanc à rayures roses, ciel violet → rose avec étoiles et galaxie.

## Adaptations pour le jeu

1. **Planètes rondes** : les concepts sont des îles posées sur un socle. Dans le jeu, on court **tout autour** de la planète : le sol (herbe, lave…) recouvre donc toute la sphère, on garde le même style de matière.
2. **La flamme est faite dans le code**, pas dans le modèle 3D : ça permet de changer d'expression en direct, de la faire grandir avec les braises et de l'animer.
3. **Décors en pièces séparées** : phare, champignon, maisonnette, cristal, volcan, rocher sont générés un par un, puis placés par le jeu sur la planète.

## Générer les modèles 3D (Meshy ou Tripo)

Toujours en **image vers 3D**, une image par objet, fond uni, objet entier et centré.

**Fanal** : partir de la vue de face (image du milieu de `fanal-vues.jpg`), mais **sans flamme**. Prompt image à générer d'abord :

```
Front view of a cute lantern mascot with an EMPTY clear glass globe (no flame inside), raspberry pink metal frame with curved side bars, golden rivets, golden handle on top, turquoise scarf, short golden feet, stylized 3D cartoon, clay-like soft shapes, plain purple background, centered, full body
```

Réglages Meshy : *Low poly / mobile*, environ **10 000 à 20 000 triangles**, textures **1024 px**, export **.glb**. Pas besoin d'animation : je l'anime dans le code (dandinement, saut, écharpe qui flotte).

**Décors** (un fichier par objet, même style) :

```
[OBJET], stylized 3D cartoon game asset, clay-like soft rounded shapes, vibrant saturated colors, plain background, centered, single object
```

Objets à faire : `pink striped white lighthouse with domed top` · `glowing pink mushroom` · `glowing yellow mushroom cluster` · `small round cottage with brown tiled roof and round door` · `raspberry pink crystal cluster` · `glowing yellow crystal cluster` · `small volcano with lava cracks` · `round grey rock`.

## Où mettre les fichiers

Mets les `.glb` dans `public/modeles/` (exemple : `public/modeles/fanal.glb`, `public/modeles/phare.glb`) puis pousse sur GitHub : je les intègre dans le jeu.
