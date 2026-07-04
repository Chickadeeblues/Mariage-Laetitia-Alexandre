import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const WEDDING_TASKS = [
  { id: 1, date: "J-10 mois", label: "Envoyer contrats, acomptes et chèques caution à la Scie" },
  { id: 2, date: "J-10 mois", label: "Comparer les devis traiteur" },
  { id: 3, date: "J-10 mois", label: "Dresser et contacter les logements à proximité" },
  { id: 4, date: "J-9 mois",  label: "Bloquer la liste des invités (78 max)" },
  { id: 5, date: "J-9 mois",  label: "Choisir les témoins (2 chacun)" },
  { id: 6, date: "J-8 mois",  label: "Commencer la préparation au mariage avec Firas" },
  { id: 7, date: "J-8 mois",  label: "Entamer les démarches mariage civil" },
  { id: 8, date: "J-7 mois",  label: "Trouver la robe de mariée" },
  { id: 9, date: "J-6 mois",  label: "Envoyer les faire-parts et invitations officielles" },
  { id: 10, date: "J-6 mois", label: "Planifier la lune de miel" },
  { id: 11, date: "J-5 mois", label: "Définir la liste de mariage" },
  { id: 12, date: "J-4 mois", label: "Transmettre dossier à la chancellerie de St-Etienne" },
  { id: 13, date: "J-4 mois", label: "Définir programme, menu, boissons et déco" },
  { id: 14, date: "J-4 mois", label: "Trouver le costume du Renard" },
  { id: 15, date: "J-3 mois", label: "Checker les réponses invités et prévoir la papeterie" },
  { id: 16, date: "J-2 mois", label: "Prévoir les cadeaux invités" },
  { id: 17, date: "J-1 mois", label: "Confirmer les réservations et verser le solde Scie du May" },
  { id: 18, date: "5 mai",    label: "Courses pratiques (PQ, savon...) + récupérer torchons" },
  { id: 19, date: "6 mai",    label: "Mise en place salle de réception et décoration" },
  { id: 20, date: "7 mai",    label: "Préparation église et récupération clefs/vin/osties" }
];

// Utilitaire pour formater le téléphone (0600000000 -> 06 00 00 00 00)
const formatPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

// Utilitaire pour calculer le compte à rebours jusqu'au 8 mai 2027
const getCountdownText = () => {
  const target = new Date(2027, 4, 8); // 8 mai 2027 (le mois 4 = mai en JS)
  const now = new Date();
  if (now >= target) return "🎉 Le grand jour est arrivé !";
  
  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  let days = target.getDate() - now.getDate();
  
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
  }
  return `J-${months > 0 ? `${months} mois et ` : ''}${days} jour${days > 1 ? 's' : ''} avant le mariage`;
};

const AdminDashboard = {
  logoutBtn: null,

  init() {
    // ── Login ──────────────────────────────────────
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        const errDiv   = document.getElementById('admin-error');
        if (await Store.adminLogin(password)) {
          if (errDiv) errDiv.style.display = 'none';
          document.getElementById('admin-password').value = '';
          Animations.showToast("Connexion réussie", "success");
          Router.navigate('#/admin/dashboard');
        } else {
          if (errDiv) {
            errDiv.textContent   = "Mot de passe incorrect";
            errDiv.style.display = 'block';
            errDiv.style.color   = 'red';
            errDiv.style.marginTop = '10px';
          }
          Animations.showToast("Mot de passe incorrect", "error");
        }
      });
    }

    // ── Logout ─────────────────────────────────────
    this.logoutBtn = document.getElementById('admin-logout-btn');
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        Store.adminLogout();
        Animations.showToast("Déconnexion", "success");
        Router.navigate('#/admin');
      });
    }

    // ── Auto-refresh sur changement de données ─────
    const refreshIfActive = () => {
      if (Router.getCurrentRoute() === '#/admin/dashboard' && Store.isAdmin()) {
        this.renderDashboard();
      }
    };
    Store.on('guests-changed',         refreshIfActive);
    Store.on('carpools-changed',       refreshIfActive);
    Store.on('accommodations-changed', refreshIfActive);

    // ── Rendu au changement de route ───────────────
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/admin/dashboard') {
        if (!Store.isAdmin()) { Router.navigate('#/admin'); return; }
        this.renderDashboard();
      }
    });
  },

  // ════════════════════════════════════════════════
  // Dashboard principal
  // ════════════════════════════════════════════════

async renderDashboard() {
  this.showLoader();
  try {
    const guests = await Store.getGuests();
    const stats  = await Store.getStats();

    await Promise.all([
      this.renderStatsAndDiets(stats, guests),
      this.renderGuestsList(guests),
      this.renderCarpools(stats),
      this.renderAccommodations()
    ]);

    this.renderManagementZone(); // ← ici, après le Promise.all, même niveau
  } catch (e) {
    console.error('[Admin] Erreur renderDashboard :', e);
    Animations.showToast("Erreur de chargement des données", "error");
  } finally {
    this.hideLoader();
  }
},

/**
 * REMPLACEMENT des méthodes renderManagementZone() et toggleTask()
 * dans adminDashboard.js
 * 
 * Copiez ces deux méthodes en remplacement des versions existantes.
 * Elles s'insèrent dans l'objet AdminDashboard, séparées par des virgules.
 */

// ════════════════════════════════════════════════════════════
// WIDGET + CHECKLIST
// ════════════════════════════════════════════════════════════

renderManagementZone() {
  const root = document.querySelector('#page-admin-dashboard .container');
  if (!root) return;

  // ── Calcul du compte à rebours ──
  const target = new Date(2027, 4, 8);
  const now    = new Date();
  let months = (target.getFullYear() - now.getFullYear()) * 12
             + (target.getMonth()    - now.getMonth());
  let days   = target.getDate() - now.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(target.getFullYear(), target.getMonth(), 0).getDate();
  }
  const countdown = now >= target
    ? '🎉 Le grand jour est arrivé !'
    : `Plus que <strong>${months > 0 ? months + ' mois' : ''}${months > 0 && days > 0 ? ' et ' : ''}${days > 0 ? days + ' jour' + (days > 1 ? 's' : '') : ''}</strong> !`;

  // ── Tâche recommandée selon la période ──
  const savedTasks = JSON.parse(localStorage.getItem('wedding_tasks') || '[]');
  const nextTask = WEDDING_TASKS.find(t => !savedTasks.includes(t.id));
  const taskLabel = nextTask ? nextTask.label : '✅ Tout est prêt !';
  const taskPeriod = nextTask ? nextTask.date : '';

  // ── Groupement des tâches par période ──
  const groups = {};
  WEDDING_TASKS.forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  // ── HTML ──
  let html = `
    <style>
      #admin-mgmt { margin-top: 32px; }

      /* Widget */
      .mgmt-widget {
        display: flex;
        align-items: stretch;
        gap: 0;
        background: #fff;
        border: 1.5px solid var(--sage);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 28px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      .mgmt-widget__countdown {
        flex: 0 0 200px;
        background: linear-gradient(135deg, var(--forest), #3a734f);
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px 16px;
        text-align: center;
        gap: 4px;
      }
      .mgmt-widget__countdown-label {
        font-family: var(--font-body);
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.75;
      }
      .mgmt-widget__countdown-value {
        font-family: var(--font-display);
        font-size: 1.05rem;
        line-height: 1.3;
      }
      .mgmt-widget__task {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 20px 24px;
        gap: 4px;
      }
      .mgmt-widget__task-period {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--gold);
      }
      .mgmt-widget__task-label {
        font-family: var(--font-display);
        font-size: 1rem;
        color: var(--forest);
        font-style: italic;
      }
      .mgmt-widget__task-sub {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 2px;
      }

      /* Checklist */
      .checklist-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .checklist-header h3 {
        font-family: var(--font-display);
        color: var(--forest);
        margin: 0;
        font-size: 1.2rem;
      }
      .checklist-progress {
        font-size: 13px;
        color: var(--text-muted);
      }
      .checklist-progress strong { color: var(--forest); }

      .checklist-group { margin-bottom: 16px; }

      .checklist-group__title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-body);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--gold);
        padding: 6px 12px;
        background: #fdfaf5;
        border-radius: 6px;
        margin-bottom: 4px;
        border-left: 3px solid var(--gold);
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border-radius: 8px;
        border: 1px solid #ede8df;
        margin-bottom: 4px;
        background: #fff;
        transition: background 0.15s;
      }
      .checklist-item:hover { background: #fdfaf5; }
      .checklist-item.done  {
        background: #f6faf5;
        border-color: #d5e8d0;
        opacity: 0.75;
      }
      .checklist-item.done .checklist-item__label {
        text-decoration: line-through;
        color: var(--text-muted);
      }

      .checklist-item__check {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        accent-color: var(--forest);
        cursor: pointer;
      }

      .checklist-item__label {
        flex: 1;
        font-size: 13.5px;
        color: var(--text-dark);
        line-height: 1.4;
      }

      .checklist-item__actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .checklist-btn {
        background: none;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 2px 7px;
        font-size: 12px;
        cursor: pointer;
        color: var(--text-muted);
        transition: border-color 0.15s, color 0.15s;
      }
      .checklist-btn:hover { border-color: var(--forest); color: var(--forest); }
      .checklist-btn.del:hover { border-color: #c0392b; color: #c0392b; }

      .checklist-add {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding: 10px;
        background: #f8f5f0;
        border-radius: 8px;
      }
      .checklist-add input, .checklist-add select {
        padding: 7px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: var(--font-body);
        font-size: 13px;
      }
      .checklist-add input { flex: 1; }
      .checklist-add select { width: 140px; flex-shrink: 0; }
      .checklist-add button {
        padding: 7px 14px;
        background: var(--forest);
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .mgmt-widget { flex-direction: column; }
        .mgmt-widget__countdown { flex: none; padding: 14px; }
        .checklist-add { flex-wrap: wrap; }
        .checklist-add select { width: 100%; }
      }
    </style>

    <div id="admin-mgmt">

      <!-- Widget countdown + tâche -->
      <div class="mgmt-widget">
        <div class="mgmt-widget__countdown">
          <div class="mgmt-widget__countdown-label">Compte à rebours</div>
          <div class="mgmt-widget__countdown-value">${countdown}</div>
        </div>
        <div class="mgmt-widget__task">
          <div class="mgmt-widget__task-period">${taskPeriod ? '🎯 ' + taskPeriod : '🎯 À faire'}</div>
          <div class="mgmt-widget__task-label">${taskLabel}</div>
          <div class="mgmt-widget__task-sub">Prochaine tâche non complétée dans votre checklist</div>
        </div>
      </div>

      <!-- Checklist -->
      <div class="checklist-header">
        <h3>📋 Checklist de préparation</h3>
        <div class="checklist-progress">
          <strong>${savedTasks.length}</strong> / ${WEDDING_TASKS.length} tâches complétées
        </div>
      </div>

      ${Object.entries(groups).map(([period, tasks]) => `
        <div class="checklist-group">
          <div class="checklist-group__title">${period}</div>
          ${tasks.map(t => {
            const done = savedTasks.includes(t.id);
            return `
              <div class="checklist-item ${done ? 'done' : ''}" id="task-row-${t.id}">
                <input type="checkbox" class="checklist-item__check"
                  ${done ? 'checked' : ''}
                  onchange="window._adminToggleTask(${t.id})">
                <span class="checklist-item__label" id="task-label-${t.id}">${t.label}</span>
                <div class="checklist-item__actions">
                  <button class="checklist-btn" onclick="window._adminEditTask(${t.id})" title="Modifier">✏️</button>
                  <button class="checklist-btn del" onclick="window._adminDeleteTask(${t.id})" title="Supprimer">×</button>
                </div>
              </div>`;
          }).join('')}
        </div>
      `).join('')}

      <!-- Ajouter une tâche -->
      <div class="checklist-add">
        <select id="new-task-period">
          ${Object.keys(groups).map(p => `<option value="${p}">${p}</option>`).join('')}
          <option value="Autre">Autre</option>
        </select>
        <input type="text" id="new-task-label" placeholder="Nouvelle tâche…">
        <button onclick="window._adminAddTask()">+ Ajouter</button>
      </div>

    </div>
  `;

  // Supprimer l'ancien widget s'il existe
  const existing = document.getElementById('admin-mgmt');
  if (existing) existing.remove();

  root.insertAdjacentHTML('beforeend', html);

  // ── Fonctions globales (appelées depuis les onclick inline) ──

  window._adminToggleTask = (id) => {
    let tasks = JSON.parse(localStorage.getItem('wedding_tasks') || '[]');
    if (tasks.includes(id)) tasks = tasks.filter(t => t !== id);
    else tasks.push(id);
    localStorage.setItem('wedding_tasks', JSON.stringify(tasks));
    this.renderManagementZone();
  };

  window._adminEditTask = (id) => {
    const row = document.getElementById(`task-label-${id}`);
    if (!row) return;
    const current = row.textContent;
    const newLabel = prompt('Modifier la tâche :', current);
    if (!newLabel || newLabel === current) return;
    // Mettre à jour dans WEDDING_TASKS
    const task = WEDDING_TASKS.find(t => t.id === id);
    if (task) { task.label = newLabel.trim(); this.renderManagementZone(); }
  };

  window._adminDeleteTask = (id) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    const idx = WEDDING_TASKS.findIndex(t => t.id === id);
    if (idx !== -1) WEDDING_TASKS.splice(idx, 1);
    let tasks = JSON.parse(localStorage.getItem('wedding_tasks') || '[]');
    tasks = tasks.filter(t => t !== id);
    localStorage.setItem('wedding_tasks', JSON.stringify(tasks));
    this.renderManagementZone();
  };

  window._adminAddTask = () => {
    const period = document.getElementById('new-task-period')?.value;
    const label  = document.getElementById('new-task-label')?.value.trim();
    if (!label) return;
    const newId = Math.max(...WEDDING_TASKS.map(t => t.id), 0) + 1;
    WEDDING_TASKS.push({ id: newId, date: period, label });
    this.renderManagementZone();
  };
},

// toggleTask n'est plus nécessaire (remplacé par window._adminToggleTask)
// mais on le garde vide pour éviter les erreurs si appelé ailleurs
toggleTask(id) {
  window._adminToggleTask && window._adminToggleTask(id);
},

    showLoader() {
    const el = document.getElementById('admin-loader');
    if (el) el.style.display = 'block';
  },
  hideLoader() {
    const el = document.getElementById('admin-loader');
    if (el) el.style.display = 'none';
  },

  async renderStatsAndDiets(stats, guests) {
    // 1. Calcul exact des présents au Brunch (Invités + Accompagnants)
    const exactBrunchCount = guests.reduce((total, g) => {
      const isAttending = g.attending === true || g.attending === 'true' || g.attending === 'oui' || g.attending === 1;
      const wantsBrunch = g.brunch === true || g.brunch === 'true' || g.brunch === 'oui' || g.brunch === 1;
      if (isAttending && wantsBrunch) {
        return total + 1 + (Array.isArray(g.companions) ? g.companions.length : 0);
      }
      return total;
    }, 0);

    const confirmedCount = stats.confirmedPeople !== undefined ? stats.confirmedPeople : stats.confirmed || 0;

    // Repérage des conteneurs
    const firstStatCard = document.getElementById('stat-total') || 
                          document.getElementById('stat-confirmed') ||
                          document.querySelector('.stat-card')?.parentElement;
    const statsContainer = firstStatCard ? (firstStatCard.id ? firstStatCard.parentElement : firstStatCard) : null;
    const dietsContainer = document.getElementById('admin-diets');

    // 4. Injection du Widget Compte à rebours au-dessus des statistiques
    if (statsContainer) {
      let countdownEl = document.getElementById('admin-countdown-widget');
      if (!countdownEl) {
        countdownEl = document.createElement('div');
        countdownEl.id = 'admin-countdown-widget';
        statsContainer.parentNode.insertBefore(countdownEl, statsContainer);
      }
      countdownEl.style.cssText = `
        background: linear-gradient(135deg, var(--forest, #2D5A3D), #3a734f);
        color: #fff;
        padding: 14px 20px;
        border-radius: var(--radius-md, 12px);
        font-family: var(--font-display, serif);
        font-size: 20px;
        font-weight: 600;
        text-align: center;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(45, 90, 61, 0.15);
        margin-bottom: 24px;
        border: 1px solid var(--gold, #C9A84C);
      `;
      countdownEl.innerHTML = getCountdownText();
    }

    // NETTOYAGE FORCE DU FOND BLANC : On vide le CSS parent (index.html) de toute couleur ou bordure !
    const gridStyle = `
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) !important;
      gap: 16px !important;
      margin-bottom: 16px !important;
      width: 100% !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    `;

    if (statsContainer) statsContainer.style.cssText = gridStyle;
    if (dietsContainer) dietsContainer.style.cssText = gridStyle;

    // Style de base pour les cartes
    const baseCardStyle = `
      background: var(--white, #fff);
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      height: 110px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 10px;
      box-sizing: border-box;
      overflow: hidden;
    `;

    // 2. Rebord SAUGE pour les 4 cartes de statistiques
    const statCardStyle = `${baseCardStyle} border: 1.5px solid var(--sage, #9CAF88);`;
    // Rebord neutre discret pour les 4 cartes régimes
    const dietCardStyle = `${baseCardStyle} border: 1px solid #EAEAEA;`;

    // ── Rangée 1 : Statistiques d'invités (Bordure Sauge) ──
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card" style="${statCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--text-dark);">${confirmedCount}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Confirmés</div>
        </div>
        <div class="card" style="${statCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--text-dark);">${exactBrunchCount}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Présents au Brunch</div>
        </div>
        <div class="card" style="${statCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--sage);">${stats.maybe || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Peut-être</div>
        </div>
        <div class="card" style="${statCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:#e06666;">${stats.declined || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Déclinés</div>
        </div>
      `;
    }

    // ── Rangée 2 : Régimes alimentaires (Sans fond blanc derrière, couleurs distinctes) ──
    if (dietsContainer) {
      const allergiesCount = stats.diets.allergies?.length || 0;
      const allergiesTooltip = allergiesCount > 0 
        ? stats.diets.allergies.map(a => `${a.name}: ${a.details}`).join(' | ') 
        : 'Aucune allergie';

      dietsContainer.innerHTML = `
        <div class="card" style="${dietCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:#3B7A57;">${stats.diets.vegetarian || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Végétariens</div>
        </div>
        <div class="card" style="${dietCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--forest, #2D5A3D);">${stats.diets.vegan || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Végans</div>
        </div>
        <div class="card" style="${dietCardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:#4A779D;">${stats.diets.noAlcohol || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Sans alcool</div>
        </div>
        <div class="card" style="${dietCardStyle}" title="${allergiesTooltip}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--gold, #C9A84C);">${allergiesCount}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Allergies déclarées</div>
          ${allergiesCount > 0 ? `<div style="font-size:10px; color:var(--gold); margin-top:2px; max-width:90%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${allergiesTooltip}</div>` : ''}
        </div>
      `;
    }
  },

  // ════════════════════════════════════════════════
  // Liste des invités
  // ════════════════════════════════════════════════

  async renderGuestsList(guests) {
    const container = document.getElementById('admin-guests-list');
    if (!container) return;

    if (guests.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">Aucune réponse pour le moment.</p>';
      return;
    }

    const badgeFor = (attending) => {
      if (attending === true || attending === 'true' || attending === 'oui') return '<span class="badge badge--confirmed">✓ Oui</span>';
      if (attending === false || attending === 'false' || attending === 'non') return '<span class="badge badge--declined">✗ Non</span>';
      if (attending === 'maybe') return '<span class="badge badge--pending">? Peut-être</span>';
      return '<span class="badge badge--pending">En attente</span>';
    };

    const getDietBadges = (person) => {
      let badges = [];
      if (person.vegetarian) badges.push('<span class="badge" style="background:#EFF3EC; color:var(--forest); border:1px solid #D5E0D0; font-size:11px;">Végé</span>');
      if (person.vegan)      badges.push('<span class="badge" style="background:#E8EFEA; color:var(--forest); border:1px solid #C4D6C8; font-size:11px;">Végan</span>');
      if (person.noAlcohol)  badges.push('<span class="badge" style="background:#EDF4FB; color:#4A779D; border:1px solid #CADDED; font-size:11px;">Sans Alc.</span>');
      if (person.allergies || person.allergyDetails || person.allergy_details) {
        const details = person.allergies || person.allergyDetails || person.allergy_details;
        badges.push(`<span class="badge" style="background:#FDF9EE; color:#8C7326; border:1px solid #E8D5A3; font-size:11px;" title="${details}">⚠️ Allergie</span>`);
      }
      return badges.length > 0 ? badges.join(' ') : '—';
    };

    let html = `
      <div class="table-responsive">
        <table class="admin-table" style="width:100%; border-collapse:collapse; margin-top:20px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gold); text-align: left;">
              <th style="padding:10px;">Nom & Téléphone</th>
              <th style="padding:10px;">Présence</th>
              <th style="padding:10px;">Brunch</th>
              <th style="padding:10px;">Régime</th>
              <th style="padding:10px;">Transport</th>
              <th style="padding:10px;">Hébergement</th>
              <th style="padding:10px; width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((g, idx) => {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      
      let transportText = '—';
      if (g.transport?.mode) {
        const modes = { car: 'Voiture', train: 'Train', other: 'Autre' };
        transportText = modes[g.transport.mode] || g.transport.mode;
      }
      if (g.transport?.carpoolRole === 'offer') {
        transportText += `<br><span class="badge" style="background:var(--sage); color:#fff; font-size:10px; padding:2px 4px; border-radius:4px; display:inline-block; margin-top:2px;">Propose covoiturage</span>`;
      } else if (g.transport?.carpoolRole === 'need') {
        transportText += `<br><span class="badge" style="background:var(--gold); color:#fff; font-size:10px; padding:2px 4px; border-radius:4px; display:inline-block; margin-top:2px;">Demande covoiturage</span>`;
      }

      const isBrunch = g.brunch === true || g.brunch === 'true' || g.brunch === 'oui' || g.brunch === 1;
      const brunchText = isBrunch ? '☕ Oui' : '🙏 Non';
      const accommodation = g.accommodationName || g.accommodation_name || g.accommodation || '—';
      const formattedPhone = formatPhone(g.phone);

      html += `
        <tr style="background:${bg}; border-bottom:${g.companions?.length > 0 ? 'none' : '1px solid #eee'};">
          <td style="padding:10px;">
            <strong>${g.firstName || ''} ${g.lastName || ''}</strong>
            ${formattedPhone ? `<br><small style="color:var(--text-muted); font-family:monospace; font-size:12px;">${formattedPhone}</small>` : ''}
          </td>
          <td style="padding:10px;">${badgeFor(g.attending)}</td>
          <td style="padding:10px;">${brunchText}</td>
          <td style="padding:10px;">${getDietBadges(g)}</td>
          <td style="padding:10px;">${transportText}</td>
          <td style="padding:10px;"><strong>${accommodation}</strong></td>
          <td style="padding:10px; display:flex; gap:6px;">
            <button class="btn btn--outline edit-guest-btn" data-id="${g.id}" style="padding:2px 8px; font-size:14px; color:var(--gold); border-color:var(--gold); cursor:pointer;" title="Modifier">✏️</button>
            <button class="btn btn--outline delete-guest-btn" data-id="${g.id}" style="padding:2px 8px; font-size:14px; color:red; border-color:red; font-weight:bold; cursor:pointer;" title="Supprimer">×</button>
          </td>
        </tr>
      `;

      if (g.companions && g.companions.length > 0) {
        g.companions.forEach((comp, cIdx) => {
          const isLast = cIdx === g.companions.length - 1;
          html += `
            <tr style="background:${bg}; border-bottom:${isLast ? '1px solid #eee' : 'none'};">
              <td style="padding:10px; position:relative;">
                <span style="position:absolute; left:-6px; top:-10px; background:var(--gold); color:#fff; width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.15); z-index:2;">+</span>
                <strong>${comp.name}</strong>
              </td>
              <td style="padding:10px;">${badgeFor(g.attending)}</td>
              <td style="padding:10px;">${brunchText}</td>
              <td style="padding:10px;">${getDietBadges(comp)}</td>
              <td style="padding:10px;"><span class="text-muted">—</span></td>
              <td style="padding:10px;"><span class="text-muted">—</span></td>
              <td style="padding:10px;"></td>
            </tr>
          `;
        });
      }
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    // Action : Supprimer (×)
    container.querySelectorAll('.delete-guest-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Supprimer cet invité et toutes ses données ?")) {
          await Store.deleteGuest(id);
          Animations.showToast("Invité supprimé", "success");
        }
      });
    });

    // Action : Modifier (✏️) via Modale complète
    container.querySelectorAll('.edit-guest-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const targetGuest = guests.find(g => g.id == id);
        if (targetGuest) this.openEditModal(targetGuest);
      });
    });
  },

  // ════════════════════════════════════════════════
  // 3. Modale de modification complète et ergonomique (Oui/Non)
  // ════════════════════════════════════════════════

  openEditModal(guest) {
    const existingModal = document.getElementById('admin-edit-modal');
    if (existingModal) existingModal.remove();

    const isBrunch = guest.brunch === true || guest.brunch === 'true' || guest.brunch === 'oui' || guest.brunch === 1;
    const currentAcc = guest.accommodationName || guest.accommodation_name || guest.accommodation || '';
    const currentMode = guest.transport?.mode || '';
    const currentCarpool = guest.transport?.carpoolRole || 'none';
    const allergiesText = guest.allergies || guest.allergyDetails || guest.allergy_details || '';

    const modalHtml = `
      <div id="admin-edit-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);">
        <div style="background:var(--cream, #FAF8F5); border-radius:var(--radius-lg, 20px); width:95%; max-width:550px; max-height:85vh; overflow-y:auto; padding:24px; box-shadow:0 15px 35px rgba(0,0,0,0.25); border:1px solid var(--gold);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--gold-light); padding-bottom:12px; margin-bottom:16px;">
            <h3 style="margin:0; font-family:var(--font-display); color:var(--forest); font-size:22px;">
              ✏️ Modifier la fiche invité
            </h3>
            <button type="button" id="edit-close-x" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-muted);">×</button>
          </div>

          <form id="admin-edit-form" style="display:flex; flex-direction:column; gap:16px; text-align:left;">
            
            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px;">👤 Identité</legend>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Prénom</label>
                  <input type="text" id="edit-firstname" value="${guest.firstName || ''}" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
                </div>
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Nom</label>
                  <input type="text" id="edit-lastname" value="${guest.lastName || ''}" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
                </div>
              </div>
              <div>
                <label style="font-size:12px; color:var(--text-muted);">Téléphone</label>
                <input type="text" id="edit-phone" value="${guest.phone || ''}" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
              </div>
            </fieldset>

            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px;">💒 Présence</legend>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Mariage (8 mai)</label>
                  <select id="edit-attending" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                    <option value="true" ${guest.attending === true || guest.attending === 'true' ? 'selected' : ''}>✓ Oui (Confirmé)</option>
                    <option value="false" ${guest.attending === false || guest.attending === 'false' ? 'selected' : ''}>✗ Non (Décliné)</option>
                    <option value="maybe" ${guest.attending === 'maybe' ? 'selected' : ''}>? Peut-être</option>
                    <option value="null" ${guest.attending == null ? 'selected' : ''}>En attente</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Brunch (9 mai)</label>
                  <select id="edit-brunch" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                    <option value="true" ${isBrunch ? 'selected' : ''}>☕ Oui</option>
                    <option value="false" ${!isBrunch ? 'selected' : ''}>🙏 Non</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px;">🥗 Régimes alimentaires</legend>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Végétarien</label>
                  <select id="edit-vege" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc;">
                    <option value="false" ${!guest.vegetarian ? 'selected' : ''}>Non</option>
                    <option value="true" ${guest.vegetarian ? 'selected' : ''}>Oui</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Végan</label>
                  <select id="edit-vegan" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc;">
                    <option value="false" ${!guest.vegan ? 'selected' : ''}>Non</option>
                    <option value="true" ${guest.vegan ? 'selected' : ''}>Oui</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Sans alcool</label>
                  <select id="edit-noalc" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc;">
                    <option value="false" ${!guest.noAlcohol ? 'selected' : ''}>Non</option>
                    <option value="true" ${guest.noAlcohol ? 'selected' : ''}>Oui</option>
                  </select>
                </div>
              </div>
              <div>
                <label style="font-size:12px; color:var(--text-muted);">Détails allergies</label>
                <input type="text" id="edit-allergies" value="${allergiesText}" placeholder="Ex: Gluten, fruits à coque..." style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
              </div>
            </fieldset>

            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px;">🚗 Transport & Logement</legend>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Mode de transport</label>
                  <select id="edit-transport" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                    <option value="" ${!currentMode ? 'selected' : ''}>— Non renseigné —</option>
                    <option value="car" ${currentMode === 'car' ? 'selected' : ''}>🚗 Voiture</option>
                    <option value="train" ${currentMode === 'train' ? 'selected' : ''}>🚆 Train</option>
                    <option value="other" ${currentMode === 'other' ? 'selected' : ''}>✈️ Autre</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Covoiturage</label>
                  <select id="edit-carpool" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                    <option value="none" ${currentCarpool === 'none' ? 'selected' : ''}>Aucun</option>
                    <option value="offer" ${currentCarpool === 'offer' ? 'selected' : ''}>🟢 Propose des places</option>
                    <option value="need" ${currentCarpool === 'need' ? 'selected' : ''}>🟡 Cherche des places</option>
                  </select>
                </div>
              </div>
              <div>
                <label style="font-size:12px; color:var(--text-muted);">Lieu d'hébergement</label>
                <input type="text" id="edit-acc" value="${currentAcc}" placeholder="Ex: Domaine de la Scie du May" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
              </div>
            </fieldset>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
              <button type="button" id="edit-cancel-btn" class="btn btn--outline" style="padding:10px 18px;">Annuler</button>
              <button type="submit" class="btn btn--primary" style="padding:10px 18px; background:var(--forest); color:#fff; border:none; border-radius:var(--radius-sm); font-weight:600; cursor:pointer;">Enregistrer tout</button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('admin-edit-modal');
    const cancelBtn = document.getElementById('edit-cancel-btn');
    const closeX = document.getElementById('edit-close-x');
    const form = document.getElementById('admin-edit-form');

    const closeModal = () => modal.remove();
    cancelBtn.addEventListener('click', closeModal);
    closeX.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Soumission du formulaire complet
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const attVal = document.getElementById('edit-attending').value;
      const newAttending = attVal === 'true' ? true : attVal === 'false' ? false : attVal === 'maybe' ? 'maybe' : null;

      const updatedGuest = {
        ...guest,
        firstName: document.getElementById('edit-firstname').value.trim(),
        lastName: document.getElementById('edit-lastname').value.trim(),
        phone: document.getElementById('edit-phone').value.trim(),
        attending: newAttending,
        brunch: document.getElementById('edit-brunch').value === 'true',
        vegetarian: document.getElementById('edit-vege').value === 'true',
        vegan: document.getElementById('edit-vegan').value === 'true',
        noAlcohol: document.getElementById('edit-noalc').value === 'true',
        allergyDetails: document.getElementById('edit-allergies').value.trim(),
        allergy_details: document.getElementById('edit-allergies').value.trim(),
        accommodationName: document.getElementById('edit-acc').value.trim(),
        accommodation_name: document.getElementById('edit-acc').value.trim(),
        transport: {
          ...(guest.transport || {}),
          mode: document.getElementById('edit-transport').value || undefined,
          carpoolRole: document.getElementById('edit-carpool').value
        }
      };

      try {
        if (typeof Store.updateGuest === 'function') {
          await Store.updateGuest(guest.id, updatedGuest);
        } else if (typeof Store.saveGuest === 'function') {
          await Store.saveGuest(updatedGuest);
        }
        Animations.showToast("Modifications enregistrées", "success");
        closeModal();
        this.renderDashboard();
      } catch (err) {
        console.error(err);
        Animations.showToast("Erreur lors de la sauvegarde", "error");
      }
    });
  },

  // ════════════════════════════════════════════════
  // Covoiturage
  // ════════════════════════════════════════════════

  async renderCarpools(stats) {
    const container = document.getElementById('admin-carpools');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-grid mb-4">
        <div class="card" style="border-left:4px solid var(--sage);">
          <h4>🚗 Conducteurs</h4>
          <p class="text-muted mt-2">
            ${stats.transport.drivers} voiture(s) — 
            <strong>${stats.transport.seatsAvailable} place(s)</strong> disponible(s).
          </p>
        </div>
        <div class="card" style="border-left:4px solid var(--gold);">
          <h4>🙋 Recherche de places</h4>
          <p class="text-muted mt-2">
            ${stats.transport.needRide} personne(s) — 
            <strong>${stats.transport.seatsNeeded} place(s)</strong> recherchée(s).
          </p>
        </div>
      </div>
      <p class="text-center mt-2">
        <a href="#/covoiturage" class="btn btn--secondary">
          Gérer les covoiturages sur la page publique
        </a>
      </p>
    `;
  },

  // ════════════════════════════════════════════════
  // Hébergements
  // ════════════════════════════════════════════════

  async renderAccommodations() {
    const container = document.getElementById('admin-accommodations');
    if (!container) return;

    container.innerHTML = '<p class="text-muted text-center mt-2">Chargement…</p>';
    const accommodations = await Store.getAccommodations();

    let html = `
      <div class="mb-4">
        <button class="btn btn--primary" id="add-acc-btn">+ Ajouter un hébergement</button>
      </div>
      <div class="carpool-list" style="margin-top:20px;">
    `;

    accommodations.forEach(acc => {
      html += `
        <div class="card mb-3">
          <h4>${acc.name}</h4>
          <p class="text-muted">
            <small>📍 ${acc.lat}, ${acc.lng} | 🛏️ ${acc.capacity} | 📏 ${acc.distance || '—'}</small>
          </p>
          ${acc.bookingUrl
            ? `<p><a href="${acc.bookingUrl}" target="_blank" style="font-size:13px; color:var(--gold);">Voir le lien de réservation →</a></p>`
            : ''}
          <div class="mt-3">
            <button class="btn btn--outline delete-acc-btn"
              data-id="${acc.id}"
              style="padding:4px 8px; font-size:12px; color:red; border-color:red;">
              Supprimer
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    const addBtn = container.querySelector('#add-acc-btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const name = prompt("Nom de l'hébergement :");
        if (!name) return;
        const lat      = prompt("Latitude (ex: 45.42) :");
        const lng      = prompt("Longitude (ex: 4.59) :");
        const capacity = prompt("Capacité (ex: 4 personnes) :");
        const bookingUrl = prompt("Lien de réservation (optionnel) :") || '';

        await Store.saveAccommodation({
          name,
          lat:        parseFloat(lat) || 45.411,
          lng:        parseFloat(lng) || 4.588,
          capacity:   capacity || '',
          bookingUrl,
          description: '',
          distance:    '',
          icon:        'gite'
        });
        Animations.showToast("Hébergement ajouté", "success");
      });
    }

    container.querySelectorAll('.delete-acc-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm("Supprimer cet hébergement ?")) {
          await Store.deleteAccommodation(e.target.dataset.id);
          Animations.showToast("Hébergement supprimé", "success");
        }
      });
    });
  }

};
export default AdminDashboard;