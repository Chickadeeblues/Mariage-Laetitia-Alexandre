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
- Polices : Cormorant Garamond + Outfit (Google Fonts)

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
        ├── map.js              # Carte Leaflet + liste hébergements
        ├── carpool.js          # Affichage offres/demandes covoiturage
        ├── guestProfile.js     # Espace personnel invité
        └── adminDashboard.js   # Tableau de bord mariés
```

---

## 3. Base de données Supabase

**Projet** : `upaxcudmifqwiglodywf.supabase.co`

### Table `guests`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | Généré automatiquement |
| `first_name` | text | Prénom |
| `last_name` | text | Nom |
| `phone` | text | Téléphone (clé d'identification invité) |
| `email` | text | Email (optionnel) |
| `attending` | boolean / 'maybe' | true / false / 'maybe' |
| `companions` | jsonb | Tableau `[{name, diet, allergyDetails}]` |
| `diet` | jsonb | Tableau `['vegetarian','vegan','no-alcohol','allergy']` |
| `allergy_details` | text | Ex: `[Lactose] [Gluten] [Autre: noix]` |
| `brunch` | boolean | Participation brunch du 9 mai |
| `transport` | jsonb | Objet transport complet (voir §4) |
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
| `departure_day` | text | Date au format ISO |
| `departure_time` | text | Heure HH:MM |
| `contact` | text | Téléphone ou email |

### Table `accommodations`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Nom de l'hébergement |
| `lat` / `lng` | float | Coordonnées GPS |
| `capacity` | text | Ex: "6 personnes" |
| `description` | text | |
| `distance` | text | Ex: "~3 km" |
| `booking_url` | text | Lien de réservation |
| `icon` | text | `'venue'`, `'gite'`, `'chambre'` |

**Sécurité** : Row Level Security activée, policies publiques en lecture/écriture (contrôle applicatif).

---

## 4. Objet `transport` (jsonb dans `guests`)

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

## 5. Formulaire RSVP (5 étapes)

| Étape | Contenu | Logique |
|---|---|---|
| 1 — Réponse | Prénom, Nom, Téléphone + présence (oui/peut-être/non) + accompagnants (max 5) | Si "non" → soumission directe |
| 2 — Brunch | Participation brunch du 9 mai 9h30-13h30 | Sautée si "non" à l'étape 1 |
| 3 — Repas | Régimes alimentaires (végétarien, végan, sans alcool, allergie) pour chaque personne | Sautée si "non" ou "peut-être" |
| 4 — Transport | Mode (voiture/train/autre), covoiturage (offre/besoin/rien), détails trajets | Toujours affichée |
| 5 — Hébergement | Statut hébergement (trouvé/cherche encore) + lien vers la liste | Toujours affichée |

**Identification invité** : par numéro de téléphone. Si le numéro existe déjà en base, le profil est pré-rempli (mise à jour plutôt que création).

---

## 6. Routes SPA

| Hash | Page | Composant |
|---|---|---|
| `#/` | Accueil | `hero.js` |
| `#/rsvp` | Formulaire RSVP | `rsvp.js` |
| `#/hebergements` | Carte + liste hébergements | `map.js` |
| `#/covoiturage` | Offres et demandes | `carpool.js` |
| `#/mes-reponses` | Profil invité | `guestProfile.js` |
| `#/admin` | Login mariés | `adminDashboard.js` |
| `#/admin/dashboard` | Tableau de bord | `adminDashboard.js` |

---

## 7. Espace administration

- Accès par mot de passe hashé SHA-256 côté client
- Session stockée en `localStorage` (clé `wedding_admin_auth`)
- Tableau de bord : stats globales, régimes alimentaires, liste invités, synthèse covoiturage, gestion hébergements (ajout/suppression)
- Stat "Peut-être" incluse dans les compteurs

---

## 8. Persistance locale (localStorage)

Seules deux clés, jamais de données métier :

| Clé | Contenu |
|---|---|
| `wedding_current_guest_id` | UUID de l'invité connecté |
| `wedding_admin_auth` | `{authenticated: true, timestamp}` |

---

## 9. Points de vigilance pour refactoring

- **Toutes les méthodes `Store` sont `async`** — tout appelant doit utiliser `await`
- **`initComponents()` utilise `for...of`** et non `forEach` pour respecter l'ordre async
- **`DOMContentLoaded` est `async`** dans `app.js`
- **Conversion snake_case ↔ camelCase** assurée par `toApp()` / `toDb()` dans `store.js`
- **Firefox** est plus strict que Chrome sur les Promises non résolues — tester sur les deux
- **Cache navigateur** : forcer Ctrl+Shift+R après chaque déploiement GitHub Pages
- **`Store.on()`** ne retourne pas de fonction de désinscription (pas de cleanup possible actuellement)
- **Pas de bundler** : les imports sont des ES Modules natifs, attention à la compatibilité des chemins relatifs

---

## 10. Hébergements par défaut

Insérés automatiquement à l'initialisation si la table `accommodations` est vide :
1. Domaine de la Scie du May *(sur place)*
2. La Roche du Pilat — gîte 6 pers. *(~3 km)*
3. Chez Delphine — chambre d'hôtes *(~3 km)*
4. Hôtel Restaurant Éclosion *(~4 km)*
5. Camping Le Bessat *(~12 km)*
6. Options Airbnb Parc du Pilat *(<20 km)*