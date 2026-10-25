# PromoTiles · Dossier complet de reprise

État du projet au **24 octobre 2026**. Société : **PROMODEV**. Dépôt : [k2r59/PromoTiles](https://github.com/k2r59/PromoTiles). Branche de travail prévue : `main`.

Ce document transmet le contexte produit, les décisions graphiques, le fonctionnement du code, les commandes de reprise, les preuves de vérification et les travaux restants. Il permet de reprendre le projet sans récupérer l’historique de conversation ni les environnements Python de l’ancien Mac.

## 1. État réel à connaître avant toute modification

**Mise à jour du 24 octobre 2026 :** le catalogue actif contient maintenant 50 chansons chantées NCS, en versions de jeu de 90 secondes et 150 partitions. Le retour utilisateur « musique elle-même trop répétitive » concernait l’ancien catalogue instrumental Kevin MacLeod. Celui-ci a été retiré de l’interface et archivé localement dans `artifacts/catalog/retired/`.

Le jeu inclut notes à maintenir, recherche, favoris, extraits, défi du jour, résultats, réglage de décalage audio et classement partagé Node/SQLite. Le serveur recalcule les performances ; l’identification par pseudo ne remplace pas une authentification d’entreprise. MongoDB et SSO ne sont pas intégrés. La boule à neige et la direction de Noël sont conservées.

Lire d’abord le README actualisé pour les commandes. `npm run dev` lance Vite et l’API ; `npm run build && npm start` sert la version de production avec l’API sur le port 5175. Les MP3/pochettes NCS sont présents sur cette machine mais ignorés par Git : un nouveau clone doit les régénérer selon le README. Les conditions NCS sont spécifiques, aucune licence de distribution du jeu n’est acquise. Aucun déploiement public n’a été effectué.

Dernier audit : design 9,4/10, UX/UI 9,5/10, fonctionnement 10/10 sur le périmètre testé, fun 9,5/10, soit **38,4/40**. Détails et réserves dans `design/reviews/catalogue-vocal-2026-10-24.md`. Le retour utilisateur sur la nouvelle direction musicale est « Oui, nettement mieux ». Les 36 tests passent, notamment les 150 partitions et les notes longues. Les attaques viennent de l’audio ; tempo et tenues restent estimés. La cible de quatre audits à 10/10 n’est pas encore atteinte et ne doit pas être annoncée comme acquise. Les sections historiques ci-dessous décrivent aussi les états précédents (Joe Dassin, Entertainer, puis catalogue instrumental) et ne font pas autorité sur le catalogue actuel.

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

`SnowGlobe.vue` utilise désormais `piano-snowglobe-clear.webp`, une retouche ImageGen transparente sans flocons suspendus figés. L’original `piano-snowglobe.webp` est conservé. Le sapin piano, l’étoile, les cadeaux et le socle conservent la direction graphique approuvée. Au repos, aucune neige animée ne flotte. Une activation retourne la boule à 180°, puis la redresse en 1,8 seconde avant de libérer la neige. Le Canvas gère 260 ou 340 flocons selon la taille, avec un DPR plafonné à 1,5. Leur vitesse varie avec la profondeur ; ils restent dans le verre puis se déposent, sans réapparition en haut. La dernière demande a augmenté la quantité et prolongé la chute d’environ cinq secondes. `src/lib/snow-globe-physics.js` contient les trajectoires et les collisions.

L’étoile possède un scintillement renforcé, un halo et des rayons lumineux. Des éclats parcourent aléatoirement les sections visibles de la guirlande, dont les chemins sont ajustés à la nouvelle image. L’image, les particules et les reflets tournent ensemble. Les clics pendant le retournement ne lancent pas d’animations concurrentes.

`SkyVisitors.vue`, intégré dans `Atmosphere.vue`, fait traverser le Père Noël et quatre rennes une seule fois, cinq secondes après le chargement de la page. Le passage dure douze secondes ; une étoile filante suit trois secondes après, puis d’autres apparaissent toutes les 9 à 28 secondes avec des positions, directions, angles et durées aléatoires. Ce décor reste derrière l’interface, ne capture aucune interaction et est désactivé hors accueil, en mouvement réduit ou lorsque l’onglet est masqué. Le retour sur l’accueil ne rejoue pas le Père Noël ; un rechargement complet réinitialise la séquence.

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

### Vérification de la reprise depuis Git

Une copie propre du dépôt a été clonée dans un dossier temporaire distinct sur le Mac d’origine. `npm ci`, les 22 tests et le build de production ont réussi depuis cette copie, sans récupérer `node_modules`, `dist` ni les doublons audio ignorés. Ce contrôle confirme que les ressources nécessaires sont versionnées ; il ne remplace pas un essai sur le second Mac. Le contrôle syntaxique des scripts Python et la concordance des JSON publics avec les exports et l’empreinte du MP3 ont également réussi.

La relecture du dossier a été manuelle : le correcteur rédactionnel facultatif ne pouvait pas démarrer, car sa dépendance spaCy était absente.

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

## 19. Suite sur le second Mac — 24 octobre 2026

- Dépôt cloné dans `/Users/herve/Dev/promoTiles`, installation `npm ci` réussie avec Node.js 24.21.0 ; serveur Vite sur `http://localhost:5173/`, ouvert dans Arc.
- Modifications de la boule, de sa neige, de l’étoile, de la guirlande et du ciel décrites en section 10. Aucun changement des règles du jeu.
- Images produites avec l’outil ImageGen intégré, puis converties en WebP transparent : `public/piano-snowglobe-clear.webp` et `public/santa-sleigh.webp`. Prompts conservés dans `design/snowglobe-clear-prompt.txt` et `design/santa-sleigh-prompt.txt`.
- Vérification : `npm test` réussit avec **25 tests** ; les trois nouveaux contrôlent le confinement des flocons, leur dépôt, leur réactivation et le retournement complet. `npm run build` réussit, précache de 31 ressources, environ 7,63 Mio. Avertissement PWA `inlineDynamicImports` inchangé.
- Contrôles navigateur : formats 320 × 568, 390 × 844 et 1280 × 900, absence de débordement horizontal sur mobile, actions accessibles, rotation et chute de neige, passage du traîneau, première étoile filante et préférence de mouvement réduit. Aucune erreur console relevée dans le navigateur de contrôle. Capture mobile : `design/previews/snowglobe-mobile-animated.png`.
- Les contrôles mobiles sont des contrôles de viewport sur ordinateur, pas des essais iPhone/Android physiques. Les quatre audits historiques n’ont pas été refaits et leurs notes ne sont pas actualisées. Aucun déploiement ni push Git effectué pendant cette modification.

## 20. Démo The Entertainer (24 octobre 2026)

Nouveau morceau par défaut pour comparer le gameplay à l'ancienne transcription Joe Dassin : **The Entertainer**, Scott Joplin, piano solo, 63 s. Le design et les animations de Noël sont conservés. Le sélecteur permet de revenir à Émilie ; les records sont maintenant filtrés par morceau et niveau.

- Catalogue : `src/lib/songs.js`. `App.vue` et `Game.vue` utilisent ses chemins et métadonnées.
- Audio et charts synchronisés depuis le même MIDI dans `public/music/the-entertainer/` : 93 / 175 / 227 touches. Tempo 72, intro + thème A deux fois et cadence. Le mode normal suit la voix mélodique, sans transcription automatique du mix.
- Piano échantillonné rendu localement avec FluidSynth + GeneralUser GS ; sources, licence et instructions dans `audio/the-entertainer/README.md`. Reproduction : `tools/audio/build_entertainer.py`.
- Tiles courtes pour rendre lisibles les attaques rapprochées. Horloge de jeu toujours `audio.currentTime`, clavier D/F/J/K et boutons tactiles conservés.
- Tests : correspondance de toutes les tiles avec les véritables attaques du MIDI, empreinte audio, score parfait, records indépendants. `npm test` : 29 tests ; build Vite/PWA validé.
- Démo à faire essayer à l'utilisateur pour évaluer le plaisir de jeu et les niveaux ; pas de calibration de latence matérielle dans cette version.


## 21. État actuel — Cloudflare, PWA et diagnostic Safari (24 octobre 2026)

Cette section prévaut sur les anciens passages décrivant un prototype sans backend. Catalogue actuel : 50 titres chantés NCS, choix musical validé par l’utilisateur. Déploiement privé effectif sur **https://noel.promo.dev**, Worker et D1, connexion Access par code e-mail réservée à `@promo.dev`, unicité de l’adresse en base. Configuration et commandes détaillées dans **CLOUDFLARE.md**. Les profils anonymes du développement local restent distincts.

- Guide PWA coulissant iOS/Android/ordinateur, trois étapes, installation native lorsque disponible. Manifeste avec credentials ; routes de connexion exclues du fallback hors ligne.
- Connexion Cloudflare personnalisée Promo.dev, fond nuit, icône de marque, textes français. Habillage commun aux applications Access du compte ; sécurité inchangée.
- L’utilisateur confirme que le site fonctionne sur mobile, puis signale une fin immédiate au lancement sur **Safari iPhone**. Cause exacte encore à établir avec les traces du téléphone.
- Build de diagnostic `2026-10-24-mobile-2` : événements audio/chargement/états/score, export depuis Profil, remontée filtrée dans Workers Logs. Contrôle SHA-256 du MP3, durée cohérente, protection contre fin prématurée et saut d’horloge. Une anomalie audio affiche une erreur au lieu d’enregistrer une partie non jouée.
- Validation : 43 tests unitaires/API/partitions/identité ; test D1 dans workerd (migration, unicité, concurrence et trigger atomique) ; build et déploiement réussis. Aucun essai physique iPhone effectué par l’agent. La confirmation de résolution sur le téléphone reste nécessaire.
- Dernier déploiement à ce stade : `a80127a3-657b-49c5-a401-70910190e97d`. Aucun push Git effectué. Ne pas annoncer le bug iPhone définitivement résolu sans nouvel essai.

### Correctif Safari issu des logs réels

Les diagnostics de l’iPhone ont confirmé : MP3 de 1 826 525 octets intact, durée initiale 91,298 s, puis durée 0,000177792 s et `ended` pendant le décompte après le retour au début du Blob. Le message « morceau indisponible » est la protection mobile-2. **mobile-3** remplace `HTMLAudioElement`/Blob pour les parties par `BufferAudio` : fichier décodé en mémoire, contexte déverrouillé directement au toucher, temps de jeu pris sur l’horloge audio, pause/reprise sans chercher dans un MP3 Blob. Contexte et buffer libérés en quittant la partie. Les extraits du catalogue conservent leur lecteur HTTP. Trois tests supplémentaires couvrent retour arrière, fin réelle, pause pendant déverrouillage, interruptions et mute : total **46 tests**. Les traces restent actives pour valider le nouvel essai iPhone.

### Validation en direct et bouton du son

Les logs de production Safari iPhone du build mobile-3 confirment une lecture stable au-delà de 48 secondes, avec entrées tactiles et progression du score (707 points avant mise en pause puis redémarrage par le joueur). Aucune fin prématurée sur ce nouvel essai ; la sauvegarde d’une partie complète en D1 n’a pas encore été observée.

Le bouton du son est maintenant contrasté sur téléphone et ordinateur : cible 44 px, pictogramme 22 px, fond doré avec icône sombre lorsque le son est actif, fond marine opaque avec icône claire lorsqu’il est coupé. Les deux états ont été contrôlés dans le navigateur. Captures `design/previews/volume-mobile-on.png` et `volume-desktop-off.png`. Dernier déploiement incluant ce bouton : `fd7ae549-7850-4cb0-86f4-34672d90d6d4`.


## 22. Interface mobile et collection validée (24 octobre 2026)

L’utilisateur confirme que la lecture fonctionne désormais sur son iPhone Safari. Les modifications suivantes complètent mobile-3 :

- Retours de jeu : « Parfait ! », « Bien ! », « Mauvaise touche », « Trop tôt », « Trop tard », « Raté ! », relâchement anticipé et maintien réussi. Bandeau dédié, touches et ligne de frappe colorées ; calcul des points inchangé.
- Hauteur mobile basée sur `100dvh` : accueil, niveaux, partie, résultat, profil, classements et crédits sans défilement de page. Collection défilante. Profil réparti en trois panneaux, classements et crédits paginés. Contrôles navigateur à 320×568, 390×844 et 844×390 ; résultat atteint après une vraie partie locale complète. Guide PWA iOS étape 3 vérifié sans défilement à 320×568 ; paysage également vérifié.
- Icône maison dans l’en-tête à gauche, alignée avec le son (44 px).
- Après rejet du format liste horizontal, quatre maquettes imagegen ont été produites dans `design/concepts/catalog/` avec leurs prompts. L’utilisateur a choisi **03 — Affiches de nuit**, image de référence `03-affiches-de-nuit.png`. Implémentation avec les vrais titres, artistes et pochettes : cartes illustrées, dégradé sombre opaque sous les textes, contours dorés, favoris et casque doré pour les extraits. Deux colonnes sur mobile, trois sur tablette, quatre sur desktop. Cartes mobiles de 184–188 px minimum ; boutons tactiles de 44 px.
- Barre haute allégée, recherche et filtres conservés ; progression globale et défi quotidien déplacés en bas du catalogue. Icône aléatoire centrée (texte anonyme supprimé), liens Tous/Favoris/À découvrir en 13 px mobile et 14 px desktop.
- Aurores boréales animées dans le catalogue, étoiles filantes à trajectoire et intervalle aléatoires (première après 2–5 s, suivantes toutes les 7–19 s). Animations suspendues hors onglet, désactivées avec le réglage et la préférence de mouvement réduit ; aucune animation de fond pendant le jeu. Le Père Noël reste réservé à l’accueil avec son passage unique.
- Vérifications : 49 tests réussis ; écoute/arrêt, favori, filtrage et recherche testés via l’interface ; absence de débordement horizontal à 320/390/1280 px, réduction des animations vérifiée. Captures `catalog-immersive-mobile.png`, `catalog-immersive-desktop.png`, `game-feedback-mobile.png`.

Déploiement de cet ensemble terminé : `f7e1b8e8-e37f-4510-8826-f91de0b1dbdb` sur https://noel.promo.dev. Build/PWA et 49 tests réussis. Le bouton Actualiser recharge la nouvelle version sur les sessions déjà ouvertes. Aucun commit ni push Git demandé/effectué.

### Aurores rendues plus visibles

Après retour utilisateur (« pas l’impression qu’elles bougent »), remplacement des couches CSS très faibles du catalogue par `AuroraCurtains.vue` : trois rubans courbes vert/bleu/violet, déformation continue de leur forme et variation de luminosité. Canvas limité à 30 images/s et DPR 1,25 ; arrêt hors onglet et lorsque les animations sont réduites. Les cartes restent au-dessus. Contrôle visuel de deux états successifs (`aurora-motion-a.png`, `aurora-motion-b.png`), build et 49 tests réussis.
Déployé sur noel.promo.dev : `e32df87d-4525-47da-96e1-153f28be0088`.

## 23. Catalogue 100 titres, décor global et navigation (24 octobre 2026)

- Catalogue porté à **100 morceaux NCS / 300 partitions** : 50 nouveaux titres sélectionnés dans la même direction musicale, avec extraits continus de 90 secondes, attaques analysées et notes à maintenir. Exemples : Why We Lose, I Remember U, Destiny, Electricity, Geometry, Throne. Les 50 entrées précédentes restent strictement identiques (révisions et scores préservés).
- Pipeline d’extension : `tools/audio/expand_ncs.py`, `collect_ncs_covers.py`, puis `artifacts/catalog/venv/bin/python tools/audio/build_ncs.py --only-new` et `python3 tools/audio/activate_ncs.py`. Les originaux sont dans les artifacts ignorés. Catalogue, crédits, audios, pochettes et trois partitions par titre sont activés ensemble.
- Aurores canvas désormais présentes sur toutes les vues de l’application. En jeu, intensité réduite, neige et étoiles filantes actives. Les panneaux de préparation/pause sont translucides ; HUD et pistes masqués derrière le dialogue, ce qui laisse le décor visible. Réglage animations et préférence système toujours respectés.
- Retours « Parfait / Bien / Raté / Trop tôt / Trop tard » au centre exact de l’écran, animation d’apparition, couleurs et ondes sur la ligne de jeu. Sans interception des appuis.
- Navigation : flèche ronde dorée de 44 px en haut à gauche de la préparation/pause pour revenir au niveau ; même flèche dans l’en-tête de sélection pour revenir aux morceaux. Liens textuels remplacés.
- Validation : 49 tests réussis, incluant les 300 partitions et 100 empreintes audio distinctes ; build PWA réussi. Recherche, extrait et partie de Why We Lose essayés dans le navigateur. Centre du feedback mesuré à 381,5 px sur 763 px ; aucun scroll en jeu. Sélection contrôlée à 320×568 sans débordement. Captures `ready-aurora-back-mobile.png`, `game-feedback-centered-mobile.png`.

Déploiement de cette version terminé sur https://noel.promo.dev : `bd31ed5e-a148-4be6-9ab2-76855d8ac433` (304 assets mis à jour). Préparation également contrôlée à 320×568 : flèche visible, contenu et dialogue sans scroll.

## 24. Affichage iPhone et charge des animations (25 octobre 2026)

- Zones de sécurité iOS réservées une seule fois dans la coque mobile ; barre de navigation intégrée au flux, hauteur dynamique et décor couvrant le grand viewport. Ajustements appliqués aussi au catalogue, à la préparation et au jeu.
- Suppression de la métadonnée obsolète `apple-mobile-web-app-status-bar-style=black-translucent`. Le simulateur reproduisait après rotation un viewport raccourci de 62 px, avec une bande vide en bas. Une nouvelle installation sans cette métadonnée conserve la bonne géométrie après rotation. Une ancienne icône peut nécessiter suppression puis ajout depuis Safari pour actualiser ce réglage natif. Référence WebKit : https://www2.webkit.org/show_bug.cgi?id=317153 (commentaire 2).
- Décors plafonnés à 30 images/s, résolution des canvas réduite sur écran tactile ; étoiles filantes sans boucle active entre les passages. Pistes arrêtées pendant les overlays et jeu plafonné à 60 images/s. Les compteurs temporaires ont montré neige/boule à 30, aurores à 20 et visiteurs à 30 pendant leur passage ; compteurs retirés avant livraison.
- Validation dans le véritable simulateur Apple : iPhone 18 Pro Max, iOS 27.0, Safari et PWA installée, portrait/paysage/retour portrait ; lancement et reprise après pause de On & On fonctionnels. Captures dans `design/previews/iphone-pwa-safe-area-home.png` et `iphone-pwa-safe-area-game.png`. 49 tests réussis et build PWA réussi.
- Limite : le simulateur ne mesure pas la température ni la consommation réelle d’un iPhone. Ces changements limitent le travail graphique inutile ; ils ne garantissent pas une absence de chauffe sur appareil physique.

Déployé sur https://noel.promo.dev : `27bbd15e-9858-408a-b256-f2c09277224c` (6 assets mis à jour).

## 25. Retrait du bouton diagnostic (25 octobre 2026)

Bouton « Télécharger le diagnostic » retiré des préférences et de l’écran d’erreur audio, imports inutilisés nettoyés. Journalisation interne conservée. Build PWA réussi ; déployé sur noel.promo.dev : `6adc4d7a-2513-4ea2-9028-2e73d3564121`.


## 26. Connexion native, profils, dotations et icône promoTiles — 25 octobre 2026

- Cloudflare Access « PromoTiles Noël » retiré après confirmation ; Worker et D1 conservés. Connexion native réservée au domaine exact `@promo.dev`, OTP 6 chiffres, 10 minutes, 5 essais, limitation des envois et cookie HttpOnly Secure de 7 jours. Secret `AUTH_PEPPER` géré par Wrangler, jamais dans Git.
- Le compte de test demandé a été supprimé avant la bascule. Ne pas supprimer un nouveau compte créé ensuite par l’utilisateur.
- Pseudo obligatoire unique avec normalisation de casse/accents/espaces et contrainte D1 ; 20 avatars de Noël diversifiés générés, sélection obligatoire, modification dans le profil, affichage au classement et dans la navigation.
- Anti-triche uniquement serveur : score recalculé, consommation atomique, contrôle de durée/propriété/révision, détection de rejeu exact et fréquence d’entrée incohérente. Les timings artificiellement exacts sont signalés sans sanction automatique. Aucun changement aux règles ou au design du gameplay ; aucune garantie absolue contre les bots.
- Navigation : nouvelle icône cadeau « Dotations », vue bleu nuit/or avec trois dotations explicitement fictives (casque, enceinte, coffret gourmand).
- PWA nommée `promoTiles`, icône sapin-piano/boule de Noël, tailles iOS/Android et variante maskable. Source générée conservée dans `design/promotiles-app-icon.png`.
- E-mail de code habillé bleu nuit/or, illustration de l’application, code sélectionnable, version texte ; template `worker/login-email.js`. Réception du test de livraison confirmée par Hervé le 25/10. L’ancien test avait seulement été accepté/mis en file : ne pas confondre acceptation et réception.
- `npm run dev` utilise `server/native.mjs`, même Worker avec SQLite local, codes écrits uniquement dans `data/dev-auth-email.json`. Les mails locaux ne partent pas.
- Migrations `0002_native_auth.sql` et `0003_avatars_anticheat.sql` appliquées à D1 distante. Version déployée `7533adb3-cfe6-43a6-b285-4f81de426807`.
- Vérifications : 52 tests réussis, intégration Miniflare/D1 réussie, build PWA ; login local, collision pseudo, sélection/persistance avatar, partie démarrée puis mise en pause. Dotations contrôlées à 1280×720, 390×844 et 320×568 sans débordement. Pas de nouvelle mesure thermique sur appareil physique pour ces ajouts.
- Production : shell, manifeste, icônes et avatars HTTP 200 ; API privée et musique sans session HTTP 401. Le manifeste expose bien `promoTiles`. Captures : `design/previews/christmas-avatars-mobile.png`, `prizes-mobile.png`, `login-email-mobile.png` (code fictif d’aperçu).
- Le dossier préexistant `macos/Eveil/` concerne EasyWake et est indépendant du jeu ; ne pas l’inclure dans le commit PromoTiles.
