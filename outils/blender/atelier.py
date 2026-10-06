# L'atelier : outils communs pour modéliser l'univers d'Astres éteints dans Blender (sans interface).
# Style « jouet en vinyle » : formes rondes, surfaces lisses et brillantes, couleurs vives.
# Chaque modèle (outils/blender/modeles/*.py) importe ces outils, construit sa scène,
# fait un rendu de contrôle (docs/rendus/<nom>.png) et exporte public/modeles/<nom>.glb.
import bpy, bmesh, math, os, sys, json
from mathutils import Vector, Matrix

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def nouvelle_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene

# ---------- matières ----------
_mats = {}
def matiere(nom, couleur, rugosite=0.35, metal=0.0, emission=None, force=0.0, alpha=1.0):
    """Matière Principled (exportée telle quelle en glTF). couleur : 0xRRGGBB."""
    if nom in _mats: return _mats[nom]
    m = bpy.data.materials.new(nom)
    if m.node_tree is None: m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    c = hex_vers_lin(couleur)
    b.inputs['Base Color'].default_value = (*c, 1)
    b.inputs['Roughness'].default_value = rugosite
    b.inputs['Metallic'].default_value = metal
    if emission is not None:
        b.inputs['Emission Color'].default_value = (*hex_vers_lin(emission), 1)
        b.inputs['Emission Strength'].default_value = force
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        m.surface_render_method = 'BLENDED'
    _mats[nom] = m
    return m

def hex_vers_lin(h):
    def s(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (s((h >> 16) & 255), s((h >> 8) & 255), s(h & 255))

# ---------- formes ----------
def _objet(nom, me, mat, lisse=True, subdiv=0):
    o = bpy.data.objects.new(nom, me)
    bpy.context.scene.collection.objects.link(o)
    if mat is not None:
        if isinstance(mat, (list, tuple)):
            for m in mat: me.materials.append(m)
        else: me.materials.append(mat)
    for p in me.polygons: p.use_smooth = lisse
    if subdiv:
        mod = o.modifiers.new('lisse', 'SUBSURF'); mod.levels = subdiv; mod.render_levels = subdiv
    return o

def sphere(nom, mat, centre=(0, 0, 0), echelle=(1, 1, 1), rayon=0.5, seg=32, anneaux=16, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=anneaux, radius=rayon)
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = _objet(nom, me, mat)
    o.location = centre; o.scale = echelle; o.rotation_euler = rot
    return o

def cone(nom, mat, centre=(0, 0, 0), r1=0.1, r2=0.0, h=0.3, seg=16, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = _objet(nom, me, mat)
    o.location = centre; o.rotation_euler = rot
    return o

def tore(nom, mat, centre=(0, 0, 0), R=0.5, r=0.05, seg=48, segr=12, rot=(0, 0, 0)):
    bm = bmesh.new()
    for i in range(seg):
        a = i / seg * math.tau
        for j in range(segr):
            b = j / segr * math.tau
            bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
    bm.verts.ensure_lookup_table()
    for i in range(seg):
        for j in range(segr):
            a, b = i * segr + j, i * segr + (j + 1) % segr
            c, d = ((i + 1) % seg) * segr + (j + 1) % segr, ((i + 1) % seg) * segr + j
            bm.faces.new((bm.verts[a], bm.verts[b], bm.verts[c], bm.verts[d]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = _objet(nom, me, mat)
    o.location = centre; o.rotation_euler = rot
    return o

def tube(nom, mat, points, rayon=0.03, seg=10):
    """Tube lisse le long d'une liste de points (anses, crochets, tentacules)."""
    cu = bpy.data.curves.new(nom, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); sp.points.add(len(points) - 1)
    for p, c in zip(sp.points, points): p.co = (*c, 1)
    cu.bevel_depth = rayon; cu.bevel_resolution = seg // 2; cu.use_fill_caps = True
    tmp = bpy.data.objects.new(nom + '_c', cu); bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp); bpy.data.curves.remove(cu)
    return _objet(nom, me, mat)

def dome_raye(nom, mats, rayon=0.62, ouverture=math.pi / 2.2, pans=8, seg=64, anneaux=14, festons=0.05):
    """Toile d'ombrelle : calotte en pans de deux couleurs, bord légèrement festonné entre les baleines."""
    bm = bmesh.new()
    rangs = []
    for j in range(anneaux + 1):
        t = j / anneaux * ouverture
        rang = []
        for i in range(seg):
            a = i / seg * math.tau
            r = rayon * math.sin(t)
            z = rayon * math.cos(t)
            if j == anneaux:                                     # le bord ondule : bosses entre les baleines
                z += festons * (0.5 - 0.5 * math.cos(a * pans))
            rang.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rangs.append(rang)
    sommet = bm.verts.new((0, 0, rayon + 0.01))
    for i in range(seg):
        f = bm.faces.new((sommet, rangs[0][(i + 1) % seg], rangs[0][i]))
    for j in range(anneaux):
        for i in range(seg):
            bm.faces.new((rangs[j][i], rangs[j][(i + 1) % seg], rangs[j + 1][(i + 1) % seg], rangs[j + 1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    for f in bm.faces:                                           # couleur du pan selon l'angle
        c = f.calc_center_median(); a = (math.atan2(c.y, c.x) + math.tau) % math.tau
        f.material_index = int(a / (math.tau / pans)) % 2
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = _objet(nom, me, list(mats))
    sol = o.modifiers.new('epaisseur', 'SOLIDIFY'); sol.thickness = 0.03; sol.offset = -1
    return o

def tour(nom, mat, profil, seg=64, onde=None, ondes_bas=0, amplitude=0.0):
    """Forme de révolution (comme au tour de potier) : profil = [(rayon, z), …] du haut vers le bas.
    ondes_bas / amplitude : l'ourlet du bas ondule (jupe festonnée des Ombrelles, bas des fantômes…)."""
    bm = bmesh.new(); rangs = []
    n = len(profil)
    haut = bm.verts.new((0, 0, profil[0][1])) if profil[0][0] == 0 else None       # pointes : un seul sommet
    bas = bm.verts.new((0, 0, profil[-1][1])) if profil[-1][0] == 0 else None
    corps = profil[1 if haut else 0: n - 1 if bas else n]
    m = len(corps)
    for k, (r, z) in enumerate(corps):
        poids = max(0.0, (k - (m - 4)) / 3) if ondes_bas else 0      # l'ondulation n'agit que sur le bas
        rang = []
        for i in range(seg):
            a = i / seg * math.tau
            dz = amplitude * poids * (0.5 + 0.5 * math.cos(a * ondes_bas)) if ondes_bas else 0
            rr = r * (1 + 0.06 * poids * math.cos(a * ondes_bas)) if ondes_bas else r
            rang.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z - dz)))
        rangs.append(rang)
    for k in range(m - 1):
        for i in range(seg):
            bm.faces.new((rangs[k][i], rangs[k + 1][i], rangs[k + 1][(i + 1) % seg], rangs[k][(i + 1) % seg]))
    for i in range(seg):
        if haut: bm.faces.new((haut, rangs[0][i], rangs[0][(i + 1) % seg]))
        if bas: bm.faces.new((bas, rangs[-1][(i + 1) % seg], rangs[-1][i]))
    if not haut: bm.faces.new(rangs[0])
    if not bas: bm.faces.new(rangs[-1])
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    return _objet(nom, me, mat)

def joindre(nom, objets):
    """Fusionne des objets (modificateurs appliqués) en un seul maillage multi-matières."""
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new(); mats = []
    for o in objets:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(o.matrix_world)
        remap = []
        for m in me.materials:
            if m not in mats: mats.append(m)
            remap.append(mats.index(m))
        for p in me.polygons:
            if remap: p.material_index = remap[p.material_index]
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    for o in objets: bpy.data.objects.remove(o)
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = _objet(nom, me, mats)
    return o

# ---------- rendu de contrôle et export ----------
def rendu(nom, vues=((0.0, 'face'), (90.0, 'profil'), (200.0, 'dos')), taille=1.4, centre_z=None):
    """Rendu EEVEE de contrôle : 3 vues côte à côte (comme une planche), dans docs/rendus/<nom>-<vue>.png."""
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = 640, 640
    sc.view_settings.view_transform = 'AgX'
    try: sc.view_settings.look = 'AgX - Punchy'
    except Exception: pass
    monde = bpy.data.worlds.new('fond'); sc.world = monde
    if monde.node_tree is None: monde.use_nodes = True
    bg = monde.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.78, 0.78, 0.82, 1); bg.inputs[1].default_value = 0.9
    for nomL, rot, e in (('cle', (math.radians(55), 0, math.radians(-35)), 3.2), ('contre', (math.radians(60), 0, math.radians(150)), 1.2)):
        l = bpy.data.objects.new(nomL, bpy.data.lights.new(nomL, 'SUN')); sc.collection.objects.link(l)
        l.rotation_euler = rot; l.data.energy = e; l.data.angle = 0.2
    cz = taille / 2 if centre_z is None else centre_z
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = 50
    dossier = os.path.join(RACINE, 'docs', 'rendus'); os.makedirs(dossier, exist_ok=True)
    sorties = []
    for ang, nv in vues:
        a = math.radians(ang); d = taille * 2.3
        cam.location = (math.sin(a) * d, -math.cos(a) * d, cz + taille * 0.35)
        cam.rotation_euler = (Vector((0, 0, cz)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(dossier, f'{nom}-{nv}.png')
        bpy.ops.render.render(write_still=True)
        sorties.append(sc.render.filepath)
    for o in [o for o in sc.objects if o.type in ('LIGHT', 'CAMERA')]: bpy.data.objects.remove(o)
    return sorties

def exporter(nom):
    sortie = os.path.join(RACINE, 'public', 'modeles', nom + '.glb')
    os.makedirs(os.path.dirname(sortie), exist_ok=True)
    for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
    bpy.ops.export_scene.gltf(filepath=sortie, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    return sortie

def rapport(**k):
    print('RAPPORT ' + json.dumps(k, ensure_ascii=False))
