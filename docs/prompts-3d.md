# Astres éteints : prompts pour créer les personnages et objets en 3D

Pour **Gemini** (image) puis **Meshy** (3D). Les prompts sont en anglais, car ces outils le comprennent mieux.

## Méthode

1. **Gemini** : colle le **STYLE COMMUN**, puis le prompt du personnage. Demande une planche **face / profil / dos** : la 3D sera bien plus propre.
2. **Meshy** : *Image to 3D* (multi-vues si tu as la planche), style **Stylized/Cartoon**, texture **PBR**, **10 000 à 20 000 polygones** (c'est pour un téléphone).
3. **Export** : **.glb**, personnage seul, centré, pieds au sol, regard vers l'avant.
   - Personnages à deux jambes (Fanal, Mamie Mèche, habitants) : **auto-rig** Meshy, avec les animations *idle, walk, run, jump* et, si possible, *wave / cheer / victory*.
   - Ennemis, animaux et objets : un modèle **non riggé** suffit, le code les anime (rebonds, écrasements, attaques).
4. Dépose les fichiers dans `public/modeles/` avec le **nom indiqué**, ou envoie-les : ils remplacent les formes dessinées par le code.

> Ne jamais citer un autre jeu (Astro Bot, Mario…) dans les prompts : on reste original.

---

## STYLE COMMUN (à coller avant chaque prompt)

```
Stylized 3D game character, soft vinyl toy / clay look, chunky rounded shapes, smooth glossy surfaces, saturated candy colors with a deep night-purple (#3b1f5c) accent, big expressive eyes, cute and full of personality, readable silhouette, family-friendly. Single character, full body, neutral pose, centered, plain light grey background, soft studio lighting. Character turnaround sheet: front view, side view, back view.
```

Pour les **objets** (phare, coffre…), remplace la première phrase par `Stylized 3D game prop`.

---

# 1. Héros et alliés

### Fanal, le héros → `fanal.glb`
Sa flamme est son visage : le code la dessine et l'anime, donc **le globe doit rester vide**.
```
A tiny living lantern hero, about the height of a child's toy. Raspberry-pink (#d8285f) metal frame with golden rivets, a golden carrying handle on top, a round EMPTY clear glass globe as the body (no flame inside, the globe must be empty and transparent), a turquoise knitted scarf (#2fd3c4) with two floating ends, short stubby arms with round golden mitten hands, short legs with rounded golden boots. Heroic, curious and brave attitude, slightly oversized boots, playful proportions.
```

### Mamie Mèche, la vieille lanterne qui guide Fanal → `mamie-meche.glb`
```
A kind old grandmother lantern character: an antique brass lantern with a warm amber glass globe glowing softly, a small knitted lilac shawl, round golden reading glasses perched on the lantern top, a wooden walking cane, a tiny pocket radio with an antenna clipped to her side, short stubby legs with cozy knitted slippers. Wise, warm and funny expression, slightly bent posture.
```

### Les petits gardiens prisonniers (cousins de Fanal) → `gardien.glb`
Un seul modèle : le code change ses couleurs selon la planète.
```
A smaller and rounder cousin of a living lantern hero: simple white-and-cream lantern frame, round EMPTY clear glass globe as the body, a short scarf, tiny legs with round boots, a little antenna-like handle on top. Shy and sweet attitude. Neutral light colors so it can be recolored.
```

### La Luciole, le vaisseau de Fanal → `vaisseau.glb`
Le nez doit pointer vers l'avant.
```
A cute little spaceship shaped like a firefly / capsule: raspberry-pink rounded hull with a cream belly, a big turquoise glass bubble cockpit on top with a warm glow inside, golden rivets around the cockpit, small golden tail fins, three short golden landing legs, a round golden engine nozzle at the back with a soft cyan glow, a tiny lantern hanging under the nose. Toy-like, friendly, side view and three-quarter view.
```

---

# 2. Ennemis

### Ombrelle marcheuse (ennemi de base) → `ombrelle.glb`
```
A small mischievous shadow creature wearing a big striped umbrella as a hat. Round dark purple fluffy body (#2a1846) with a wavy fringe at the bottom, tiny stubby feet, two big glowing pale-yellow eyes with black pupils and angry little eyebrows, small mouth with two tiny white fangs. The umbrella canopy has 8 panels alternating violet (#7a3fd6) and deep indigo, lilac rim with small pompoms on each tip, a curved hook handle sticking out on top.
```

### Ombrelle sauteuse → `ombrelle-sauteuse.glb`
```
Same family of shadow creature with an umbrella hat, but springy and energetic: compact round body in dark teal (#10303a), umbrella panels alternating bright teal (#1fb5a8) and dark petrol blue, cyan pompoms, a coiled spring-like tail under the body, crouched ready-to-jump pose, excited yellow eyes, grinning fangs.
```

### Crabe d'ombre (île pirate, lagon, dunes) : fonce de côté et pince → `crabe.glb`
```
A chunky shadow crab creature, dark plum shell (#3b1f5c) with glowing coral-pink cracks, one oversized claw and one small claw, eyes on short stalks with big angry pupils, tiny striped pirate-style bandana, short pointy legs, sideways aggressive stance.
```

### Feu-follet (planète hantée, marais) : traverse les murs → `follet.glb`
```
A floating ghost-lantern creature: a small cracked old lantern with a cold blue-green ghostly flame inside, wispy translucent ghost tail instead of legs, two hollow glowing eyes and a wobbly mischievous smile, tattered dark cloth hood. Spooky but cute.
```

### Gelée sucrée (planète gourmande, corail) : rebondit et se divise → `gelee.glb`
```
A wobbly jelly candy monster, translucent strawberry-pink gummy body (#ff6fae) with candy sprinkles inside, a whipped-cream swirl on top with a cherry, two big shiny eyes, wide toothy grin, squishy blob shape with a flat bottom.
```

### Hérisson-piquant (lave, volcan) : piquants qui sortent par cycles, roule → `herisson.glb`
```
A round hedgehog-like creature made of cooled lava rock, dark charcoal body with glowing orange magma cracks, a back covered with short crystal spikes glowing yellow-orange, small snout, tiny feet, grumpy half-closed eyes.
```

### Ombrelle tireuse (royaume, bourg) : lance des boules d'ombre → `tireuse.glb`
```
A shadow creature with an umbrella hat whose handle is a small cannon barrel, crimson and black striped canopy, chunky dark body, one squinting eye with a monocle-like lens, holding a stack of glowing dark-purple shadow balls, sly smile.
```

### Chauve-ombre (étoilée, hantée) : pique depuis le ciel → `chauve-ombre.glb`
```
A small round bat creature made of night sky, deep indigo fluffy body sprinkled with tiny glowing stars, wide umbrella-fabric wings with scalloped edges, big round glowing eyes, little fangs, playful wicked grin.
```

### Givron (givre, fêtes d'hiver) : roule en grossissant → `givron.glb`
```
A rolling snowball creature, round snow body with icy blue crystals stuck on it, carrot-shaped nose made of ice, two coal-black eyes with frosty eyebrows, tiny twig arms, a little dark purple scarf, cheeky expression.
```

### Électro-méduse (mondes d'eau et de nuages) : ondes électriques en anneau → `meduse.glb`
```
A floating jellyfish creature made of storm cloud and light, translucent violet dome with tiny lightning bolts inside, glowing electric-yellow tentacles ending in small spark balls, sleepy but dangerous eyes.
```

### Boss : la Grande Ombrelle → `boss-ombrelle.glb`
```
A giant boss version of the umbrella shadow creature: huge round dark body, crimson (#d8285f) and black striped umbrella canopy, golden rim with large pompoms, a crown of golden spikes on the canopy, golden hook handle, fierce glowing red eyes, big toothy grin, small arms crossed. Imposing but still cartoon and family-friendly.
```

### Boss finale : Nocturna → `nocturna.glb`
```
A tall elegant sorceress made of night and woven shadow fabric, an enormous dark umbrella-like cloak spread behind her like wings, a pale moonlight face with sad glowing eyes, an old broken lighthouse lantern hanging from her staff, silver and deep purple colors, mysterious and melancholic rather than evil.
```

---

# 3. Les habitants (un peuple par monde)

**Base commune** à coller après le STYLE COMMUN, puis ajouter la ligne du peuple :
```
A small friendly villager creature about half the height of a lantern hero: soft round egg-shaped body, short stubby arms and feet, big shiny eyes, rosy cheeks, small happy mouth, standing in a cheerful pose.
```

| Fichier | Peuple (monde) | Ligne à ajouter |
|---|---|---|
| `peuple-mousserons.glb` | Mousserons (menthe) | `Cream body, wearing a big pink mushroom cap with white spots as a hat, little leaf satchel.` |
| `peuple-braisillons.glb` | Braisillons (lave) | `Warm peach body, hair made of three small orange-red flame tufts, soot-smudged apron, tiny tongs.` |
| `peuple-astronomes.glb` | Astronomes (étoilée) | `Lavender body, two thin antennae ending in glowing yellow star balls, round little telescope in hand, starry cape.` |
| `peuple-givrins.glb` | Givrins (givre) | `Icy white body, blue knitted beanie with a big white pompom, frosty mittens, snowflake patterns.` |
| `peuple-jardiniers.glb` | Jardiniers (verdoyance) | `Pale yellow body, a green sprout with two leaves growing on the head, tiny watering can, overalls.` |
| `peuple-nomades.glb` | Nomades des sables (dunes) | `Sandy body, turquoise turban with a golden jewel, flowing scarf, tiny lantern on a stick.` |
| `peuple-corailleurs.glb` | Corailleurs (corail) | `Pink body, a coral-pink seashell worn as a helmet, little pearl necklace.` |
| `peuple-marais.glb` | Gens des marais (marais) | `Mint-green body, a wide lily pad hat with a pink flower, rubber boots, tiny fishing rod.` |
| `peuple-pecheurs.glb` | Pêcheurs du lagon (lagon) | `Cream body, sky-blue bandana, striped sailor shirt, small fishing net.` |
| `peuple-forgerons.glb` | Forgerons (volcan) | `Orange body, flame-shaped crest, leather apron, tiny hammer, goggles on the forehead.` |
| `peuple-veilleurs.glb` | Veilleurs de nuit (hantée) | `Pale lilac body, deep purple hood with glowing eyes inside, holds a small candle lantern.` |
| `peuple-corsaires.glb` | Corsaires de lumière (pirate) | `Cream body, red bandana with white dots, golden earring, tiny wooden sword, eye patch with a star.` |
| `peuple-royaume.glb` | Gens du royaume (royaume) | `Ivory body, small golden crown with five points, short royal cape, tiny banner flag.` |
| `peuple-mielins.glb` | Mielins (gourmande) | `Light pink body, long floppy candy-pink bunny-like ears, a lollipop in hand, frosting drips on the head.` |
| `peuple-lutins.glb` | Lutins des neiges (fêtes) | `Peach body, tall red pointy elf hat with a white pompom, green scarf, tiny wrapped present.` |
| `peuple-bourg.glb` | Bourgeois du bourg (bourg) | `Warm beige body, wide straw hat with a red ribbon, little basket of bread.` |

---

# 4. Les animaux (faune originale, un ou deux par monde)

Coller après le STYLE COMMUN. Ce sont des **créatures du jeu**, pas des animaux réels copiés.

| Fichier | Monde | Caractère | Prompt |
|---|---|---|---|
| `animal-lapimousse.glb` | menthe | craintif | `A small fluffy bunny-like creature with soft moss-green fur, long ears ending in tiny pink flowers, a dandelion-puff tail, shy curious eyes.` |
| `animal-salamandre.glb` | lave | paisible | `A chubby little salamander made of warm ember-orange clay with glowing yellow spots, a short curly tail with a tiny flame at the tip, sleepy happy smile.` |
| `animal-hibou-comete.glb` | étoilée | volant | `A round little owl with deep blue feathers sprinkled with tiny stars, a glowing comet-tail of feathers, big golden moon-shaped eyes.` |
| `animal-pingouin-flocon.glb` | givre | amical | `A chubby penguin chick with icy blue and white feathers, a little knitted red scarf, a snowflake-shaped tuft on the head, joyful wave.` |
| `animal-vache-trefle.glb` | verdoyance | paisible | `A round cartoon cow with cream fur and green four-leaf-clover spots, tiny flower crown, big gentle eyes, small golden bell.` |
| `animal-fennec-soleil.glb` | dunes | craintif | `A small fennec fox with sandy-gold fur, huge ears with sun-like orange tips, a fluffy tail, alert curious pose.` |
| `animal-crevette-ballon.glb` | corail | paisible | `A round balloon-like shrimp creature, coral pink and puffy, little antenna whiskers, walks on tiny legs, bubbly cheerful face.` |
| `animal-grenouille-lanterne.glb` | marais | amical | `A plump frog with mint-green skin, a small glowing paper lantern hanging from a lily stem on its head, wide happy grin.` |
| `animal-tortue-ilot.glb` | lagon | paisible | `A big gentle sea turtle whose shell is a tiny tropical island with a palm tree and sand, turquoise skin, slow kind eyes.` |
| `animal-belier-roc.glb` | volcan | paisible | `A sturdy little ram made of dark volcanic rock with curly glowing-orange horns, woolly ash-grey fleece, stubborn proud face.` |
| `animal-chat-chandelle.glb` | hantée | craintif | `A slim black-purple cat whose tail ends in a lit candle flame, glowing green eyes, mysterious but cute.` |
| `animal-perroquet-boussole.glb` | pirate | volant | `A colorful round parrot, red-yellow-blue feathers, a little compass medallion on the chest, tiny pirate hat, cheeky expression.` |
| `animal-poney-blason.glb` | royaume | amical | `A small round pony with a white coat, a colorful heraldic saddle blanket, braided pastel mane, proud happy face.` |
| `animal-ourson-guimauve.glb` | gourmande | amical | `A squishy little bear made of pink-and-white marshmallow, chocolate-chip eyes, sprinkles on the ears, sweet smile.` |
| `animal-renne-lutin.glb` | fêtes | craintif | `A tiny reindeer with a fluffy cream coat, small antlers decorated with colorful string lights and jingle bells, rosy nose.` |
| `animal-poule-lanterne.glb` | bourg | amical | `A plump hen with golden feathers, a tiny lantern hanging from her neck, little basket of eggs, cheerful busy look.` |
| `animal-abeille-luciole.glb` | partout | volant | `A round bumblebee-firefly creature, yellow and dark purple stripes, glowing soft-yellow belly light, translucent wings, happy face.` |

---

# 5. Objets importants (`Stylized 3D game prop`)

| Fichier | Objet | Prompt |
|---|---|---|
| `phare.glb` | le phare | `A charming small lighthouse, white tower with soft pink stripes, lilac balcony with railings, a big glass lamp room on top with a golden lamp, a little purple dome roof with a golden tip, a tiny wooden door, stones at the base.` |
| `cristal.glb` | cristal de lumière | `A glowing magic crystal of light, elongated faceted double-pointed gem, warm orange-gold inner light, a thin golden ring orbiting around it.` |
| `coffre.glb` | coffre au trésor | `A cute chunky treasure chest, rounded wooden lid, three golden metal bands, a glowing golden keyhole, slightly open with light escaping.` |
| `relais.glb` | lanterne-relais | `A small checkpoint lamp post: dark wooden pole with a curved arm holding a hexagonal lantern, purple metal base, cozy and inviting.` |
| `cage-ombre.glb` | cage d'ombre | `A magical prison cage made of twisted dark purple shadow bars, a round dome top with a wispy shadow swirl, faint violet glow, spooky but cartoon.` |
| `relais-brasero.glb` | brasero (missions) | `A small round stone brazier on three legs, empty bowl ready to be lit, carved star patterns.` |
