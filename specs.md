# Spécifications — Application Mariage Laetitia & Alexandre
> 8 mai 2027 — Domaine de la Scie du May, Doizieux (42740)

---

## 1. Vue d'ensemble

Application web SPA (Single Page Application) sans framework, permettant aux invités de confirmer leur présence, d'accéder aux informations logistiques et d'organiser leur covoiturage. Les mariés disposent d'un espace d'administration protégé par mot de passe.

**Stack technique**
- HTML / CSS / JavaScript ES Modules (vanilla, sans bundler)
- Routeur hash-based maison (`#/`, `#/rsvp`, etc.)
- Base de données cloud : Supabase (PostgreSQL REST API)
- Carte interactive : Leaflet.js + OpenStreetMap
- Hébergement : GitHub Pages
- Polices : Cormorant Garamond (titres) + Outfit (corps)

---

## 2. Architecture des fichiers

```
/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js                  # Point d'entrée, init async, routeur
    ├── store.js                # Persistance Supabase (toutes les méthodes async)
    ├── utils/
    │   ├── router.js           # Routeur hash SPA
    │   └── animations.js       # Utilitaires d'animation
    └── components/
        ├── hero.js             # Page d'accueil, particules, parallaxe
        ├── rsvp.js             # Formulaire multi-étapes (5 étapes)
        ├── map.js              # Carte Leaflet + liste hébergements triée par distance GPS
        ├── carpool.js          # Affichage offres/demandes covoiturage
        ├── guestProfile.js     # Espace personnel invité
        ├── adminDashboard.js   # Tableau de bord mariés
        ├── infoHub.js          # Page hub "Infos pratiques" (6 cubes)
        ├── howToGet.js         # Page "Comment venir ?" (église + domaine + train)
        └── infoPages.js        # Sous-pages : Messe, Animations, Contacts, Liste
```

---

## 3. Navigation & Routes SPA

### Barre de navigation
```
Accueil | Infos pratiques ▾ | RSVP | Comment venir ? | Hébergements | Covoiturage | Liste de mariage | Espace mariés
```

**"Infos pratiques"** est un menu déroulant :
- Desktop : hover → sous-menu visible
- Mobile : tap → sous-menu en liste déroulante (fond opaque), tap ailleurs → ferme

Sous-menu :
```
→ 💒 Messe & Réception      (#/infos/messe)
→ 🎤 Animations & Discours  (#/infos/animations)
→ ✉️ Contacts utiles        (#/infos/contacts)
```

### Table des routes

| Hash | Page | Composant |
|---|---|---|
| `#/` | Accueil | `hero.js` |
| `#/infos` | Hub informations pratiques (6 cubes) | `infoHub.js` |
| `#/infos/messe` | Messe & Réception | `infoPages.js` |
| `#/infos/animations` | Animations & Discours | `infoPages.js` |
| `#/infos/contacts` | Contacts utiles | `infoPages.js` |
| `#/rsvp` | Formulaire RSVP | `rsvp.js` |
| `#/comment-venir` | Comment venir ? | `howToGet.js` |
| `#/hebergements` | Carte + liste hébergements | `map.js` |
| `#/covoiturage` | Offres et demandes | `carpool.js` |
| `#/liste` | Liste de mariage | `infoPages.js` |
| `#/mes-reponses` | Profil invité | `guestProfile.js` |
| `#/admin` | Login mariés | `adminDashboard.js` |
| `#/admin/dashboard` | Tableau de bord | `adminDashboard.js` |

---

## 4. Page "Infos pratiques" — Hub (6 cubes)

Grille 3×2 sur desktop, 2×3 sur mobile (jamais 1 colonne), cubes carrés :

| # | Icône | Titre | Destination |
|---|---|---|---|
| 1 | 💒 | Messe & Réception | `#/infos/messe` |
| 2 | 🛌 | Où dormir ? | `#/hebergements` |
| 3 | 🚗 | Comment venir ? | `#/comment-venir` |
| 4 | 🎁 | Liste de mariage | `#/liste` |
| 5 | 🎤 | Animations & Discours | `#/infos/animations` |
| 6 | ✉️ | Contacts utiles | `#/infos/contacts` |

---

## 5. Page "Comment venir ?"

Trois blocs :
1. **Cérémonie** — Église Notre-Dame-de-Pitié, Malleval (42520). Parkings : du Bourg (~3 min), de la Mairie (~2 min), route de Pélussin (~8 min en montée). Ruelles médiévales inaccessibles en voiture.
2. **Réception** — Domaine de la Scie du May, Doizieux (42740). Parking gratuit sur place, suivre les ballons.
3. **Train** — Gare TER Le Péage-de-Roussillon (Lyon ↔ Valence, ~40 min depuis Lyon Part-Dieu). Renvoi vers page covoiturage.

---

## 6. Base de données Supabase

**Projet** : `upaxcudmifqwiglodywf.supabase.co`

### Table `guests`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | Généré automatiquement |
| `first_name` | text | Prénom |
| `last_name` | text | Nom |
| `phone` | text | Téléphone (clé d'identification) |
| `email` | text | Email (optionnel) |
| `attending` | boolean / 'maybe' | true / false / 'maybe' |
| `companions` | jsonb | `[{name, diet, allergyDetails}]` |
| `diet` | jsonb | `['vegetarian','vegan','no-alcohol','allergy']` |
| `allergy_details` | text | Ex: `[Lactose] [Gluten] [Autre: noix]` |
| `brunch` | boolean | Participation brunch du 9 mai |
| `transport` | jsonb | Objet transport complet (voir §7) |
| `accommodation_id` | uuid FK → accommodations | Hébergement choisi (nullable) |
| `accommodation_name` | text | Nom libre si hors liste |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Table `carpools`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `guest_id` | uuid FK → guests | Cascade delete |
| `type` | text | `'offer'` ou `'request'` |
| `city` | text | Ville de départ |
| `seats_available` | int | Pour les offres |
| `seats_needed` | int | Pour les demandes |
| `departure_day` | text | Date ISO |
| `departure_time` | text | HH:MM |
| `contact` | text | Téléphone ou email |

### Table `accommodations`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Nom |
| `lat` / `lng` | float | Coordonnées GPS |
| `capacity` | text | Texte descriptif |
| `capacity_number` | int | Numérique (0 = non limité) |
| `description` | text | |
| `distance` | text | Indicatif |
| `booking_url` | text | Lien réservation |
| `icon` | text | `'venue'`, `'gite'`, `'chambre'` |

**Disponibilité** : `getAccommodationsWithAvailability()` calcule `spotsLeft = capacity_number − Σ(1 + companions.length)` pour chaque invité ayant `accommodation_id` renseigné.

---

## 7. Objet `transport` (jsonb)

```json
{
  "mode": "car | train | other",
  "carpoolRole": "offer | need | none",
  "city": "Lyon",
  "seatsAvailable": 3,
  "seatsNeeded": 2,
  "departureDay": "2027-05-08",
  "departureTime": "09:00",
  "contactPhone": "06XXXXXXXX",
  "contactEmail": "optionnel@mail.fr",
  "arrivalBeforeDDay": false,
  "arrivalFrom": "",
  "arrivalTo": "",
  "arrivalDate": "",
  "passengerNeeds": ["church", "church-venue", "night", "brunch"],
  "churchArrival": "ter | far",
  "churchTime": "10:30",
  "nightName": "",
  "nightAddress": "",
  "nightCity": "",
  "nightZip": "",
  "nightDistance": ""
}
```

---

## 8. Formulaire RSVP (5 étapes)

| Étape | Contenu | Logique |
|---|---|---|
| 1 — Réponse | Prénom, Nom, Téléphone + présence + accompagnants (max 5) | Si "non" → soumission directe |
| 2 — Brunch | Brunch du 9 mai 9h30–13h30 | Sautée si "non" |
| 3 — Repas | Régimes par personne + sous-options allergies | Sautée si "non" ou "peut-être" |
| 4 — Transport | Mode + covoiturage + détails trajets | Toujours |
| 5 — Hébergement | Autocomplete hébergements (≥3 lettres) + places restantes | Toujours |

---

## 9. Espace administration

- Mot de passe hashé SHA-256 côté client
- Session en `localStorage`
- Dashboard : stats (total / confirmés / peut-être / déclinés / en attente), régimes, liste invités (avec brunch + transport), covoiturage, hébergements

---

## 10. Persistance localStorage

| Clé | Contenu |
|---|---|
| `wedding_current_guest_id` | UUID invité connecté |
| `wedding_admin_auth` | `{authenticated: true, timestamp}` |

---

## 11. Hébergements en base

Triés par distance GPS dans `map.js` :

| Nom | Distance | capacity_number |
|---|---|---|
| Domaine de la Scie du May | Sur place | 20 |
| Chez Delphine (Chambre d'hôtes) | ~3 km | 4 |
| La Roche du Pilat | ~3 km | 6 |
| Hôtel Restaurant Éclosion | ~4 km | 24 |
| Camping Bel'Époque du Pilat | ~15 km | 0 |
| Camping de la Lône | ~20 km | 0 |
| Huttopia Pays de Condrieu | ~22 km | 0 |

Marqueur carte spécial : 🚆 Gare TER Le Péage-de-Roussillon (`45.3767, 4.7970`).

---

## 12. Charte graphique

### Palette
| Variable CSS | Valeur | Usage |
|---|---|---|
| `--white` | `#FFFFFF` | Fonds cartes |
| `--cream` | `#FAF8F5` | Fond général de la page |
| `--sage` | `#9CAF88` | Vert sauge — accents secondaires, bordures |
| `--forest` | `#2D5A3D` | Vert sapin — couleur principale, titres |
| `--gold` | `#C9A84C` | Doré — mise en valeur, ornements |
| `--gold-light` | `#E8D5A3` | Doré clair — dégradés, fonds subtils |
| `--text-dark` | `#2C2C2C` | Texte principal |
| `--text-muted` | `#6B6B6B` | Texte secondaire |

### Typographie
- **`--font-display`** : `'Cormorant Garamond'` — uniquement pour `h1` à `h4`, éléments hero, noms des mariés
- **`--font-body`** : `'Outfit'` — tout le reste : nav, boutons, labels, corps de texte, formulaires
- **Règle absolue** : ne jamais mélanger les deux polices dans un même élément. Cormorant = élégance décorative. Outfit = lisibilité fonctionnelle.
- Weights Cormorant : 400 (normal), 500, 600, 700 — et leurs italiques
- Weights Outfit : 300 (léger), 400 (normal), 500 (medium), 600 (semi-bold)

### Espacements & Rayons
| Variable | Valeur | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Boutons, inputs |
| `--radius-md` | `12px` | Cartes secondaires, popups |
| `--radius-lg` | `20px` | Cartes principales |

### Ombres
| Variable | Usage |
|---|---|
| `--shadow-sm` | Éléments au repos |
| `--shadow-md` | Cartes au hover |
| `--shadow-lg` | Toasts, menus flottants |

### Grille cubes "Infos pratiques"
- Desktop (≥768px) : 3 colonnes, `gap: 24px`, `aspect-ratio: 1/1`
- Mobile (<768px) : **toujours 2 colonnes**, `gap: 12px`, cubes plus compacts
- **Ne jamais passer à 1 colonne** — l'effet "tout d'un coup d'œil" est l'intention de design

### Règles CSS critiques identifiées
1. **Voile page d'accueil** : l'effet parallaxe dans `hero.js` modifie `opacity` du hero content au scroll → supprimer ou limiter à `opacity >= 0.3` minimum
2. **Menu mobile** : utiliser fond `background: #FAF8F5` plein (sans `backdrop-filter`) sur mobile — le flou translucide rend les liens illisibles sur fond de contenu
3. **Dropdown mobile** : basculer sur toggle au tap (pas hover), fond opaque, `z-index: 1010`, fermeture au clic extérieur
4. **Nav hamburger** : après clic sur un item du dropdown, fermer à la fois le sous-menu ET le menu hamburger

---

## 13. Points de vigilance pour refactoring

- **Toutes les méthodes `Store` sont `async`** — tout appelant doit `await`
- **`initComponents()` utilise `for...of`** — respecte l'ordre async (pas `forEach`)
- **`DOMContentLoaded` est `async`** dans `app.js`
- **Conversion snake_case ↔ camelCase** : `toApp()` / `toDb()` dans `store.js`
- **Firefox** plus strict que Chrome sur Promises — tester sur les deux
- **Cache** : Ctrl+Shift+R après chaque déploiement GitHub Pages
- **`Store.on()`** ne retourne pas de désinscripteur (pas de cleanup actuellement)
- **Pas de bundler** : ES Modules natifs — attention aux chemins relatifs
- **`infoPages.js`** injecte du CSS dynamiquement — vérifier la non-duplication au changement de route