# L'Ombrelle marcheuse, d'après docs/concepts/ennemis/ombrelle.jpg
#   blender --background --python outils/blender/modeles/ombrelle.py -- [--variante sauteuse|tireuse|boss]
# Corps d'ombre violet nuit tout rond, frange ondulée en bas, petits pieds et bras, gros yeux jaune pâle
# lumineux aux sourcils froncés, deux crocs ; ombrelle à 8 pans rayés, bord lilas à pompons, crochet au sommet.
# L'avant regarde vers -Y (devient +Z dans le glTF, l'avant du jeu).
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from atelier import *

a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
variante = a[a.index('--variante') + 1] if '--variante' in a else 'marcheuse'
STYLES = {
    'marcheuse': dict(corps=0x2a1650, pan1=0x8a4fe0, pan2=0x2e1a6b, bord=0xb48cff, yeux=0xf4f7c0),
    'sauteuse':  dict(corps=0x0e3540, pan1=0x22c4b6, pan2=0x0f4552, bord=0x5fe0d6, yeux=0xf4f7c0),
    'tireuse':   dict(corps=0x2a1650, pan1=0xc0244f, pan2=0x1a0a14, bord=0x9a8070, yeux=0xffffff),
    'boss':      dict(corps=0x24081e, pan1=0xd8285f, pan2=0x1a0510, bord=0xffc23d, yeux=0xff5f5f),
}
S = STYLES[variante]
NOMS = {'marcheuse': 'ombrelle', 'sauteuse': 'ombrelle-sauteuse', 'tireuse': 'tireuse', 'boss': 'boss-ombrelle'}

nouvelle_scene()
corps = matiere('corps', S['corps'], rugosite=0.42)
pan1, pan2 = matiere('pan1', S['pan1'], 0.38), matiere('pan2', S['pan2'], 0.38)
bord = matiere('bord', S['bord'], 0.35, metal=0.4 if variante == 'boss' else 0)
oeil = matiere('oeil', S['yeux'], 0.2, emission=S['yeux'], force=1.6)
noir = matiere('pupille', 0x0b0612, 0.15)
dent = matiere('dent', 0xffffff, 0.25)

parts = []
# ---- le corps : un œuf plus haut que large, qui s'évase en jupe ondulée en bas ----
profil = [(0.0, 1.2), (0.17, 1.18), (0.3, 1.12), (0.4, 1.02), (0.46, 0.9), (0.49, 0.77), (0.5, 0.64), (0.5, 0.52),
          (0.51, 0.44), (0.53, 0.38), (0.55, 0.33), (0.42, 0.31), (0.0, 0.32)]
parts.append(tour('ventre', corps, profil, seg=72, ondes_bas=9, amplitude=0.07))
for x in (-0.15, 0.15):                                            # deux petites jambes sous la jupe
    parts.append(sphere('jambe', corps, centre=(x, 0, 0.2), echelle=(0.1, 0.1, 0.17), rayon=1, seg=16, anneaux=10))
    parts.append(sphere('pied', corps, centre=(x, -0.03, 0.05), echelle=(0.11, 0.13, 0.06), rayon=1, seg=16, anneaux=10))
for s in (-1, 1):                                                   # petits bras qui pendent le long du corps
    parts.append(sphere('bras', corps, centre=(s * 0.53, -0.02, 0.5), echelle=(0.075, 0.085, 0.16), rayon=1, seg=16, anneaux=10, rot=(0, s * 0.3, 0)))
    for z in (0.85, 0.7):                                           # petites pointes sur les flancs
        parts.append(cone('pointe', corps, centre=(s * 0.47, 0.08, z), r1=0.03, h=0.09, rot=(0, s * math.radians(75), 0)))
parts.append(cone('queue', corps, centre=(0, 0.5, 0.5), r1=0.04, h=0.08, rot=(math.radians(-90), 0, 0)))
# ---- le visage : gros yeux jaune pâle qui brillent, sourcils froncés, deux crocs ----
for s in (-1, 1):
    parts.append(sphere('oeil', oeil, centre=(s * 0.19, -0.42, 0.76), echelle=(0.155, 0.06, 0.165), rayon=1, seg=24, anneaux=16))
    parts.append(sphere('pupille', noir, centre=(s * 0.165, -0.478, 0.74), echelle=(0.065, 0.02, 0.075), rayon=1, seg=16, anneaux=10))
    parts.append(sphere('reflet', dent, centre=(s * 0.14, -0.495, 0.78), echelle=(0.018, 0.01, 0.018), rayon=1, seg=8, anneaux=6))
    parts.append(sphere('sourcil', corps, centre=(s * 0.2, -0.43, 0.93), echelle=(0.16, 0.06, 0.05), rayon=1, seg=16, anneaux=8, rot=(0, s * math.radians(-24), 0)))
for x in (-0.06, 0.06):
    parts.append(cone('croc', dent, centre=(x, -0.475, 0.53), r1=0.028, h=0.075, rot=(math.pi, 0, 0)))
parts.append(sphere('bouche', noir, centre=(0, -0.48, 0.565), echelle=(0.09, 0.01, 0.012), rayon=1, seg=16, anneaux=8))
# ---- l'ombrelle : toile rayée, bord et pompons, collerette et crochet ----
toile = dome_raye('toile', (pan1, pan2), rayon=0.75, ouverture=math.pi / 2.05, festons=0.09)
Z0 = 1.0                                                          # la toile est posée sur la tête
toile.location = (0, 0, Z0); toile.scale = (1, 1, 0.92)
parts.append(toile)
r_bord = 0.75 * math.sin(math.pi / 2.05)
z_bord = Z0 + 0.75 * math.cos(math.pi / 2.05) * 0.92
for i in range(8):                                                  # pompons au bout des baleines
    ang = i / 8 * math.tau
    parts.append(sphere('pompon', bord, centre=(math.cos(ang) * r_bord, math.sin(ang) * r_bord, z_bord - 0.03), echelle=(0.055, 0.055, 0.055), rayon=1, seg=16, anneaux=10))
# liseré qui suit les arches du bord (pas un anneau plat)
lis = [(math.cos(t) * r_bord * 1.01, math.sin(t) * r_bord * 1.01, z_bord + 0.09 * (0.5 - 0.5 * math.cos(t * 8)) * 0.92) for t in [i / 160 * math.tau for i in range(161)]]
parts.append(tube('liseré', bord, lis, rayon=0.024))
haut = Z0 + 0.75 * 0.92
parts.append(cone('collerette', bord, centre=(0, 0, haut + 0.02), r1=0.07, r2=0.045, h=0.06, seg=20))
if variante == 'tireuse':                                           # un petit canon à la place du crochet
    metal = matiere('canon', 0x8a8a90, 0.3, metal=0.8)
    parts.append(cone('canon', metal, centre=(0, -0.06, haut + 0.16), r1=0.07, r2=0.085, h=0.26, seg=20, rot=(math.radians(-25), 0, 0)))
    ombre = matiere('boule', 0x3b1f5c, 0.3, emission=0x8a4fff, force=2.2)
    for k in range(3):
        parts.append(sphere('boule', ombre, centre=((k - 1) * 0.11, -0.47, 0.36 + (0.08 if k == 1 else 0)), echelle=(0.09, 0.09, 0.09), rayon=1, seg=16, anneaux=10))
else:
    pts = [(0, 0, haut)] + [(0.11 - 0.11 * math.cos(t), 0, haut + 0.2 + 0.11 * math.sin(t)) for t in [i / 10 * math.pi for i in range(11)]]
    pts.insert(1, (0, 0, haut + 0.2))
    parts.append(tube('crochet', bord, pts, rayon=0.03))
if variante == 'boss':                                              # couronne de piquants dorés sur la toile
    for i in range(8):
        ang = i / 8 * math.tau + math.pi / 8
        rr, zz = 0.42, Z0 + 0.62 * 0.92
        parts.append(cone('piquant', bord, centre=(math.cos(ang) * rr, math.sin(ang) * rr, zz), r1=0.05, h=0.2, rot=(math.sin(ang) * -0.6, math.cos(ang) * 0.6, 0)))

modele = joindre(NOMS[variante], parts)
rendus = rendu(NOMS[variante], taille=1.75)
glb = exporter(NOMS[variante])
rapport(modele=NOMS[variante], triangles=sum(len(p.vertices) - 2 for p in modele.data.polygons), glb=glb, rendus=rendus)
