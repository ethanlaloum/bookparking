---
id: SPEC-008
titre: Accepter les conditions d'utilisation en cochant une case à l'inscription
slug: accepter-les-conditions
statut: valide
revision: 1
derive_de: null
amont: absent
langue: fr
valide_le: 2026-09-24
valide_par: JP
apps: [api, front, mobile, e2e]
code_sha: { api: ef7ed75, front: ef7ed75, mobile: ef7ed75, e2e: ef7ed75 }
ux: absent
regles: 1
exemples: 5
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-008 · Accepter les conditions d'utilisation en cochant une case à l'inscription

## 1. Sujet

Pour l'exploitant, qu'aucun compte n'existe sans que son titulaire ait coché « J'accepte les conditions d'utilisation », et pouvoir dire quand il l'a fait.

Demande de JP le 24/09/2026 : « je veux que l'utilisateur coche une case pour créer son compte et accepter les conditions générales ». Jusqu'ici, une phrase sous le bouton disait qu'une inscription valait acceptation.

Discrétion de Claude, à relire par JP : l'api refuse elle aussi une inscription sans acceptation, et note sur le compte l'instant de l'acceptation (Q-01). La page « Données personnelles » reste une information, pas une case à cocher (Q-02).

## 2. Périmètre

**Dedans.** La case à cocher du site et de l'app, son refus quand elle ne l'est pas, le refus par l'api, et l'instant d'acceptation noté sur le compte.

**Dehors.** Les versions des conditions et leur réacceptation quand elles changent. Les comptes existants : leur instant d'acceptation reste inconnu (`null`).

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Conditions d'utilisation | la page `/conditions-d-utilisation` du site. Jamais « CGU » à l'écran. |
| Acceptation | la case cochée à l'inscription ; notée sur le compte par son instant. |

## 4. Règles et exemples

Valeurs canoniques : `Marc D.`, `marc.d@example.com`, `Barla2026!`, inscrit le `01/10/2026 à 09:00` ; horloge `Europe/Paris`.

### RG-01 · un compte ne se crée qu'en acceptant les conditions d'utilisation ; l'instant de l'acceptation est noté sur le compte

#### EX-01 · l'inscription acceptée note l'instant d'acceptation

Quand `Marc D.` s'inscrit le `01/10/2026 à 09:00` en acceptant les conditions
Alors son compte porte une acceptation au `01/10/2026 à 09:00`

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"54e3133f"} -->

#### EX-02 · sans acceptation, l'api refuse l'inscription

Quand `Marc D.` s'inscrit sans accepter les conditions
Alors l'inscription est refusée avec `TermsNotAcceptedError`
Et aucun compte n'est créé, aucun e-mail n'est en file

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"5227212d"} -->

#### EX-03 · l'instant d'acceptation est écrit en base

Quand le compte de `Marc D.`, accepté le `01/10/2026 à 09:00`, est écrit
Alors la ligne de `accounts` porte `terms_accepted_at` au `01/10/2026 à 09:00`

<!-- jp-way:ex {"id":"EX-03","regle":"RG-01","origine":"mapping","barreau":"int-repo","empreinte":"96917691"} -->

#### EX-04 · une inscription qui ne dit rien des conditions est refusée

Quand `POST /account` ne porte pas `acceptsTerms`
Alors la réponse est `400`, et aucun compte n'est inscrit

<!-- jp-way:ex {"id":"EX-04","regle":"RG-01","origine":"sonde","barreau":"int-http","empreinte":"552cf20b"} -->

#### EX-05 · l'écran refuse de créer le compte tant que la case n'est pas cochée

Quand une personne remplit « Créer un compte » sans cocher « J'accepte les conditions d'utilisation » et envoie
Alors l'écran dit « Cochez la case pour accepter les conditions d'utilisation. »
Et elle reste sur « Créer un compte », sans être connectée

<!-- jp-way:ex {"id":"EX-05","regle":"RG-01","origine":"mapping","barreau":"e2e","empreinte":"311dda74"} -->

## 5. Sonde de couverture

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | écarté¹ | EX-04 | EX-01 EX-03 | écarté² | écarté³ | EX-02 | écarté⁴ | écarté⁵ | filet⁶ | EX-05 |

¹ cochée ou non, sans borne.
² l'acceptation s'écrit avec le compte, dans la même insertion.
³ l'inscription est ouverte à tous.
⁴ aucun montant.
⁵ une acceptation par compte.
⁶ l'acceptation fait partie de l'écriture du compte : elle échoue ou réussit avec elle (SPEC-006 EX-05).

## 6. Écrans

- **« Créer un compte » (site et app).** Au-dessus du bouton, une case « J'accepte les <conditions d'utilisation> », le lien ouvrant la page. En dessous, la phrase d'information « Vos données sont traitées comme l'explique la page Données personnelles. » Envoyer sans cocher affiche « Cochez la case pour accepter les conditions d'utilisation. »

## 7. Questions

#### Q-01 · l'api doit-elle vérifier et noter l'acceptation ?

Statut : résolue — discrétion de Claude, à relire par JP : oui. Une case que seul l'écran vérifie ne prouve rien : n'importe quel client de l'api s'en passerait. L'instant noté sur le compte est la preuve.

#### Q-02 · faut-il aussi cocher la politique de données personnelles ?

Statut : résolue — discrétion de Claude, à relire par JP : non. Le compte n'est pas traité sur la base d'un consentement ; la page s'informe, elle ne s'accepte pas. La lier à la case la ferait passer pour un consentement.

## 8. Contraintes non fonctionnelles

- **Conformité.** `accounts.terms_accepted_at` est conservé avec le compte ; son effacement suit celui du compte (SPEC-003).
- **Langue.** `fr` et `en-US`.

## 9. Impacts par app

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | une migration (`terms_accepted_at`), `Account`, `RegisterAccount`, le schéma de `POST /account`. | les autres routes. |
| front | la case, son refus, `openapi.json` et ses types. | le reste de l'inscription. |
| mobile | la case de l'écran d'inscription. | le reste. |
| e2e | le parcours d'inscription coche la case ; un parcours sans case. | les autres parcours. |

## 10. Hors sujet

- **Les versions des conditions et leur réacceptation.**

## 11. Risques

- **Les comptes d'avant cette spec n'ont pas d'instant d'acceptation.** · Parade : leur faire accepter les conditions à la prochaine connexion, dans une spec à venir. · Gravité : faible.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 24/09/2026 | Création, à la demande de JP. |
