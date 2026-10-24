# Promodev · Piano Challenge

Prototype mobile Vue 3 du concours musical de Noël. L’accueil reprend la direction « Nuit polaire » avec un globe photoréaliste animé en 2,5D, de la neige, des reflets et des aurores boréales.

**Reprise sur un autre Mac : lire [REPRISE.md](REPRISE.md), le dossier complet de contexte, architecture, commandes, audits et prochaines étapes.**

## Lancer le projet

Prérequis : Node.js 22.12 ou version ultérieure compatible avec Vite 8.

```sh
npm ci
npm run dev
```

Ouvrez l’adresse locale affichée dans le terminal. Pour contrôler la PWA et le cache hors connexion, utilisez la version de production :

```sh
npm run build
npm run preview
```

Le service worker conserve les images, les polices, les partitions et le MP3 après sa première installation complète. Le serveur de développement ne teste pas ce cache.

## Jouer

Choisissez un niveau puis lancez la musique. Appuyez sur les quatre touches du bas lorsque le bord inférieur d’une note atteint la ligne dorée. Sur ordinateur, utilisez **D, F, J et K**. Maintenez les notes longues jusqu’à leur fin. La barre espace met en pause ; la reprise revient deux secondes en arrière avec un compte à rebours.

Le morceau fourni, « Dans les yeux d’Émilie » de Joe Dassin, dure 3 min 42. Les trois partitions contiennent 216, 415 et 701 notes. Les plafonds sont de 1 500, 2 250 et 3 000 points. Le coefficient du morceau est de 1,5 et les coefficients des niveaux sont de 1, 1,5 et 2.

Le score combine la précision (90 %) et le meilleur combo (10 %), avec une pénalité pour les appuis hors rythme. Le moteur empêche de compter deux fois une note. Les parties interrompues ne sont pas enregistrées.

Les réglages du profil permettent de couper la musique et de réduire les animations. L’application respecte également la préférence de mouvement réduit du système.

## Vérifier

```sh
npm test
npm run build
```

Les tests vérifient les plafonds des trois partitions réelles, les notes simultanées, les appuis longs, les erreurs de rythme, la reprise et la conservation des records.

Les captures de contrôle retenues et versionnées se trouvent dans `design/previews/`. Les sorties temporaires restent dans `artifacts/`, ignoré par Git. Les maquettes approuvées et les prompts des images sont dans `design/`. Les scripts de transcription et de création des partitions sont dans `tools/audio/`.

## Hébergement et concours

`wrangler.jsonc` prépare la distribution statique de `dist/` sur Cloudflare Workers. `npm run deploy:check` compile le projet puis valide un déploiement à blanc. Ce contrôle a réussi ; aucun déploiement public n’a été effectué. `npm run deploy` permet ensuite de publier avec un compte Cloudflare configuré.

Cette version conserve les scores sur l’appareil. L’authentification des collègues, l’API de concours, MongoDB et le classement partagé restent à intégrer avant l’ouverture du concours. Le catalogue contient le seul MP3 fourni. Les partitions résultent d’une transcription automatique : leur qualité musicale doit encore être validée par une écoute et des essais humains sur téléphone.

Le globe utilise une image transparente, des particules Canvas et des animations CSS. L’ancienne étude en géométrie Three.js est conservée dans `design/source/`.

## Audits du prototype

Les quatre évaluations indépendantes sont conservées dans `design/reviews/` : fidélité graphique 9,6/10, animations de la home 9/10, fonctionnalités locales 9,5/10 et fun/jouabilité 7,5/10. Ces notes restent distinctes de l’objectif demandé de 10/10 partout.

Une partie complète hors connexion a été testée dans Safari après arrêt du serveur, jusqu’au résultat et à la persistance du record après rechargement. La home a été contrôlée en 320 × 568, 390 × 844 et 1280 × 900. Le rapport d’animation consigne une médiane de 17 ms et un p95 de 18 ms sur Mac. Un essai sur téléphone physique reste nécessaire.
