# Audit des animations

Agent indépendant : review_animation. Note : 9/10 pour la home, Safari 390 × 844 sur Mac.

Sur environ 100 secondes et 5 538 frames, passage en onglet masqué inclus : médiane 17 ms, p95 18 ms, une frame supérieure à 34 ms. Le tourbillon au clic, la suspension en arrière-plan et la reprise sont vérifiés. En mouvement réduit, la transformation revient à zéro et l’empreinte pixel de la neige reste identique pendant plusieurs secondes, même après clic.

Le globe mesure 354 × 354 et ne se déforme pas. La scène combine image, neige Canvas, reflets CSS et parallaxe de 3 px. Le sapin reste illustré : aucune sculpture 3D indépendante ne tourne à l’intérieur. Les performances sur téléphone physique et les animations du jeu n’ont pas été mesurées par cet auditeur.

Captures : `design/previews/animation-cadence-mobile.png`, `design/previews/animation-reduced-mobile.png`. L’instrumentation temporaire est retirée de l’application et conservée dans `design/source/dev-animation-audit.js`.
