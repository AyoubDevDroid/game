# Colore un modèle 3D gris (sortie Meshy sans texture) à partir de sa planche Gemini
# (3 vues côte à côte : face, profil, dos, sur fond uni).
# Chaque face du modèle reçoit les couleurs de la vue qui la regarde : l'avant prend la vue de face,
# les côtés la vue de profil, l'arrière la vue de dos. Le résultat est un .glb texturé, prêt pour le jeu.
#
# Utilisation (Blender sans interface) :
#   blender --background --python outils/blender/colorer_depuis_planche.py -- \
#       --modele brut/crabe.glb --planche docs/concepts/ennemis/crabe.jpg --sortie public/modeles/crabe.glb
# Options : --ordre face,profil,dos (ordre des vues sur la planche), --tourner 0|90|180|270 (si le modèle
#           ne regarde pas vers l'avant), --apercu chemin.png (image de contrôle)
import bpy, sys, os, json, math
import numpy as np
from mathutils import Vector, Matrix

def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = {'ordre': 'face,profil,dos', 'tourner': '0', 'apercu': ''}
    for i in range(0, len(a) - 1, 2):
        out[a[i].lstrip('-')] = a[i + 1]
    return out

A = args()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(A['modele']))
objets = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not objets:
    raise SystemExit('aucun maillage dans ' + A['modele'])

# ---- tout le modèle en coordonnées du monde, tourné si besoin (le glTF regarde vers -Y dans Blender) ----
rot = Matrix.Rotation(math.radians(float(A['tourner'])), 4, 'Z')
for o in objets:
    o.data.transform(rot @ o.matrix_world)
    o.parent = None
    o.matrix_world = Matrix.Identity(4)
pts = np.array([v.co[:] for o in objets for v in o.data.vertices])
mn, mx = pts.min(0), pts.max(0)
taille = np.maximum(mx - mn, 1e-6)

# ---- la planche : fond détecté sur les coins, puis boîte englobante du personnage dans chaque tiers ----
img = bpy.data.images.load(os.path.abspath(A['planche']))
W, H = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)          # origine en bas à gauche
coins = np.concatenate([px[:8, :8, :3].reshape(-1, 3), px[:8, -8:, :3].reshape(-1, 3), px[-8:, :8, :3].reshape(-1, 3), px[-8:, -8:, :3].reshape(-1, 3)])
fond = np.median(coins, 0)
masque = np.linalg.norm(px[:, :, :3] - fond, axis=2) > 0.09
vues = {}
for k, nom in enumerate(A['ordre'].split(',')):
    x0, x1 = k * W // 3, (k + 1) * W // 3
    m = masque[:, x0:x1]
    cols, rows = np.where(m.any(0))[0], np.where(m.any(1))[0]
    if len(cols) == 0:
        raise SystemExit('vue vide : ' + nom)
    # on rogne un peu le bas : l'ombre portée au sol n'est pas le personnage
    vues[nom] = (x0 + cols.min(), x0 + cols.max(), rows.min(), rows.max())

# ---- le fond autour du personnage est remplacé par la couleur du bord le plus proche (pas de liseré gris) ----
rgb = px[:, :, :3].copy()
plein = masque.copy()
for _ in range(24):
    voisins = np.zeros_like(rgb); n = np.zeros(plein.shape, np.float32)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        dec = np.roll(plein, (dy, dx), (0, 1)); c = np.roll(rgb, (dy, dx), (0, 1))
        voisins += c * dec[:, :, None]; n += dec
    nouveaux = (~plein) & (n > 0)
    rgb[nouveaux] = voisins[nouveaux] / n[nouveaux][:, None]
    plein |= nouveaux
tex = bpy.data.images.new('planche_' + os.path.basename(A['planche']), W, H, alpha=False)
tex.pixels = np.concatenate([rgb, np.ones((H, W, 1), np.float32)], 2).ravel()
tex.pack()

# ---- UV : chaque face est projetée depuis la vue qui lui fait face ----
def uv(p, vue):
    x0, x1, y0, y1 = vues[vue]
    t = (np.array(p) - mn) / taille
    if vue == 'face':   a, b = t[0], t[2]            # on regarde depuis -Y : X vers la droite
    elif vue == 'dos':  a, b = 1 - t[0], t[2]        # depuis +Y : X vers la gauche
    else:               a, b = t[1], t[2]            # profil : l'avant (-Y) à gauche de l'image
    a = 0.5 + (a - 0.5) * 0.97; b = 0.5 + (b - 0.5) * 0.97     # léger resserrement vers l'intérieur
    return ((x0 + a * (x1 - x0)) / W, (y0 + b * (y1 - y0)) / H)

mat = bpy.data.materials.new('peau')
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes.get('Principled BSDF')
it = nt.nodes.new('ShaderNodeTexImage'); it.image = tex
nt.links.new(it.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.45
compte = {'face': 0, 'profil': 0, 'dos': 0}
for o in objets:
    me = o.data
    me.materials.clear(); me.materials.append(mat)
    for p in me.polygons: p.material_index = 0
    couche = me.uv_layers.new(name='planche')
    me.uv_layers.active = couche
    for p in me.polygons:
        n = p.normal
        vue = 'profil' if abs(n.x) > max(abs(n.y), abs(n.z)) * 0.9 else ('dos' if n.y > 0 else 'face')
        if abs(n.z) > max(abs(n.x), abs(n.y)):                  # dessus / dessous : la vue la plus proche
            vue = 'profil' if abs(n.x) > abs(n.y) else ('dos' if n.y > 0 else 'face')
        compte[vue] += 1
        for li in p.loop_indices:
            couche.data[li].uv = uv(me.vertices[me.loops[li].vertex_index].co, vue)
    # on ne garde que la nouvelle couche d'UV (l'export prend la première)
    for c in [c for c in me.uv_layers if c.name != 'planche']:
        me.uv_layers.remove(c)

# ---- export ----
sortie = os.path.abspath(A['sortie'])
os.makedirs(os.path.dirname(sortie), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=sortie, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88, use_selection=False)

# ---- image de contrôle (optionnelle) ----
if A['apercu']:
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = 900, 600
    monde = bpy.data.worlds.new('m'); sc.world = monde; monde.use_nodes = True
    monde.node_tree.nodes['Background'].inputs[0].default_value = (0.8, 0.8, 0.85, 1); monde.node_tree.nodes['Background'].inputs[1].default_value = 1.2
    centre = Vector(((mn + mx) / 2).tolist()); d = float(taille.max()) * 2.2
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = centre + Vector((d * 0.55, -d, d * 0.35))
    cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()
    soleil = bpy.data.objects.new('soleil', bpy.data.lights.new('soleil', 'SUN')); sc.collection.objects.link(soleil)
    soleil.rotation_euler = (math.radians(50), 0, math.radians(30)); soleil.data.energy = 3
    sc.render.filepath = os.path.abspath(A['apercu'])
    bpy.ops.render.render(write_still=True)

print(json.dumps({'ok': True, 'sortie': sortie, 'faces_par_vue': compte, 'vues': {k: [int(x) for x in v] for k, v in vues.items()}}))
