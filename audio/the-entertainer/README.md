# The Entertainer — démo jouable

Extrait d'environ 63 secondes : introduction et thème A répété, cadence finale prolongée en do, sans l'anacrouse du thème B. Tempo de la partition : 72 noires/minute. Piano GeneralUser GS, accompagnement atténué pour faire ressortir la mélodie. Aucun enregistrement commercial n'est utilisé.

## Sources

- Scott Joplin, *The Entertainer* (1902). Partition et MIDI du [Mutopia Project](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=263), transcription Chris Sawer, révision Simon Albrecht. Domaine public indiqué dans la source LilyPond conservée ici.
- [GeneralUser GS 2.0.3](https://github.com/mrbumpy409/GeneralUser-GS), S. Christian Collins. Licence originale conservée dans `source/GeneralUser-GS-LICENSE.txt`. Les conditions permettent la création de musique. La banque SF2 reste un outil local de rendu, non embarqué dans le site.
- Provenance et empreintes de la banque / du MP3 : `public/music/the-entertainer/credits.json`.

## Reproduction

Dépendances utilisées : Python avec mido 1.3.3, FluidSynth 2.6.1 et ffmpeg. Télécharger la banque depuis le dépôt officiel GeneralUser GS, puis :

```sh
artifacts/audio-tools/venv/bin/python tools/audio/build_entertainer.py artifacts/audio-tools/GeneralUser-GS.sf2
```

Le générateur produit `performance.mid`, `piano.mp3` et les trois charts. Il conserve un temps d'entrée, rend le MIDI sans couper le début du son, puis mesure la durée décodée. Le fichier MIDI est la référence commune de toutes les attaques audio et des tiles. Première attaque mesurée dans le MP3 : ~0,835 s ; tile : 0,833333 s (écart ~2 ms, avant latence du périphérique audio).

- Facile : 93 attaques de mélodie, ancrages de croches et syncopes longues.
- Normal : 175 attaques de mélodie, une tile par attaque de la voix supérieure (introduction passant à la main gauche prise en compte).
- Difficile : 227 attaques, ajout de basses sur les croches libres. Pas d'accords simultanés à presser.
- Correspondance stable hauteur/classe de note → colonne : les phrases répétées gardent les mêmes gestes. Les accords de piano comptent pour une seule tile de mélodie en normal.

Les tests confrontent chaque tile aux attaques du MIDI livré, vérifient l'empreinte du MP3, les timings, la possibilité d'obtenir le score maximal et la séparation des records. Le ressenti musical reste à valider par des joueurs ; les périphériques Bluetooth peuvent avoir leur propre latence.
