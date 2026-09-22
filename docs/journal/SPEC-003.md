# Journal · SPEC-003 · Chercher une place sur la page d'accueil

## 22/09/2026 — la liste des places se cherche et se feuillette

`GET /listing` ne rend plus toutes les annonces d'un coup.

- **Chercher un lieu.** `?place=nice` ne garde que les annonces dont l'adresse porte ce texte, sans
  tenir compte de la casse ni des accents : `nice`, `NICE` et `Nice` trouvent la même chose, et
  `malaussena` trouve « 3 avenue Malausséna ».
- **Chercher une période.** `?from=2026-10-05&to=2026-10-07` ne garde que les annonces dont la
  disponibilité couvre entièrement ces deux jours, bornes comprises. Une annonce qui ouvre le 10
  octobre ou qui ferme le 6 n'apparaît pas.
- **Feuilleter.** La liste est rendue par pages de 20 annonces, 100 au plus si `?size=` en demande
  davantage. `?page=2` donne la tranche suivante. La réponse dit toujours combien il y en a en tout :
  `{ "listings": [...], "total": 25, "page": 1, "size": 20 }`.

**Ce que cette version ne fait pas.** Une place déjà louée sur les dates demandées apparaît quand même
dans la liste : l'écarter demande de croiser les demandes confirmées, et personne n'a encore tranché ce
qu'une place partiellement libre doit afficher. Il n'y a pas non plus de tri autre que la date de
publication, ni de recherche par prix, par distance ou sur une carte.
