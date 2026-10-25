# Cloudflare — PromoTiles Noël

## Installation active

- URL : https://noel.promo.dev
- Worker : `promodev-piano-challenge`
- Compte : `d5d57d15751e093b840fcd28077f1f1f`
- D1 : `promotiles-noel`, ID `945b3c06-a680-4259-979c-3ffc2dd03e53`, créée avec juridiction UE
- Connexion native : code e-mail à usage unique, domaine exact `@promo.dev`.
- Expéditeur : `connexion@noel.promo.dev`, Cloudflare Email Sending, DNS DKIM/SPF/DMARC configurés.
- L’ancienne application Access « PromoTiles Noël » a été supprimée après confirmation utilisateur.
- Les URLs workers.dev et les previews sont désactivées. Le shell de connexion et les illustrations sont publics ; les médias et API du jeu requièrent une session.

`wrangler.jsonc` ne contient aucun secret. `AUTH_PEPPER` est un secret Worker. Ne pas le régénérer lors d’un déploiement normal. Les codes expirent après 10 minutes et cinq essais ; envoi limité par adresse et IP. Les sessions durent sept jours, sont révoquées à la déconnexion et utilisent un cookie `__Host-`, HttpOnly, Secure, SameSite=Strict. La base conserve uniquement les empreintes des codes et sessions. Les anciennes variables Access restent disponibles pour le code de compatibilité, mais sont inactives avec `AUTH_MODE=native`.

## Base et scores

La migration `0001_players_scores.sql` crée les joueurs, parties, performances, meilleurs scores et limites de débit. E-mail normalisé unique, insensible à la casse. Le pseudo obligatoire reste modifiable et possède une clé normalisée unique (casse, accents et espaces) ; l’adresse provient exclusivement de l’identité vérifiée. Les anciens profils anonymes SQLite locaux ne sont pas fusionnés avec des adresses inconnues.

Le Worker recalcule le score depuis le journal de gestes et la partition de référence. Une insertion et son trigger consomment la partie et actualisent le record atomiquement ; une double soumission est rejetée. Cette validation ne constitue pas une protection absolue contre des journaux fabriqués. Le classement ne publie pas les e-mails.

```sh
npx wrangler whoami
npm run db:migrate:remote
npm test
npm run test:cloudflare
npm run deploy
```

Le test D1 d’intégration utilise le runtime Miniflare/workerd, sans modifier la base distante. Le serveur local `npm run dev` exécute le même Worker avec un adaptateur SQLite. Il écrit les mails dans `data/dev-auth-email.json` (ignoré par Git) sans les envoyer. Le secret local est renouvelé au redémarrage. `cf:dev` nécessite les bindings et secrets de connexion natifs.

## PWA

Guide d’installation coulissant dans Profil → Application, avec trois étapes adaptées à iOS, Android et ordinateur. iOS utilise Safari puis Partager et Sur l’écran d’accueil. Le manifeste inclut `crossorigin="use-credentials"` pour les ressources protégées. Les routes `/api/` et `/cdn-cgi/` sont exclues du fallback de navigation hors ligne. Les médias sont mis en cache après consultation ; connexion nécessaire pour le classement et le chargement d’un nouveau titre. Une page de connexion HTML redirigée ne doit pas entrer dans le cache musical.

Après une mise à jour, recharger puis accepter **Actualiser** hors partie. La mise à jour n’interrompt jamais automatiquement un jeu en cours.

## Diagnostic mobile — build 2026-10-24-mobile-3

Logs structurés `[PromoTiles]` dans la console et journal local limité à 240 événements. Le bouton d’export a été retiré à la demande utilisateur ; les traces techniques restent disponibles. L’export ajoute l’agent utilisateur du navigateur ; aucun e-mail, cookie ou jeton n’est journalisé par le code de diagnostic.

En production, des lots de 40 événements maximum sont envoyés à `/api/diagnostics` derrière la session native et les limites de débit. Le Worker filtre les champs autorisés, puis les écrit dans Workers Logs. Pas de journal des touches individuelles : compteurs et état audio toutes les cinq secondes, transitions et erreurs seulement. Les événements incluent identifiant aléatoire de session de diagnostic, version, titre, niveau, taille téléchargée, intégrité SHA-256, durée attendue/réelle, temps audio, readyState, réseau, seeking, ended, interruptions, création de partie et sauvegarde.

```sh
npx wrangler tail --format pretty
```

Ou Workers & Pages → promodev-piano-challenge → Observability. Rechercher `client.diagnostics`, `audio.failure`, `assets.failed`, `request.failed`, `round.created`, `score.saved`.

Le signalement utilisateur concerne Safari iPhone : une partie se terminait immédiatement. La version de diagnostic refuse une durée audio incohérente, un saut temporel invraisemblable et un événement `ended` prématuré ; elle ne sauvegarde pas de résultat dans ces cas. Le hash MP3 est vérifié avant le démarrage. Les traces réelles ont confirmé que le MP3 était intact (SHA-256 correct), puis que Safari ramenait sa durée de 91,298 s à 0,000177792 s après la séquence play/pause/seek du Blob. Le build mobile-3 remplace ce lecteur par Web Audio : décodage en mémoire, déverrouillage AudioContext au toucher, horloge audio pour le gameplay, sources renouvelées à chaque reprise. Une interruption du contexte met la partie en pause. Les logs de production ont ensuite confirmé plus de 48 secondes de jeu sur Safari iPhone avec progression des scores et aucune fin prématurée, avant une pause et un redémarrage du joueur. La sauvegarde distante d’une partie complète reste à observer.

## Profils, avatars et anti-triche

`0002_native_auth.sql` ajoute pseudo unique, codes et sessions. `0003_avatars_anticheat.sql` ajoute l’avatar, les empreintes des performances et le journal anti-triche. Les 20 identifiants d’avatar admis sont définis dans `src/lib/avatars.js` ; le serveur rejette les autres valeurs. Les portraits sont fournis en WebP 256 px.

L’anti-triche conserve le gameplay et les fenêtres de jugement. Il recalcule les scores côté serveur, valide la propriété, la durée et la consommation atomique de la partie, rejette un journal long exactement réutilisé et les fréquences d’entrée incohérentes. Des timings systématiquement parfaits génèrent un signal pour examen, sans sanction automatique. Des entrées fabriquées mais plausibles restent possibles : aucune garantie absolue contre les bots.

## Nom et icône PWA

Nom et nom court : `promoTiles`. Icônes PNG 64, 180, 192 et 512 px, plus une variante Android maskable avec marge de sécurité. Sur iOS, une installation existante peut nécessiter d’être retirée de l’écran d’accueil puis ajoutée à nouveau pour actualiser l’icône et le nom.
