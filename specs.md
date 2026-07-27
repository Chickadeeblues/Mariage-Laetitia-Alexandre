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

### Séparation de l'Interface de Traduction (i18n) et de la Collecte des Données

Le système de traduction est conçu pour découpler strictement l'interface utilisateur (front-end) de la collecte et du stockage des données (back-end), confirmant ainsi que le recueil n'est pas altéré par la langue. La traduction est pilotée par le composant `i18n.js`, qui parcourt le DOM pour cibler les éléments HTML dotés de l'attribut `data-i18n` afin de modifier dynamiquement leur contenu (`innerHTML`) ou leur attribut `placeholder` selon la langue active[cite: 5]. Cette mutation est exclusivement visuelle et n'impacte que l'affichage. En arrière-plan, la logique métier des formulaires (comme le composant RSVP) reste intacte : elle transmet à la base de données Supabase des clés et des valeurs techniques universelles (telles que des booléens `true`/`false` ou des identifiants stricts comme `"train"`). Par conséquent, les données soumises par un utilisateur, qu'il navigue en version française ou espagnole, sont standardisées et centralisées de manière uniforme, garantissant un affichage cohérent et agnostique dans le tableau de bord administrateur.

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

## 9. Espace administration (`adminDashboard.js`)

Accès protégé par mot de passe hashé en SHA-256 (session stockée dans `localStorage`). L'espace se compose d'une zone supérieure de gestion rapide et de 6 onglets thématiques.

### 9.1 Zone de gestion & Checklist (`renderManagementZone`)
- **Bannière d'en-tête** : Affiche le compte à rebours jusqu'au 8 mai 2027 et la prochaine tâche en attente.
- **Barre de progression** : Calcul en temps réel du pourcentage de tâches accomplies (`done / total`).
- **Checklist rétractable** : 
  - Regroupement par mois/échéances avec filtrage dynamique par catégorie (`CAT_COLORS`).
  - Actions rapides : cocher/décocher (mise à jour asynchrone sans rechargement), modifier le libellé, supprimer, ajouter une tâche.

### 9.2 Statistiques & Synthèse des régimes (`renderStatsAndDiets`)
- **Grille de 4 cartes Stats** (bordure vert sauge) : Confirmés, Présents au Brunch (calcul exact incluant les accompagnants), Peut-être, Déclinés.
- **Grille de 4 cartes Régimes** (fond transparent, bordure neutre) : Végétariens, Végans, Sans alcool, Allergies déclarées (avec infobulle listant les détails au survol).

### 9.3 Onglet : Invités (`renderGuestsList`)
- Tableau complet listant les invités et leurs accompagnants (hiérarchie visuelle distincte avec puce `+`).
- Badges visuels pour la présence, le brunch, les régimes et le covoiturage.
- **Modale d'édition complète (`openEditModal`)** : Permet à l'administrateur de modifier l'intégralité de la fiche d'un invité (identité, présence, brunch, régimes individuels, transport et hébergement).

### 9.4 Onglet : Équipe prépa (`renderTeam`)
- **Structure du tableau** : Collé directement sous la barre d'onglets (`margin-top: 0`). Bouton `+ Ajouter un membre` positionné sous le tableau, aligné à gauche.
- **Multi-rôles** : Sélection via pastilles en modale avec blocage strict à **3 rôles maximum**. Affichage sous forme de badges vert sauge/sapin.
- **Colonnes Jours (Jeudi / Vendredi / Samedi)** :
  - Largeur strictement identique (`12%`) et texte centré.
  - Affichage uniquement de l'heure d'arrivée formatée à la française (ex: `14h30`), sans coche de validation.
- **Logement sur place** : Affichage par badge texte `"Oui"` ou `"Non"` (aucun émoji).
- **Pied de tableau (`<tfoot>`) avec calculs cumulés** :
  - Total général de personnes (sous Nom & Téléphone).
  - Nombre de personnes logeant sur place par jour (additionne uniquement si `stays_on_site = true`).
- **Comportement Modale** : Cochage automatique de l'arrivée du vendredi et samedi si le jeudi est sélectionné (décochable manuellement).

### 9.5 Onglet : Moodboard (`renderMoodboard`)
- **Navigation par sous-onglets** : 8 tableaux d'inspirations (`Faire-parts`, `Robe de mariée`, `Coiffures`, `Bouquet`, `Décoration église`, `Décoration réception`, `Plan de table`, `Tables`).
- **Affichage Masonry (style Pinterest)** :
  - Grille fluide en colonnes (`column-count: 3` sur desktop, `2` sur tablette, `1` sur mobile).
  - Gestion de formats variables via le bouton ⭐/🗜️ (`size: 'normal'` vs `'large'`). Le format vedette prend plus de place avec un liseré doré.
- **Ajout d'images** :
  - Glisser-déposer direct d'une image depuis un autre onglet du navigateur (extraction automatique de l'attribut `src` ou du lien HTTP).
  - Bouton discret en en-tête `➕ Coller le lien d'une image`.
- **Réorganisation (Tri par Drag & Drop)** :
  - Les cartes sont déplaçables (`draggable="true"`). Glisser une carte sur une autre inverse leurs positions et met à jour la colonne `position` dans Supabase en arrière-plan.
- **Suppression** : Bouton discret `×` sur fond vert sauge apparaissant au survol de la carte.

### 9.6 Onglet : Plan de table (`renderSeatingPlan`)
- **Grille compacte de 10 tables** (2 rangées de 5 sur desktop) + zone d'attente des invités non placés (`unassigned-pool`).
- **Placement par Glisser-Déposer** : Déplacement interactif des étiquettes invités vers les tables (capacité bloquée à **8 places maximum par table**).
- **Personnalisation** : Renommage libre des tables (bouton ✏️) et bouton de réinitialisation générale (remet les invités en zone d'attente sans effacer les noms des tables).

### 9.7 Onglets : Covoiturage & Hébergements
- **Covoiturage** : Synthèse rapide comparant le nombre de conducteurs/places offertes face aux demandeurs/places recherchées.
- **Hébergements** : Gestion CRUD des lieux d'hébergement avec affichage rétractable (3 premiers affichés par défaut + bouton `Voir X de plus`).

## 10. Persistance localStorage

| Clé | Contenu |
|---|---|
| `wedding_current_guest_id` | UUID invité connecté |
| `wedding_admin_auth` | `{authenticated: true, timestamp}` |
| 'wedding_admin_active_tab'	Dernier onglet admin visité (guests, team, moodboard...)
wedding_seating_plan	Secours local du plan de table si Supabase hors ligne

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
5. **Onglets Admin** : Structure HTML stricte exigeant la classe .admin-tab et l'attribut data-tab="nom" reliés au panneau #tab-panel-nom pour que le clonage anti-doublon d'écouteurs d'événements dans initTabs() fonctionne.
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