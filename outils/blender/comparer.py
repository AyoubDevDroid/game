# Montage de comparaison : la planche Gemini en haut, les 3 rendus Blender en dessous.
#   blender --background --python outils/blender/comparer.py -- <nom> <planche.jpg>
# Écrit docs/rendus/<nom>-comparaison.png
import bpy, sys, os
import numpy as np

nom, planche = sys.argv[sys.argv.index('--') + 1:][:2]
racine = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
def charger(p):
    im = bpy.data.images.load(p); w, h = im.size
    return np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)
def redim(a, w, h):
    ys = (np.arange(h) * a.shape[0] / h).astype(int); xs = (np.arange(w) * a.shape[1] / w).astype(int)
    return a[ys][:, xs]
L = 1500
haut = charger(os.path.abspath(planche)); haut = redim(haut, L, int(haut.shape[0] * L / haut.shape[1]))
rendus = [redim(charger(os.path.join(racine, 'docs', 'rendus', f'{nom}-{v}.png')), L // 3, L // 3) for v in ('face', 'profil', 'dos')]
bas = np.concatenate(rendus, 1)
bas = np.pad(bas, ((0, 0), (0, L - bas.shape[1]), (0, 0)), constant_values=1)
img = np.concatenate([bas, haut], 0)          # Blender range les lignes de bas en haut : la planche finit en haut
out = bpy.data.images.new('cmp', img.shape[1], img.shape[0])
out.pixels = img.ravel()
out.filepath_raw = os.path.join(racine, 'docs', 'rendus', f'{nom}-comparaison.png'); out.file_format = 'PNG'; out.save()
print('COMPARAISON', out.filepath_raw)
