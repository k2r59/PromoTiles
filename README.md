# PromoTiles · Piano Challenge

Jeu de rythme Vue 3 pour mobile et ordinateur, avec accueil de Noël, boule à neige interactive, 100 morceaux NCS et trois niveaux par chanson. Chaque version de jeu contient 90 secondes de musique, précédées de 1,25 seconde de préparation audio.

## Version privée Cloudflare

Le jeu est déployé sur **https://noel.promo.dev**, avec sa propre connexion par code e-mail, réservée aux adresses `@promo.dev`. Le Worker vérifie la session HttpOnly ; D1 impose une adresse et un pseudo uniques et conserve les parties et meilleurs scores. Cloudflare Access a été retiré.

Commandes, ressources et diagnostic : [CLOUDFLARE.md](CLOUDFLARE.md).

## Lancer en local

Node.js 24 recommandé (SQLite intégré). Sur cette machine, les médias sont déjà présents.

```sh
npm ci
npm run dev
```

Vite sert le jeu sur http://localhost:5173 et transmet les requêtes API au serveur SQLite sur le port 5175. Pour la version de production et le cache PWA :

```sh
npm run build
npm start
```

Ouvrir http://localhost:5175. `npm run preview` seul ne fournit pas l’API de classement.

## Jouer

Choisir un morceau et un niveau. Appuyer sur les touches quand les notes atteignent la ligne dorée ; maintenir les notes longues. Clavier : **D, F, J, K**. Espace met en pause ; la reprise revient deux secondes en arrière. Le profil permet de régler le décalage audio, le son et les animations. Recherche, favoris, extraits et défi du jour sont disponibles dans la collection.

L’accueil est visible sans connexion, avec la même boule à neige et sans navigation inférieure. « Entrer en scène » ouvre la connexion. Une connexion, un pseudo unique et un avatar sont requis pour jouer. En développement, les codes sont écrits dans `data/dev-auth-email.json` sans envoyer de courrier. Le serveur recalcule les scores à partir du journal des gestes. Les anciens morceaux retirés ne contribuent plus au classement actuel.

L’application installée se nomme **promoTiles**, avec son icône de sapin piano bleu et or. Vingt avatars de Noël et une vue Dotations (trois cadeaux fictifs) complètent le profil et la navigation.

Le fond musical de Noël fourni par l’utilisateur boucle hors partie, après le premier geste autorisant le son. Il se coupe pendant les extraits, les parties et en arrière-plan, et respecte le bouton son.

Le profil ouvre un guide d’installation en trois étapes pour iPhone/iPad, Android et ordinateur. Le bouton natif est proposé lorsque le navigateur le permet. Le manifeste protégé inclut les informations de session (`use-credentials`).

La PWA conserve l’interface et les médias effectivement consultés. Un morceau doit avoir été chargé avant de fonctionner hors connexion. Le classement nécessite le serveur.

## Musique et reconstruction

Le catalogue actif est `src/data/catalog.json`. Les sources, crédits et pochettes sont référencés dans `audio/catalog-ncs/`. Les MP3 et pochettes NCS sont locaux, ignorés par Git. Un nouveau clone exige leur reconstruction :

```sh
python3 tools/audio/prepare_ncs.py
python3 tools/audio/expand_ncs.py
python3 tools/audio/collect_ncs_covers.py
python3 tools/audio/build_ncs.py
python3 tools/audio/activate_ncs.py
```

La génération nécessite FFmpeg, NumPy, SciPy et librosa dans l’environnement Python utilisé. `collect_ncs.py` permet de rafraîchir les métadonnées sources ; les fichiers déjà présents suffisent normalement. `build_ncs.py --reuse-audio` refait les partitions sans réencoder les MP3 existants.

Les notes suivent des attaques mesurées dans l’enregistrement. Le tempo et les tenues sont estimés automatiquement : cela ne constitue pas une transcription instrumentale exacte. Les modes facile et normal utilisent une pulsation plus espacée sur les morceaux rapides.

Musique fournie par NoCopyrightSounds. Cette sélection est une évaluation locale interne ; aucune licence de distribution dans un jeu n’a été obtenue. Les conditions NCS ne sont pas une licence Creative Commons. Le déploiement Cloudflare est privé et limité à l’équipe via la connexion native. L’ancien catalogue instrumental est conservé localement dans `artifacts/catalog/retired/`.

## Vérifier et reprendre

```sh
npm test
npm run test:cloudflare
npm run build
```

59 tests couvrent notamment les 300 partitions, les plafonds de score, les tenues, les reprises, la provenance des attaques, l’API partagée et la neige. Captures dans `design/previews/`. Contexte historique et changements récents dans [REPRISE.md](REPRISE.md). Les évaluations des agents ne remplacent pas un essai humain sur téléphone ni la validation du plaisir de jeu.
