# Audit fonctionnel — Promodev Piano Challenge

Date : 24 octobre 2026. Périmètre : prototype local avec le morceau fourni, trois niveaux, scores et préférences sur l’appareil. Auditeur : agent fonctionnalités.

**Note définitive pour ce passage : 9,5/10.** Les contrôles du moteur sont concluants, les défauts trouvés ont été corrigés et un parcours complet hors ligne a été validé dans Safari. La validation sur téléphone physique reste absente. Cette note ne certifie ni un concours connecté, ni une validation sur tous les téléphones.

## Vérifications réalisées

Lecture des sources Vue, du moteur de notes, des trois partitions réelles, de la persistance, du manifeste et du service worker. Aucun navigateur n’a été piloté par cet auditeur ; les preuves Safari ci-dessous proviennent de l’agent principal.

`npm test` : **22 tests réussis, zéro échec**, lors du dernier passage.

- Parties parfaites sur les partitions réelles : facile 1 500, normal 2 250, difficile 3 000 points.
- Note la plus proche, colonne correcte, doubles touches, absence de double comptage, pénalisation des entrées erronées et anti-spam.
- Ratés comptés une seule fois ; interruptions et maximum du combo.
- Notes tenues complètes, relâchement anticipé, annulation immédiate et pressions répétées.
- Rewind et rejeu sans cumul indu ; retour avant une note tenue traversant la position de reprise.
- Remise à zéro complète d’une partie.
- Stockage absent, JSON corrompu, données non conformes, quota/refus et getter localStorage levant une exception.
- Conservation des records de chaque niveau après 80 parties moins bonnes ; séparation par morceau ; choix du dernier résultat en cas d’égalité.
- Présence de l’identifiant du morceau dans le résultat.

Le build de production a réussi. Son service worker précache 27 ressources, environ 6,51 Mo, dont le MP3 complet. Le seuil par ressource est de 8 Mo. `RangeRequestsPlugin` s’applique au précache afin de fournir les réponses partielles audio ; la mise à jour reste déclenchée par l’utilisateur.

## Preuves Safari rapportées par l’agent principal

- Sélection du mode facile, compte à rebours de trois secondes, progression du lecteur et indicateur audio Safari.
- Une entrée clavier a produit le retour « Bien joué » ; pause avec la barre espace réussie.
- Serveur de prévisualisation du port 5174 arrêté et indisponibilité confirmée par curl, code de sortie 7.
- Reprise avec décompte, progression de la musique de 3:13 à 2:56 malgré l’arrêt du serveur.
- Rechargement complet par Cmd-R : accueil chargé depuis la PWA avec serveur toujours arrêté.

L’agent jouabilité a ensuite validé, avec le serveur toujours arrêté, une nouvelle partie complète de 3 min 42 : entrée clavier « Parfait », pause/reprise, arrivée au résultat (1 point, 1 note parfaite, combo 1), classement facile à 1 point, puis rechargement de l’accueil conservant le record à 1 point. L’agent principal a relayé ces résultats à cet auditeur.

Cela valide le parcours local complet, la persistance et le rechargement sans serveur après installation du cache. Ce n’est pas une preuve d’un premier accès hors ligne sans téléchargement préalable, ni d’une partie complète réussie à plusieurs doigts sur téléphone.

## Corrections vérifiées

Le record personnel n’est plus perdu après 50 parties. Les données locales sont validées avant usage par Vue. L’extrait respecte désormais le réglage du son. L’enregistrement du profil distingue succès et échec. La préférence système de réduction des mouvements est réactive. Les états de pause, chargement et erreur audio sont présents ; le temps du jeu suit l’horloge du lecteur, avec préroulement permettant de voir la première note à 0,266 seconde. Après le test complet, l’agent principal a également dégagé les actions de l’écran de résultat en retirant sa navigation basse et évité l’affichage trompeur « 0 % » lorsqu’une précision positive est inférieure à 1 %.

## Dernière régression corrigée

Le risque de double démarrage concurrent de l’extrait est corrigé par un état de chargement et un identifiant de requête. L’auditeur a exécuté les fonctions réelles extraites de `App.vue` avec un lecteur simulé à promesses différées : démarrage, annulation, nouveau démarrage, résolution de l’ancienne promesse puis de la nouvelle. L’ancienne promesse ne coupe plus la nouvelle lecture et les états restent cohérents. L’arrêt et le blocage lorsque le son est coupé ont également réussi. Ce contrôle complémentaire ne nécessite aucun changement du code UI.

## Limites explicites

- Pas de validation personnelle sur iPhone/Android physique, multitouch matériel, verrouillage d’écran ou installation depuis l’écran d’accueil.
- Aucune mesure de latence Bluetooth ou calibration audio ; la fidélité musicale de la transcription automatique reste un sujet de jouabilité.
- La gestion de plusieurs morceaux conserve déjà des records distincts, mais l’interface n’en propose qu’un réellement jouable.
- Les données restent locales. Aucun classement partagé, authentification de collègues, MongoDB connecté ou validation de score côté serveur n’est livré dans ce périmètre.
- L’arrêt du serveur est une bonne preuve hors ligne locale ; un déploiement Cloudflare public n’a pas été testé par cet auditeur.

La note ne doit pas être arrondie à 10 pour satisfaire la cible demandée. Le demi-point restant reflète l’absence de validation du parcours mobile réel, notamment multitouch, interruption système et installation sur téléphone physique. La qualité du ressenti musical et le fun relèvent de l’audit jouabilité distinct.
