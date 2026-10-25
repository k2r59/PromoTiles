export const avatars=[
 ['f-blonde','Éclat blond'],['f-brune','Nuit brune'],['f-boucles','Boucles étoilées'],['f-rousse','Flamme rousse'],['f-asiatique','Étoile de minuit'],
 ['f-grise','Élégance argentée'],['f-tresses','Tresses de Noël'],['f-courte','Lutin malicieux'],['f-bonnet','Douceur d’hiver'],['f-chauve','Lumière dorée'],
 ['h-blond','Soleil d’hiver'],['h-brun','Barbe de Noël'],['h-chauve','Esprit festif'],['h-noir','Sourire polaire'],['h-roux','Roux des bois'],
 ['h-asiatique','Regard étoilé'],['h-gris','Sagesse argentée'],['h-lunettes','Lunettes magiques'],['h-boucles','Boucles d’hiver'],['h-long','Artiste de Noël']
].map(([id,label])=>({id,label,src:'/avatars/'+id+'.webp'}))
export const avatarFor=id=>avatars.find(a=>a.id===id)
