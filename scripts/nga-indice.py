# Monta api/_dados/nga.tsv.gz a partir dos dados abertos (CC0) da National Gallery of Art (Washington).
# Baixe objects.csv e published_images.csv de github.com/NationalGalleryOfArt/opendata (pasta data) numa pasta e rode:
#   python3 scripts/nga-indice.py <pasta-dos-csv> api/_dados/nga.tsv.gz
# Só entram obras com imagem primária em acesso aberto. Colunas: id, uuid IIIF, tipo, título, autoria, data, ano, técnica.
import csv,sys,gzip,re,json
csv.field_size_limit(10**9)
src,out=sys.argv[1],sys.argv[2]
img={}
for r in csv.DictReader(open(src+'/published_images.csv',encoding='utf-8')):
    if r['viewtype']=='primary' and r['openaccess']=='1' and r['depictstmsobjectid']:
        img[r['depictstmsobjectid']]=r['uuid']
CLS={'Print':'p','Index of American Design':'i','Drawing':'d','Sculpture':'s','Painting':'t','Photograph':'f','Decorative Art':'a'}
lim=lambda s,n: re.sub(r'\s+',' ',s or '').strip().replace('\t',' ')[:n]
rows=[]
for r in csv.DictReader(open(src+'/objects.csv',encoding='utf-8')):
    u=img.get(r['objectid']); c=CLS.get(r['classification'])
    if not u or not c: continue
    rows.append('\t'.join([r['objectid'],u,c,lim(r['title'],90),lim(r['attribution'],60),lim(r["displaydate"],40),r['beginyear'] or '',lim(r['medium'],50)]))
data=('\n'.join(rows)+'\n').encode()
open(out,'wb').write(gzip.compress(data,9))
print(len(rows),len(data))
