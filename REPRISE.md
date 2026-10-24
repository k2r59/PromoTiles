# PromoTiles · Dossier complet de reprise

État du projet au **24 octobre 2026**. Société : **PROMODEV**. Dépôt : [k2r59/PromoTiles](https://github.com/k2r59/PromoTiles). Branche de travail prévue : `main`.

Ce document transmet le contexte produit, les décisions graphiques, le fonctionnement du code, les commandes de reprise, les preuves de vérification et les travaux restants. Il permet de reprendre le projet sans récupérer l’historique de conversation ni les environnements Python de l’ancien Mac.

## 1. État réel à connaître avant toute modification

Le projet est un **prototype mobile PWA jouable en local**, construit en Vue 3. Il comprend un accueil animé, la sélection de trois niveaux, un morceau complet, un moteur à quatre colonnes, des résultats, des records locaux et un profil avec préférences. Le MP3, les partitions, les images et les polices nécessaires sont dans le dépôt.

Le concours entre collègues reste à construire : authentification, API, MongoDB, classement partagé, catalogue de plusieurs morceaux et contrôle des scores côté serveur. Aucun déploiement public Cloudflare n’a été effectué pendant cette session. Le contrôle de déploiement à blanc a réussi.

La cible utilisateur est une réalisation très proche de la maquette, avec des effets luxueux et quatre audits à 10/10. **Cette cible n’est pas atteinte.** Les dernières notes sont 9,6/10 en fidélité graphique, 9/10 pour les animations de l’accueil, 9,5/10 pour les fonctionnalités locales et 7,5/10 pour le fun/jouabilité. Ne pas convertir ces notes en promesse de perfection.

## 2. Reprendre sur l’autre Mac

### Installation minimale pour jouer et développer

Prérequis : Git, Node.js et npm. La version utilisée sur le Mac d’origine est **Node.js 24.15.0**, inscrite dans `.nvmrc`. Le README indique Node.js 22.12 ou une version ultérieure compatible avec Vite 8. Utiliser la version testée pour limiter les différences.

```sh
git clone https://github.com/k2r59/PromoTiles.git
cd PromoTiles
```

Si `nvm` est déjà installé :

```sh
nvm install
nvm use
```

Puis :

```sh
npm ci
npm test
npm run dev
```

Ouvrir l’adresse affichée par Vite. Le port dépend des processus déjà lancés. L’ancien Mac utilisait `http://localhost:5174/` pour la prévisualisation de production ; cette adresse ne donne pas accès à l’ancien ordinateur depuis le nouveau.

**Aucun fichier `.env`, compte MongoDB, serveur MCP ou environnement Python n’est nécessaire pour exécuter le prototype existant.** Les outils audio servent uniquement à refaire les transcriptions et les partitions.

### Vérifier la version de production et la PWA

```sh
npm run build
npm run preview -- --port 5174 --strictPort
```

Ouvrir `http://localhost:5174/`, attendre l’installation complète du service worker et des ressources, puis tester le rechargement hors connexion. Le serveur `npm run dev` ne suffit pas pour valider le cache de production.

Pour tester l’interface depuis un téléphone sur le réseau local, utiliser l’adresse réseau indiquée par Vite. Pour tester l’installation PWA et le service worker sur ce téléphone, utiliser une origine HTTPS : l’exception de sécurité de `localhost` sur le Mac ne s’applique pas à son adresse IP depuis le téléphone.

### Synchroniser deux Mac

Avant de reprendre sur un Mac dont le dépôt existe déjà :

```sh
git status
git pull --ff-only
npm ci
```

Après les modifications et les contrôles :

```sh
git add <fichiers-modifiés>
git commit -m "Décrire la modification"
git push origin main
```

Résoudre les modifications locales avant de changer de machine. Ne pas écraser le travail de l’autre Mac avec un push forcé. Les scores et réglages du navigateur ne voyagent pas avec Git.

## 3. Brief utilisateur et décisions à conserver

| Sujet | Demande et décision |
| --- | --- |
| Produit | Concours musical entre collègues, inspiré de Piano Tiles |
| Société | PROMODEV, nom ajouté après les premières propositions graphiques |
| Support | Mobile en priorité, PWA installable ; ordinateur utilisable au clavier |
| Thème | Noël, nuit polaire, cristal, neige, aurores, ivoire et or |
| Musique | Des titres ordinaires, **pas des chansons de Noël** |
| Choix | Le joueur doit pouvoir choisir un titre ; un seul est intégré actuellement |
| Difficulté | Coefficient propre au morceau, plus mode facile / normal / difficile |
| Points | Les deux difficultés doivent modifier le potentiel de points |
| Graphisme | Fidélité à la proposition choisie, richesse visuelle et rendu luxueux |
| Animations | Neige sur l’accueil, boule animée, reflets, fond légèrement animé |
| Technique | Vue.js, JavaScript compatible Node.js, MongoDB, Cloudflare Workers |
| Outils | Outils gratuits privilégiés ; génération d’images autorisée |
| Audits | Quatre regards distincts : fidélité, animations, fonctionnalités, fun/jouabilité |

Le nom « tempo » apparaît dans les anciennes propositions. La marque à afficher dans l’application est PROMODEV. Les maquettes contenaient des collègues, des scores et des titres illustratifs ; ne pas les présenter comme des données réelles.

Le choix graphique est acquis. Continuer à partir de cette direction plutôt que proposer cinq nouvelles identités ou repartir d’une interface générique.

## 4. Références graphiques et captures

### Documents de référence

- [Maquette Promodev Nuit polaire prestige](design/promodev-nuit-polaire-prestige.png) : référence principale.
- [Maquette de sélection du titre et du niveau](design/promodev-selection-titre-niveau.png).
- [Brief structuré](design/promodev-brief.json) : demandes confirmées et propositions encore à préciser.
- [Prompts de production des assets](design/asset-production.json).
- `design/promodev-prompts.txt` et les autres fichiers de prompts : historique créatif.
- Les propositions numérotées dans `design/` : alternatives historiques, pas des directions concurrentes à réintroduire.

### Captures du prototype versionnées

| Fichier | Usage |
| --- | --- |
| `design/previews/home-final.png` | Accueil mobile 390 × 844 |
| `design/previews/home-smallphone-final.png` | Accueil compact 320 × 568 |
| `design/previews/home-desktop-final.png` | Accueil ordinateur 1280 × 900 |
| `design/previews/selection-v3.png` | Sélection du niveau |
| `design/previews/leaderboard-final.png` | Podium et records locaux |
| `design/previews/game-live.png` | Partie en cours, capture de contrôle |
| `design/previews/animation-cadence-mobile.png` | Instrumentation de cadence |
| `design/previews/animation-reduced-mobile.png` | Contrôle de réduction des mouvements |
| `design/audit-playability-game.png` | Preuve du parcours de jouabilité |
| `design/audit-playability-result.png` | Résultat avant les deux derniers raffinements visuels |

Les captures de résultat historiques précèdent le compactage final et l’affichage « <1 % ». Le code actuel est la source de vérité pour ces deux corrections. Les captures du navigateur entier et les sorties temporaires restent ignorées dans `artifacts/`.

### Règles visuelles

Conserver le fond bleu nuit, les montagnes et sapins enneigés, les aurores turquoise, les touches de champagne et le contraste ivoire. Le globe doit garder son rendu photographique et sa transparence. Les ornements de Noël restent visibles sans empiéter sur les zones d’interaction.

La typographie combine Manrope et Cormorant Garamond, avec des adaptations CSS du titre. Les polices sont locales via les paquets `@fontsource`. La couleur de thème est `#071426` ; l’or principal est proche de `#e6c78f`.

L’ancienne boule procédurale Three.js a été remplacée, car son rendu était trop pauvre par rapport à la maquette. Son code reste dans `design/source/SnowGlobe-procedural.vue`. **Le globe actuel est une composition 2,5D**, pas une sculpture 3D indépendante à l’intérieur d’une sphère.

## 5. Carte du dépôt

| Chemin | Responsabilité |
| --- | --- |
| `src/main.js` | Démarrage de Vue et import du style |
| `src/App.vue` | Vues, navigation, profil, sélection, extrait audio, résultats, records et mise à jour PWA |
| `src/components/Atmosphere.vue` | Fond, aurores, brume et neige d’ambiance |
| `src/components/SnowGlobe.vue` | Globe transparent, particules, reflets et interaction |
| `src/components/Game.vue` | Audio, affichage Canvas, entrées, compte à rebours, pause et fin de partie |
| `src/lib/game-engine.js` | Jugement des notes, score, combo, reprise et sauvegarde des résultats |
| `src/style.css` | Mise en page, tailles mobiles, effets CSS, accessibilité du mouvement |
| `src/sw.js` | Précache, réponses audio partielles, navigation hors connexion et mise à jour |
| `public/music/` | MP3 lu par le jeu et trois partitions JSON |
| `public/*.webp` | Images du décor, du globe et du podium |
| `public/icons/` | Icônes PWA 192 et 512 px |
| `tests/` | Tests Node du moteur et de la persistance |
| `tools/audio/` | Transcription MCP, analyse audio et création des partitions |
| `audio/joe-dassin-dans-les-yeux-emilie/` | Sources MIDI, analyse et exports de fabrication |
| `design/` | Références, historique, captures sélectionnées et rapports d’audit |
| `vite.config.js` | Vue, manifeste PWA et construction du service worker |
| `wrangler.jsonc` | Distribution statique Cloudflare Workers |
| `package.json` / `package-lock.json` | Commandes, dépendances et versions verrouillées |
| `.nvmrc` | Version Node utilisée sur la machine de référence |

Le code utilise JavaScript avec modules ES. Il n’y a ni Vue Router, ni Pinia, ni backend Express. La navigation de l’application utilise une variable réactive dans `App.vue` ; les vues ne possèdent pas de liens profonds distincts.

`src/style.css` contient des ajustements ajoutés à la fin du fichier. Les dernières règles peuvent prendre le dessus sur les premières. Une réorganisation reste possible, mais doit conserver les captures de référence aux trois tailles contrôlées.

## 6. Parcours et états de l’application

### Accueil

Marque, titre, globe, informations locales, bouton Jouer et navigation basse. Le globe accepte le clic, le toucher et l’activation au clavier. Le fond reste animé lentement lorsque les préférences le permettent.

### Sélection

Un seul titre : « Dans les yeux d’Émilie », Joe Dassin. Trois modes avec leurs plafonds. Le mode par défaut est `normal`. Le bouton d’extrait lance le MP3 vers 35 secondes avec un volume de 0,45. La lecture s’arrête lors du changement de vue et respecte le réglage du son.

Un état de chargement et un identifiant de requête protègent contre deux démarrages concurrents de l’extrait. Ne pas supprimer cette protection lors de la création du catalogue.

### Jeu

`Game.vue` est chargé de façon asynchrone. Il reçoit `mode`, `sound` et `motion`, et émet `exit` et `finish`. Les phases sont `loading`, `ready`, `priming`, `countdown`, `starting`, `playing`, `paused` et `error`.

Le joueur clique sur « Lancer la musique ». Ce geste permet de débloquer le lecteur audio, notamment dans Safari. Le jeu effectue une amorce silencieuse, un compte à rebours puis le lancement synchronisé.

Les quatre colonnes se commandent avec les touches du bas ou **D, F, J, K**. La ligne de frappe dorée se situe vers 81 % de la hauteur de piste. Le bord inférieur des notes doit atteindre cette ligne. Les notes longues demandent de maintenir la touche.

Le jeu utilise Pointer Events, capture les pointeurs et distingue les appuis simultanés. Les répétitions clavier ne doivent pas compter plusieurs fois une note. Le support logiciel existe ; un essai à deux doigts sur téléphone physique reste nécessaire.

### Pause et reprise

Espace ou Échap met en pause. La perte de focus et le passage en arrière-plan déclenchent également la pause. La reprise recule de deux secondes puis relance un compte à rebours. Si la position traverse une note tenue déjà jugée, le moteur revient avant son début.

Le moteur réinitialise puis rejoue l’historique antérieur au point de reprise. Cette reconstruction empêche de gagner deux fois les points des mêmes notes.

### Résultat, records et profil

Une partie arrivée à son terme produit le résultat et tente de le sauvegarder une seule fois. Une partie abandonnée n’est pas enregistrée. L’écran indique les points, la précision, les jugements et le combo. Une précision positive inférieure à 1 % s’affiche « <1 % ».

Le classement actuel présente les meilleurs scores locaux par niveau. Il n’affiche pas de classement entre personnes. Le profil conserve un pseudonyme de 24 caractères maximum, le son et le mouvement. Un échec de stockage affiche une erreur au lieu d’un succès fictif.

La navigation basse est retirée des écrans de sélection et de résultat pour dégager les actions principales. Le dialogue d’aide décrit les commandes et l’installation sur iPhone.

## 7. Horloge audio et moteur de jeu

### Référence temporelle

Pendant la partie, utiliser `audio.currentTime` comme horloge. Le temps écoulé depuis `Date.now()` ou le nombre de frames ne doit pas remplacer cette référence. La cadence d’affichage et l’avancement audio peuvent diverger lorsque l’appareil ralentit.

La première note se trouve à **0,265909 seconde**. Le préroulement commence avec un temps de partition négatif pour rendre cette note visible avant le début de la musique. Un simple compte à rebours qui affiche les notes seulement après `audio.play()` ferait apparaître la première note trop tard.

Le MP3 est le fichier complet, non recoupé, de **222,052426 secondes**. Conserver son silence initial et sa référence temporelle. Toute coupe ou transformation modifiant le début du fichier impose de recalculer ou de décaler les partitions.

### États et jugement

Chaque note passe de `pending` à `holding`, `hit` ou `miss` selon son type et les entrées. Le moteur choisit la note en attente la plus proche dans la colonne, à l’intérieur de la fenêtre du mode.

| Mode | Fenêtre d’acceptation | Temps d’approche |
| --- | --- | --- |
| Facile | ±180 ms | 2,5 s |
| Normal | ±140 ms | 2 s |
| Difficile | ±105 ms | 1,6 s |

Un appui est parfait si l’écart absolu ne dépasse pas 46 % de la fenêtre ; sa qualité vaut 1. Un appui accepté au-delà vaut 0,72. Une note ratée vaut 0. Un appui hors fenêtre est une erreur ; un délai de 180 ms par colonne limite l’accumulation d’erreurs due au spam.

Une note tenue crédite d’abord 30 % de la qualité de son début. Une tenue complète reçoit cette qualité entière. Un relâchement anticipé reçoit `qualitéDébut × (0.3 + 0.7 × fractionTenue)` et coupe le combo.

Le combo augmente lors d’un début de note réussi. Le moteur conserve le meilleur combo. Les erreurs et les ratés coupent le combo courant. La réussite complète d’une tenue n’ajoute pas un second début de note au combo.

### Formule exacte

Soit `N` le nombre de notes, `Q` la somme des qualités, `C` le meilleur combo, `W` le nombre d’appuis erronés et `P` le plafond du mode :

```text
précision = Q / N
score = clamp(round((0.9 × précision + 0.1 × C / N - 0.002 × W) × P), 0, P)
P = 1000 × coefficientMorceau × coefficientMode
```

Le code de référence est `src/lib/game-engine.js`. Le nombre de notes est normalisé : une partition plus dense ne multiplie pas implicitement le potentiel de points une deuxième fois. Le score peut baisser après un mauvais appui. Une partie parfaite atteint exactement son plafond.

La difficulté du morceau est provisoirement notée **3/5**, coefficient **1,5**. Les coefficients de mode sont 1, 1,5 et 2. Ces coefficients sont implémentés dans les plafonds locaux ; leur équilibre pour un concours reste à valider.

### Résultat et stockage

Le résultat contient `songId`, `mode`, `score`, `maxPoints`, `perfect`, `good`, `misses`, `wrong`, `maxCombo`, `total` et `accuracy`. L’interface reçoit également l’état de sauvegarde.

Clés locales :

| Clé | Contenu |
| --- | --- |
| `promodev-settings` | Nom, son et préférence de mouvement |
| `promodev-records-v1` | Historique des résultats et records conservés |

La sauvegarde garde les 50 résultats les plus récents **plus** les anciens records de chaque couple morceau/niveau. Le total peut donc dépasser 50 entrées. En cas d’égalité, le résultat le plus récent devient le record retenu. Le code gère le JSON corrompu, un tableau absent, les quotas et même un accès à `localStorage` qui lève une exception.

Ces données appartiennent à l’origine du navigateur : protocole, hôte et port. Passer de `localhost:5173` à `localhost:5174`, changer de navigateur ou de Mac ne transporte pas les records. Les scores locaux restent modifiables par le joueur et ne suffisent pas pour arbitrer un concours.

## 8. Partitions : données et contrat

| Mode | Notes | Notes longues | Événements doubles | Plafond |
| --- | --- | --- | --- | --- |
| Facile | 216 | 0 | 0 | 1 500 |
| Normal | 415 | 8 | 0 | 2 250 |
| Difficile | 701 | 25 | 28 | 3 000 |

Les trois fichiers sont `public/music/facile.json`, `normal.json` et `difficile.json`. Chaque fichier décrit le morceau et sa partition. Les identifiants doivent rester uniques, les notes triées par temps et les colonnes comprises entre 0 et 3.

Exemple réel de la première note facile :

```json
{
  "timeSeconds": 0.265909,
  "durationSeconds": 0.0,
  "lane": 1,
  "midiPitch": 60,
  "velocity": 70,
  "type": "tap",
  "id": "facile-0001"
}
```

| Champ | Sens |
| --- | --- |
| `timeSeconds` | Début en secondes depuis le début du MP3 non recoupé |
| `durationSeconds` | Durée de maintien ; zéro pour une frappe simple |
| `lane` | Colonne, 0 à gauche et 3 à droite |
| `midiPitch` | Hauteur MIDI ayant servi à l’arrangement |
| `velocity` | Vélocité de la note transcrite |
| `type` | `tap` ou `hold` |
| `id` | Identifiant unique de la note dans la partition |

Les métadonnées comprennent `songId`, `schemaVersion`, `audioSha256`, durée, tempo estimé, mode, temps d’approche, difficulté et barème. Le champ `audioFile` vaut `audio.mp3` dans le pack d’export. **L’application charge actuellement `/music/emilie.mp3` explicitement** dans son code. Ce champ ne pilote donc pas encore le lecteur.

Les exports JSON sous `audio/.../exports/` et les fichiers publics sont des copies distinctes. Après régénération, recopier les partitions vers `public/music/` avant de tester le jeu.

## 9. Chaîne MP3 → MIDI → partitions jouables

### Provenance et limites

Le fichier fourni par l’utilisateur était :

```text
/Volumes/EXT/Download/Joe Dassin - Dans les yeux DÉmilie (ParolesLyrics).mp3
```

Le lien de référence était [la vidéo YouTube fournie](https://www.youtube.com/watch?v=ZJJCs-Y--_s). Le jeu utilise le MP3 fourni. Il n’a pas besoin de YouTube au lancement.

Empreinte SHA-256 de l’audio attendu :

```text
ad35be9ae3f0ab6d25506a92a9c2242fd40f67ab46e1b903c35cf9b0b36c8ac6
```

Le MIDI brut comporte **2 231 notes**. La transcription porte sur le mix complet, sans séparation voix/instruments. Elle ne garantit pas une mélodie isolée ni une partition musicale exacte. Le premier essai synthétique à trois notes avait produit cinq notes, dont deux artefacts. Les essais techniques du jeu ne remplacent pas une validation musicale à l’écoute.

Le tempo estimé est **151,999 BPM**. Il sert à l’arrangement ; le moteur joue les positions temporelles des notes et ne recalcule pas leur temps à partir de ce tempo global.

### Outils fournis

1. `transcribe_mcp.py` appelle audio2score par MCP stdio et conserve un compte rendu.
2. `analyze_audio.py` analyse durée, empreinte, attaques et pulsations avec librosa.
3. `build_game_charts.py` transforme le MIDI brut en trois arrangements à quatre colonnes et exporte JSON, MIDI, manifeste et archive.

**Le JSON `.notes.json` du MCP exprime les positions en temps musicaux/beats. Ne jamais utiliser ces valeurs directement comme des secondes dans le jeu.** La génération des partitions lit le MIDI avec `pretty_midi`, qui fournit les positions en secondes.

### Installation audio facultative sur le nouveau Mac

Le serveur utilisé est [David7ce/audio2score-mcp](https://github.com/David7ce/audio2score-mcp), révision :

```text
f13bb18e25e6c047118a7846346539aeb6ac075d
```

L’installation d’origine utilisait Python 3.11 et CoreML sur Mac ARM64. Elle se trouvait dans `/Volumes/EXT/ApplicationData/Codex/mcp/audio2score-mcp`. Ce chemin est historique. Le script du projet accepte désormais `AUDIO2SCORE_ROOT` et utilise par défaut `~/.local/share/audio2score-mcp`.

Avec Git et `uv` déjà disponibles, recréer l’environnement :

```sh
export AUDIO2SCORE_ROOT="$HOME/.local/share/audio2score-mcp"
mkdir -p "$HOME/.local/share"
git clone https://github.com/David7ce/audio2score-mcp.git "$AUDIO2SCORE_ROOT"
git -C "$AUDIO2SCORE_ROOT" checkout f13bb18e25e6c047118a7846346539aeb6ac075d
uv venv --python 3.11 "$AUDIO2SCORE_ROOT/.venv"
uv pip install --python "$AUDIO2SCORE_ROOT/.venv/bin/python" -r "$AUDIO2SCORE_ROOT/requirements.txt"
```

Ces commandes reconstruisent l’installation ; elles n’ont pas encore été exécutées sur le second Mac. La disponibilité des roues natives et du moteur d’inférence dépend de son architecture. Ne pas copier le dossier `.venv` de l’ancien Mac.

Versions observées dans l’environnement de transcription d’origine :

| Paquet | Version |
| --- | --- |
| basic-pitch | 0.4.0 |
| mcp | 2.0.0 |
| music21 | 10.5.0 |
| librosa | 0.11.0 |
| numpy | 2.4.6 |
| pretty_midi | 0.2.11.post0 |
| coremltools | 9.0 |

Le serveur possède son propre fichier de dépendances. Ces versions observées ne constituent pas un verrou complet de l’environnement Python. Utiliser `uv pip` si le venv ne contient pas `pip`, comme sur l’installation d’origine.

### Enregistrement MCP dans Codex, si souhaité

Le script de transcription peut appeler le serveur directement sans enregistrement dans l’application. Pour exposer également ses outils dans Codex, utiliser le CLI livré avec l’application installée. Sur le Mac d’origine :

```sh
/Applications/Codex.app/Contents/Resources/codex mcp add audio2score \
  --env PYTHONUNBUFFERED=1 \
  -- "$AUDIO2SCORE_ROOT/.venv/bin/python" "$AUDIO2SCORE_ROOT/mcp_server.py"
```

L’aide locale du CLI a confirmé cette syntaxe. Adapter le chemin de l’application si nécessaire. Configurer dans l’entrée MCP les délais `startup_timeout_sec = 60` et `tool_timeout_sec = 600` si le chargement du modèle le demande. Ne pas remplacer toute la configuration personnelle de Codex par celle de l’ancien Mac.

Les outils utilisés sont `transcribe_audio` et `score_to_notes`. Le serveur propose aussi `midi_to_score`. MusicXML et MuseScore ne sont pas nécessaires pour exécuter ce jeu.

### Régénérer le morceau existant

Depuis la racine du projet, après installation de l’environnement audio :

```sh
export AUDIO2SCORE_ROOT="$HOME/.local/share/audio2score-mcp"
export PROMOTILES_SONG_DIR="audio/joe-dassin-dans-les-yeux-emilie"
cp public/music/emilie.mp3 "$PROMOTILES_SONG_DIR/source/song.mp3"
"$AUDIO2SCORE_ROOT/.venv/bin/python" tools/audio/transcribe_mcp.py \
  "$PROMOTILES_SONG_DIR/source/song.mp3" "$PROMOTILES_SONG_DIR/analysis"
"$AUDIO2SCORE_ROOT/.venv/bin/python" tools/audio/analyze_audio.py \
  "$PROMOTILES_SONG_DIR/source/song.mp3" "$PROMOTILES_SONG_DIR/analysis/timing.json"
"$AUDIO2SCORE_ROOT/.venv/bin/python" tools/audio/build_game_charts.py "$PROMOTILES_SONG_DIR"
```

Le script MCP réutilise les fichiers MIDI et notes déjà présents. Pour une nouvelle transcription, travailler dans un autre dossier ou déplacer les sorties existantes après sauvegarde. Le générateur réécrit les exports ; inspecter le diff avant de les conserver.

Recopier ensuite les partitions dans les ressources de l’application :

```sh
cp "$PROMOTILES_SONG_DIR/exports/dans-les-yeux-emilie.facile.json" public/music/facile.json
cp "$PROMOTILES_SONG_DIR/exports/dans-les-yeux-emilie.normal.json" public/music/normal.json
cp "$PROMOTILES_SONG_DIR/exports/dans-les-yeux-emilie.difficile.json" public/music/difficile.json
npm test
npm run build
```

Le générateur contient encore le titre, l’artiste, le lien et des noms de fichiers propres à ce morceau. Il faut le généraliser avant d’en faire un outil d’import de titres quelconques.

### Principes de l’arrangement automatique

Le générateur conserve les notes non percussives de hauteur MIDI 48 à 88, de vélocité au moins 40 et de durée au moins 0,12 s. Il regroupe les débuts espacés de moins de 45 ms et favorise les notes fortes, suffisamment longues, dans un registre médium/aigu.

Il sélectionne les événements avec un espacement minimal dépendant du mode et du tempo. Les quatre colonnes suivent les quantiles de hauteur. Le mode difficile peut ajouter une seconde note, espacée d’au moins quatre pulsations entre événements doubles. Les deux notes utilisent des colonnes distinctes.

Les tenues normales commencent à 0,65 s et sont limitées à 1 s ; les tenues difficiles commencent à 0,5 s et sont limitées à 1,4 s. Le générateur raccourcit les tenues avant les notes suivantes et limite l’activité simultanée à deux doigts. Une durée finale inférieure à 0,30 s devient une frappe simple.

Les assertions vérifient les identifiants, les bornes temporelles, les colonnes, les conflits, le maximum de deux doigts, la densité croissante et l’aller-retour MIDI à moins de 3 ms. Elles ne jugent pas la sensation musicale.

## 10. Animations et budget de rendu

`Atmosphere.vue` associe image de fond, aurores et brume CSS à de la neige Canvas. L’animation ralentit visuellement le décor sans changer les repères de jeu. Les mouvements d’ambiance sont suspendus pendant la partie ou lorsque l’onglet est masqué, selon les propriétés transmises.

`SnowGlobe.vue` utilise une image WebP transparente de 1100 × 1100, de la neige découpée dans une ellipse, des reflets et des scintillements. Le Canvas gère environ 80 ou 120 particules selon la taille, avec un DPR plafonné à 1,5. La parallaxe reste de quelques pixels. Une activation lance un tourbillon de 4,2 secondes et une lumière dorée.

Respecter à la fois le réglage du profil et `prefers-reduced-motion`. La préférence système est réactive. L’onglet masqué suspend les boucles ; le démontage nettoie les écouteurs et les `requestAnimationFrame`. L’instrumentation temporaire est archivée dans `design/source/dev-animation-audit.js` et ne doit pas être réintroduite par défaut en production.

Dans le jeu, les retours visuels et particules ne doivent pas masquer les notes, les colonnes ou la ligne dorée. Les effets supplémentaires demandés doivent être évalués sur un téléphone réel avant d’augmenter le nombre de particules ou la résolution des Canvas.

## 11. PWA, cache et mise à jour

`vite-plugin-pwa` utilise `injectManifest` avec `src/sw.js`. Le manifeste est en français, en mode `standalone`, avec démarrage à la racine. Les images, polices, scripts, JSON et le MP3 sont précachés. Le seuil maximal par ressource est de 8 Mio.

Le dernier build avant la reprise indiquait environ 7,2 Mio de précache pour 29 ressources. Ces chiffres varient après modification. Le rapport fonctionnel historique mentionne 27 ressources et 6,51 Mo : il décrit une étape précédente du même prototype.

`RangeRequestsPlugin` s’applique au **précache** pour gérer les requêtes partielles du lecteur MP3, notamment dans Safari. Une route audio ajoutée après un précache qui intercepte déjà la ressource ne corrigerait pas ce problème. Conserver ce point lors d’une réorganisation Workbox.

La mise à jour est proposée à l’utilisateur. Le bouton « Actualiser » demande `SKIP_WAITING`. La bannière est masquée pendant une partie pour éviter une interruption. Le service worker prend ensuite en charge les clients et nettoie les anciens précaches.

Le mode hors connexion exige un premier chargement et un téléchargement complet réussis. Le test réalisé ne démontre pas un premier lancement sans réseau sur un appareil neuf. Avec plusieurs morceaux, revoir la stratégie de téléchargement : précacher tout le catalogue pourrait devenir trop lourd.

## 12. Cloudflare Workers et MongoDB

### Configuration livrée

`wrangler.jsonc` contient le nom `promodev-piano-challenge`, la date de compatibilité `2026-10-24`, le dossier d’assets `./dist` et `not_found_handling: single-page-application`.

```sh
npm run deploy:check
```

Cette commande compile puis exécute `wrangler deploy --dry-run`. Elle a réussi avec les assets du prototype. Elle ne publie pas l’application et ne démontre aucune connexion MongoDB.

Pour une publication ultérieure, connecter le bon compte Cloudflare puis utiliser :

```sh
npx wrangler login
npx wrangler whoami
npm run deploy
```

Aucune URL déployée, aucun identifiant de compte et aucun secret Cloudflare ne sont fournis dans ce document. La publication GitHub autorisée ne vaut pas constat d’un déploiement Cloudflare.

### Architecture encore à réaliser

Le projet n’a actuellement ni point d’entrée Worker API, ni routes de serveur, ni binding de base, ni connexion MongoDB, ni authentification. Le souhait « Node.js » concerne un backend JavaScript compatible avec l’environnement Cloudflare ; il ne signifie pas qu’un serveur Node traditionnel tourne déjà.

Avant de choisir le pilote et la gestion des connexions, vérifier la documentation officielle actuelle de MongoDB et des Workers, la compatibilité Node et les contraintes d’exécution. L’hypothèse ancienne de connexion via pilote natif/gestionnaire de connexions n’a pas été testée. Ne pas présenter une ancienne API de données ou une architecture supposée comme une intégration validée.

Pour le concours, prévoir au minimum : identité du participant, campagne active, catalogue versionné, sessions de jeu, résultats validés et agrégation du classement. La règle d’agrégation entre titres, le départage et les dates du concours restent à définir.

Le serveur devra vérifier le morceau, la version de partition, le mode et le barème, puis contrôler les entrées ou résultats selon le niveau de protection retenu. Accepter le total envoyé par le navigateur sans contrôle ne suffit pas. Ne jamais mettre une URI MongoDB ou un secret dans des variables Vite exposées au navigateur.

## 13. Vérifications réalisées et limites

### Tests automatisés

`npm test` exécute 22 tests Node. Ils couvrent notamment :

- Plafond exact des trois partitions réelles en partie parfaite.
- Note la plus proche, colonne, doubles touches, absence de double comptage.
- Ratés comptés une fois, mauvaises entrées et anti-spam.
- Tenues complètes, relâchement anticipé et annulation immédiate.
- Reprise avec reconstruction de l’historique, y compris au milieu d’une tenue.
- Remise à zéro du moteur.
- Stockage corrompu, non conforme, refusé, saturé ou inaccessible.
- Conservation des records après 80 parties inférieures ; séparation par morceau et égalités.

Le build et le déploiement à blanc ont réussi. L’audit npm a indiqué zéro vulnérabilité lors du dernier contrôle. Une surcharge `undici: ^7.30.1` évite la version vulnérable transitive amenée par l’outillage Wrangler de cette installation. Ne pas la supprimer sans refaire l’audit.

Le build peut émettre un avertissement `inlineDynamicImports` déprécié provenant de l’outillage PWA. Il n’a pas empêché la compilation. La dépendance Three.js est encore déclarée pour l’étude archivée ; elle n’est plus importée par le globe de l’application.

### Contrôles dans Safari sur Mac

L’accueil a été contrôlé à 320 × 568, 390 × 844 et 1280 × 900. La variante compacte laisse le bouton principal accessible. Le dialogue d’aide, la sélection, les retours de frappe, la pause, la reprise, les préférences et l’actualisation de la PWA ont été exercés.

Une partie complète de 3 min 42 a été exécutée après arrêt du serveur et confirmation de son indisponibilité. Le rechargement hors connexion, la lecture audio, le résultat et la conservation du record après rechargement ont réussi. Le résultat de test était 1 point, une note parfaite et un meilleur combo de 1 ; ce score valide le parcours, pas une performance musicale.

### Quatre audits distincts

| Audit | Note | Périmètre et limite |
| --- | --- | --- |
| Fidélité graphique | 9,6/10 | Accueil proche de la maquette, proportions encore différentes |
| Animations | 9/10 | Accueil Safari sur Mac ; pas de mesure sur téléphone |
| Fonctionnalités | 9,5/10 | Prototype local et parcours hors connexion ; concours connecté absent |
| Fun / jouabilité | 7,5/10 | Essai clavier ; catalogue et rivalité limités, musique à valider |

Les rapports complets sont dans [design/reviews](design/reviews). Ils indiquent l’origine des observations et les limites de chaque auditeur. L’objectif demandé reste 10/10 dans chaque domaine, avec preuves et corrections réelles.

La mesure d’animation consigne environ 100 secondes et 5 538 frames, passage en arrière-plan inclus : médiane 17 ms, p95 18 ms et une frame au-delà de 34 ms. En mouvement réduit, le contrôle a constaté une transformation remise à zéro et une empreinte pixel stable de la neige.

### Contrôles encore absents

- iPhone et Android physiques : deux doigts, tenue, interruption système, verrouillage et reprise.
- Installation réelle depuis l’écran d’accueil et relancement autonome.
- Latence audio avec haut-parleur, casque filaire et Bluetooth.
- Validation perceptive de la synchronisation et de la mélodie des partitions.
- Expérience entre plusieurs collègues et classement partagé.
- Connexion MongoDB et parcours déployé sur Cloudflare.

## 14. Prochaines étapes, par priorité

### A. Fiabiliser la jouabilité sur téléphone

Tester les trois modes sur iPhone et Android, relever les décalages perçus et les éventuelles entrées manquées. Prévoir une calibration audio si les mesures la justifient. Revoir les notes générées aux endroits où le joueur entend un autre rythme que celui qu’il doit frapper.

Critères de fin : une partie complète à deux doigts, des tenues et doubles notes reconnues, pause/reprise sans doublon, résultat sauvegardé, repères lisibles et synchronisation jugée satisfaisante par des joueurs humains.

### B. Construire le catalogue de titres

Extraire les métadonnées actuellement codées dans `App.vue`, `Game.vue` et le générateur. Définir un catalogue associant identifiant, titre, artiste, audio, visuel, difficulté et trois partitions. Faire dépendre les points, compteurs et fichiers chargés de la sélection réelle.

Critères de fin : au moins deux titres réellement jouables, trois niveaux par titre, records séparés par morceau, aucune mention résiduelle de Joe Dassin sur un autre titre, téléchargement hors connexion maîtrisé.

### C. Mettre en place le concours connecté

Définir les règles de classement et de départage, puis réaliser l’authentification, l’API Worker et MongoDB. Séparer l’entraînement local des résultats de concours validés. Préserver les scores locaux existants ou proposer une migration explicite si le format change.

Critères de fin : deux appareils connectés à des comptes distincts voient le même classement ; un score invalide est rejeté ; les coefficients du serveur font autorité ; les secrets restent côté serveur.

### D. Finaliser les effets et la fidélité

Comparer chaque écran à la référence approuvée, ajuster les proportions restantes, renforcer les célébrations de combo/record si elles restent lisibles. Mesurer le coût sur téléphone avant d’ajouter des effets.

Critères de fin : captures comparables, absence de débordement sur petit écran, commandes accessibles, mouvement réduit respecté, audit d’animation couvrant également le jeu et le résultat.

### E. Déployer et refaire les quatre audits

Publier sur Cloudflare après configuration du compte et du backend, puis tester le parcours HTTPS, l’installation, les mises à jour et le hors connexion. Refaire les quatre audits sur la version déployée, avec un périmètre explicite et des preuves. Ne pas annoncer 10/10 si un test requis manque.

## 15. Dépannage et pièges déjà rencontrés

| Symptôme | Vérification / correction |
| --- | --- |
| L’adresse 5174 ne répond pas sur le nouveau Mac | Démarrer `npm run preview -- --port 5174 --strictPort` après le build |
| Vite affiche un autre port | Un processus occupe le port ; lire l’adresse affichée ou utiliser `--strictPort` |
| L’interface semble ancienne | Recompiler, accepter « Actualiser », vérifier le service worker et son cache |
| Le navigateur charge encore le site serveur arrêté | Comportement normal après installation de la PWA ; vérifier les outils réseau |
| Aucun son au démarrage | Utiliser le bouton de lancement, vérifier le réglage son et l’erreur du lecteur |
| Une première note arrive immédiatement | Conserver le préroulement négatif avant le départ audio |
| Le MP3 hors connexion échoue dans Safari | Vérifier les réponses Range et le plugin appliqué au précache |
| Les records semblent perdus | Vérifier protocole, hôte, port et navigateur ; les données sont locales |
| Le profil ne se sauvegarde pas | Vérifier le stockage navigateur et l’état d’erreur ; ne pas afficher un faux succès |
| Le globe ne bouge pas | Vérifier la préférence système, le réglage du profil et la visibilité de l’onglet |
| Un nouveau MP3 semble désynchronisé | Vérifier son empreinte, le silence initial et les unités secondes/temps musicaux |
| Le script audio retrouve l’ancien MIDI | Il réutilise les sorties existantes ; changer de dossier pour retranscrire |
| Python ne trouve pas `mcp` ou `librosa` | Employer le Python du venv audio, pas le Python système |
| Le venv n’a pas `pip` | Utiliser `uv pip install --python ...` |
| Le serveur MCP est introuvable | Définir `AUDIO2SCORE_ROOT` vers la nouvelle installation |
| Un ancien CLI Codex rejette la configuration | Utiliser le CLI livré avec l’application actuelle ; préserver la configuration personnelle |
| Le résultat ou le CTA est caché | Vérifier les règles compactes et la navigation basse à 320 × 568 |
| Le catalogue affiche des chiffres incohérents | Supprimer les métadonnées dupliquées en dur lors de sa généralisation |

La suppression manuelle des données du site efface aussi les records locaux. Sauvegarder les données utiles avant une remise à zéro du stockage pour diagnostiquer un service worker.

## 16. Ce que Git transporte

Versionnés : code source, lockfile npm, configuration de build, ressources publiques, MP3 de jeu, partitions, MIDI de fabrication, analyse temporelle, scripts audio, maquettes, prompts, captures sélectionnées et rapports.

Ignorés : `node_modules/`, `dist/`, `.wrangler/`, `.env*` sauf éventuel exemple, environnements Python, caches, journaux, captures temporaires, doublons MP3 dans les dossiers de fabrication, métadonnées YouTube et archive ZIP régénérable.

Le MP3 nécessaire reste dans `public/music/emilie.mp3`. Pour refaire le dossier de fabrication, le recopier vers `source/song.mp3` comme indiqué plus haut. Le générateur recrée la copie audio d’export et le ZIP. Les sorties générées ignorées peuvent être obsolètes jusqu’à cette régénération.

Les fichiers de compte rendu d’installation et de transcription contiennent certains chemins absolus de l’ancien Mac. Ils constituent des traces historiques, pas des chemins à réutiliser. Le projet ne transporte ni identifiants GitHub/Cloudflare, ni configuration personnelle Codex, ni base MongoDB, ni préférences du navigateur.

## 17. Consigne prête à coller dans Codex sur l’autre Mac

> Reprends le projet PromoTiles pour PROMODEV à partir de ce dépôt. Lis intégralement REPRISE.md, puis README.md, les quatre rapports dans design/reviews et les sources utiles. Vérifie l’état Git et lance les tests ainsi que le build avant de modifier le projet. Conserve la direction graphique Nuit polaire choisie : Noël luxueux, globe photographique animé, neige, cristal, aurores et or ; les chansons ne sont pas des chansons de Noël. Le prototype actuel fonctionne localement avec Joe Dassin et trois niveaux, mais le catalogue multiple, l’authentification, MongoDB et le concours connecté restent à réaliser. Continue à partir de l’existant, sans reconstruire une nouvelle maquette. Les points combinent difficulté du morceau et mode. Vérifie la jouabilité sur téléphone et la synchronisation musicale. Utilise quatre audits distincts pour la fidélité graphique, les animations, les fonctionnalités et le fun, et rapporte les limites réelles sans inventer de 10/10. Mets à jour REPRISE.md avec les changements, les commandes vérifiées et ce qui reste à faire.

## 18. Checklist avant une nouvelle livraison

- [ ] `npm test` réussit, avec les trois plafonds réels et les protections de reprise.
- [ ] `npm run build` réussit ; la PWA contient les ressources attendues.
- [ ] Les fichiers audio et partitions ont la même référence temporelle.
- [ ] Les trois tailles de référence gardent leurs actions visibles.
- [ ] Son, mouvement réduit, pause et mise à jour respectent les choix du joueur.
- [ ] Les résultats locaux restent explicitement locaux tant que le backend manque.
- [ ] Les captures et notes d’audit décrivent la version effectivement testée.
- [ ] Aucun secret ni environnement local n’entre dans le commit.
- [ ] Le document de reprise distingue les fonctions livrées des propositions.
- [ ] Le commit est poussé et récupérable avant de changer de Mac.
