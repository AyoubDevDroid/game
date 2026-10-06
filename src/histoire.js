// L'histoire d'Astres éteints : ce que disent Mamie Mèche et les habitants, les éclats de mémoire du journal,
// et les missions propres à chaque planète. (Histoire validée : voir UNIVERS.md.)

export const INTRO = [
  'Fanal ? Fanal, tu m\'entends ? C\'est Mamie Mèche, je te parle par la radio de la Luciole !',
  'Pendant que tu dormais au fond de la réserve, Nocturna a tissé sa grande toile d\'ombre sur les quinze galaxies.',
  'Les phares se sont éteints. La Grande Lumière s\'est brisée en cristaux, et les peuples sont prisonniers de bulles d\'ombre.',
  'Toi seul, l\'ombre t\'a oublié. Ramasse les cristaux de lumière et rallume le phare de Brumelune !',
  'Et libère les Mousserons enfermés dans les bulles. Saute sur les Ombrelles, ou donne-leur un coup de flamme 🔥 !',
];

// conseils de Mamie Mèche, une seule fois chacun
export const ASTUCES = {
  cristal: 'Un cristal de lumière ! Il en faut plusieurs pour rallumer le phare. Suis les colonnes de lumière, elles montrent où ils sont.',
  habitant: 'Tu l\'as libéré ! Il file rejoindre la Luciole. Il y en a d\'autres cachés partout : en hauteur, derrière les rochers, sur les îlots…',
  relais: 'Une lanterne-relais ! Si l\'ombre t\'éteint, tu repartiras d\'ici.',
  coffre: 'Un éclat de mémoire… C\'est un souvenir de ce qui s\'est passé. Ouvre le journal 📜 pour le lire.',
  phare: 'Tous les cristaux sont là ! Va vite au phare et rallume-le.',
  allume: 'Regarde ces couleurs ! La planète revit. Quand tu veux, remonte dans la Luciole pour la planète suivante.',
  touche: 'Aïe ! Fais attention, chaque coup d\'ombre éteint une de tes trois flammes. Les flammèches roses te soignent.',
  boss: 'Le Grand Phare… La Grande Ombrelle le garde. Saute-lui dessus quand elle fonce, et ne reste pas sous elle !',
  eau: 'Tu nages ! Appuie sur saut pour donner un coup de nage. L’eau te porte, alors n’aie pas peur d’aller voir au fond : il y a sûrement des trésors.',
  nuages: 'Ici, la gravité est toute légère ! Les nuages te font rebondir, et saute depuis un nuage pour aller encore plus haut. Les courants d’air te soulèvent, eux aussi.',
  galaxie: 'Une galaxie entière brille de nouveau ! La Luciole peut sauter vers la suivante. Je suis si fière de toi.',
};

// ce que disent les habitants une fois libérés (une phrase au hasard, parfois)
export const MERCIS = [
  'Merci, petite lanterne ! Je croyais qu\'on ne reverrait jamais la lumière.',
  'Les Ombrelles sont arrivées quand le phare s\'est éteint… Elles avaient l\'air si tristes, pas méchantes.',
  'Tu as vu ? Les couleurs reviennent déjà autour de moi !',
  'Nocturna… Ma grand-mère disait qu\'autrefois, elle gardait le plus vieux phare de l\'univers.',
  'Je file à la Luciole ! Il paraît que Mamie Mèche y fait des tartes aux étoiles.',
  'Il reste des amis enfermés plus loin, je les ai entendus appeler !',
];

// les éclats de mémoire, dans l'ordre où on les trouve : le journal raconte l'histoire peu à peu
export const MEMOIRES = [
  'Il y a très longtemps, une seule lumière éclairait l\'univers : la Grande Lumière. Elle passait de phare en phare, de planète en planète.',
  'Chaque phare avait son peuple pour le garder. Les gardiens se transmettaient la flamme comme on se transmet une chanson.',
  'Le tout premier phare se dressait au Cœur de l\'Ombre. Sa gardienne s\'appelait Nocturna. Elle aimait la nuit, parce que c\'est la nuit que les phares sont utiles.',
  'Les galaxies se sont allumées une à une. Plus personne n\'avait besoin du vieux phare du Cœur de l\'Ombre.',
  'Un jour, on décida de l\'éteindre. Nocturna resta seule, dans le noir, avec sa lanterne froide.',
  'Elle attendit qu\'on revienne la chercher. Des années. Des siècles. Personne ne revint.',
  'Alors elle se mit à tisser. Avec la nuit, avec son chagrin, elle tissa une toile immense.',
  'De chaque fil qui tombait de la toile naissait une petite Ombrelle. Elles n\'avaient qu\'une idée : rendre le monde aussi sombre que le cœur de Nocturna.',
  'La toile recouvrit les galaxies. Les phares s\'éteignirent. La Grande Lumière se brisa en mille cristaux.',
  'Les gardiens furent enfermés dans des bulles d\'ombre. Tous… sauf un tout petit apprenti, endormi au fond d\'une réserve.',
  'Mamie Mèche avait caché la Luciole dans une grotte. Elle savait qu\'un jour, une flamme se réveillerait.',
  'Les Ombrelles ne sont pas méchantes. Ce sont des morceaux de tristesse. Quand la lumière les touche, elles redeviennent poussière d\'étoile.',
  'Nocturna a des lieutenants : les Grandes Ombrelles. Chacune garde le Grand Phare d\'une galaxie.',
  'On raconte que Nocturna garde encore sa vieille lanterne cassée. Elle ne s\'en sépare jamais.',
  'Un vieux gardien a écrit : « Une lumière qu\'on oublie devient une ombre. Une ombre qu\'on rallume redevient une lumière. »',
  'Plus Fanal rallume de phares, plus la toile de Nocturna s\'effiloche. Elle le sent. Elle a peur… et elle espère, peut-être.',
  'Au Cœur de l\'Ombre, le premier phare attend toujours. Il n\'a jamais été détruit : seulement oublié.',
  'Pour vaincre l\'ombre, il ne faut pas la détruire. Il faut se souvenir d\'elle.',
  'Si quelqu\'un rallumait le phare de Nocturna, peut-être qu\'elle pourrait enfin dormir.',
  'Fanal, si tu lis ceci : tu es la petite flamme que tout le monde avait oubliée. Comme elle. C\'est pour ça que toi seul peux la sauver.',
];

// ---------- les missions : une par planète, en plus des cristaux ----------
// type : sauvetage (libérer tous les habitants), braseros (allumer les braseros avant la fin du chrono),
//        commande (rapporter des ressources à l'ancien du village)
export const MISSIONS = {
  sauvetage: { titre: 'Sauvetage', icone: '🙋', annonce: p => `Tous les ${p} sont prisonniers. Libère-les tous, jusqu\'au dernier !` },
  braseros: { titre: 'Braseros', icone: '🔥', annonce: () => 'Quatre braseros attendent la flamme. Allume le premier, et dépêche-toi d’allumer les autres avant qu’il ne s’éteigne !' },
  commande: { titre: 'Commande', icone: '📦', annonce: (p, r, n) => `L\'ancien du village a besoin de ${n} ${r}. Rapporte-les-lui, il te le rendra bien.` },
};
export function missionDe(L) {
  if (L.boss) return null;
  return ['sauvetage', 'braseros', 'commande'][(L.seed + L.i) % 3];
}
