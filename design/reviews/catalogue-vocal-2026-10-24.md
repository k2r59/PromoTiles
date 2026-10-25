# Audit du catalogue vocal — 24 octobre 2026

Le retour utilisateur « trop répétitif » désignait la musique de l’ancien catalogue instrumental. Remplacement par 50 chansons chantées NCS, chacune en version de jeu de 90 secondes, avec pochettes, extraits et trois niveaux. Après écoute de Make Me Move, On & On et Royalty dans Arc, retour explicite : **« Oui, nettement mieux »**. Cette validation porte sur la direction musicale, pas sur une partie complète de chaque titre.

## Notes des quatre agents indépendants

| Audit | Note | Portée et réserve |
|---|---:|---|
| Design | 9,4/10 | Aucun défaut visuel bloquant observé ; états de maintien actif et réussite humaine non observés. |
| UX/UI | 9,5/10 | Parcours, paysage et hors connexion vérifiés ; maintien simultané sur téléphone physique non testé. |
| Fonctionnement | 10/10 | Scénarios audités réussis ; ce n’est pas une certification de tous les appareils. |
| Fun | 9,5/10 | Nouvelle direction musicale appréciée ; retour ciblé sur trois extraits. |
| Total | **38,4/40** | L’objectif 40/40 n’est pas atteint. |

## Preuves

- 36 tests passent et compilation de production réussie.
- 150 partitions : 29 432 notes, dont 1 656 maintiens. Attaques reliées aux instants mesurés dans les enregistrements.
- Audit du tempo : deux portions indépendantes de chaque morceau retrouvent la même pulsation à environ 0,1 BPM près. Tempo et tenues restent des estimations automatiques.
- 300 simulations de jeu réussies, exactes ou avec variation de ±40 ms. Aucun conflit de piste ou double maintien ; les trois difficultés restent distinctes.
- 150 scénarios de pause/reprise soumis à l’API : résultat local identique au résultat recalculé par le serveur.
- Production sur port 5176 avec base QA séparée : chargement de Make Me Move, arrêt du serveur, rechargement PWA, partie complète hors connexion, pause/reprise, résultat local affiché. Message final : « Record conservé sur cet appareil. Classement partagé indisponible pour cette partie. »
- Royalty absent du cache, serveur arrêté : erreur explicite et retour à la sélection fonctionnel. Le catalogue entier n’est pas garanti hors connexion.
- Paysage 844 × 390 : aucun débordement, quatre touches d’au moins 44px. À 390 × 844 les trois niveaux sont visibles au-dessus du bouton fixe. À 320 × 568 le niveau difficile et le lancement restent accessibles par défilement.
- Catalogue desktop 1280 × 900 : boutons d’extrait de la première rangée entièrement visibles (bas à 890px).

Captures : `design/previews/catalog-vocal-*.png`, `select-vocal-*.png`, `game-vocal-*.png`, `result-vocal-*.png`, `ready-vocal-320.png`, `offline-uncached-error.png`.

## Limites restantes

La validation physique multitactile et des sessions humaines complètes est encore nécessaire pour étayer les derniers points. Aucun audit automatique ne transforme ces preuves en garantie « triple A ». Aucune note n’a été arrondie à 10 pour atteindre artificiellement 40.

Les médias NCS servent à cette évaluation locale interne. Ils sont ignorés par Git, avec sources et procédure de reconstruction documentées. Aucune licence de distribution dans un jeu n’est acquise ; aucun déploiement public réalisé.
