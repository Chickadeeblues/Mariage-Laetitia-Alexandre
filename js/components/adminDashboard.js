import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

// ── Couleurs des étiquettes checklist ──────────────────────────────────
const CAT_COLORS = {
  'Messe':         { bg: '#dbeafe', color: '#1d4ed8' },  // bleu
  'Administratif': { bg: '#fee2e2', color: '#b91c1c' },  // rouge
  'Organisation':  { bg: '#ffedd5', color: '#c2410c' },  // orange
  'Invitations':   { bg: '#fce7f3', color: '#be185d' },  // rose
  'Tenue':         { bg: '#f3e8ff', color: '#7c3aed' },  // violet
  'Traiteur':      { bg: '#d1fae5', color: '#065f46' },  // vert sauge
  'Logistique':    { bg: '#f1f5f9', color: '#475569' },  // gris
};
// Format numéros de téléphone 
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

console.log("Liste complète des invités reçue par le dashboard :", guests);

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
    } //  Corrigé : plus de virgule ici !

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
  // ════════════════════════════════════════════════════════════
  // Gestion des onglets intercalaires
  // ════════════════════════════════════════════════════════════
  initTabs() {
    const nav = document.getElementById('admin-tabs-nav');
    if (!nav) return;

    // 1. CSS optimisé : marges réduites pour coller la section aux onglets
    if (!document.getElementById('admin-tabs-styles')) {
      const css = `
        <style id="admin-tabs-styles">
          .admin-tabs {
            display: flex;
            gap: 6px;
            border-bottom: 2px solid #e8e0d0;
            margin-bottom: 4px; /* Réduit pour coller au contenu */
            overflow-x: auto;
            padding-bottom: 0;
          }
          .admin-tab {
            background: none;
            border: none;
            padding: 8px 16px;
            font-family: var(--font-body, sans-serif);
            font-size: 14px;
            font-weight: 500;
            color: var(--text-muted, #6B6B6B);
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            transition: all 0.2s ease;
            white-space: nowrap;
            margin-bottom: -2px; /* Permet à l'onglet actif de recouvrir la ligne */
          }
          .admin-tab:hover {
            color: var(--forest, #2D5A3D);
            background: rgba(156, 175, 136, 0.1);
          }
          .admin-tab.active {
            color: var(--forest, #2D5A3D);
            font-weight: 700;
            border-bottom: 2px solid var(--forest, #2D5A3D);
            background: rgba(156, 175, 136, 0.15); /* Optionnel : léger fond pour bien marquer l'onglet */
          }
          .admin-tab-panel {
            display: none;
            animation: fadeIn 0.2s ease-in-out;
          }
          .admin-tab-panel.active {
            display: block;
          }
          /* Force la suppression de l'espace vide en haut des sections internes */
          .admin-tab-panel .admin-section {
            margin-top: 0 !important;
            padding-top: 8px !important;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(3px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      `;
      document.head.insertAdjacentHTML('beforeend', css);
    }

    // 2. Nettoyage des anciens écouteurs par clonage
    const oldButtons = nav.querySelectorAll('.admin-tab');
    oldButtons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));

    // 3. RE-SÉLECTION des éléments APRES le clonage (Corrige le bug de l'onglet actif !)
    const buttons = nav.querySelectorAll('.admin-tab');
    const panels = document.querySelectorAll('.admin-tab-panel');

    const activateTab = (tabName) => {
      buttons.forEach(btn => {
        const isTarget = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isTarget);
        if (isTarget) {
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.removeAttribute('aria-selected');
        }
      });

      panels.forEach(panel => {
        const isTarget = panel.id === `tab-panel-${tabName}`;
        panel.classList.toggle('active', isTarget);
      });

      localStorage.setItem('wedding_admin_active_tab', tabName);
    };

    // 4. Attachement des clics sur les boutons actifs du DOM
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        activateTab(e.currentTarget.dataset.tab);
      });
    });

    // 5. Activation forcée de l'onglet 'guests' (Invités) par défaut
    activateTab('guests');
  },
  // ════════════════════════════════════════════════════════════
  // Chargement des tâches depuis Supabase
  // ════════════════════════════════════════════════════════════
async _loadTasks() {
  const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/wedding_tasks?select=*&order=id.asc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error('Erreur chargement tâches');
  return await res.json();
},
 
async _saveTaskDone(id, done) {
  const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
  await fetch(
    `${SUPABASE_URL}/rest/v1/wedding_tasks?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ done })
    }
  );
},
 
async _addTaskToDb(month, cat, label) {
  const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/wedding_tasks`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ month, cat, label, done: false })
    }
  );
  return await res.json();
},
 
async _deleteTaskFromDb(id) {
  const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
  await fetch(
    `${SUPABASE_URL}/rest/v1/wedding_tasks?id=eq.${id}`,
    {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    }
  );
},
 
async _updateTaskInDb(id, label) {
  const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
  await fetch(
    `${SUPABASE_URL}/rest/v1/wedding_tasks?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ label })
    }
  );
},

async renderDashboard() {
  this.showLoader();
  try {
    const [guests, stats, tasks] = await Promise.all([
      Store.getGuests(),
      Store.getStats(),
      this._loadTasks()
    ]);
    await this.renderManagementZone(tasks);
 
    await Promise.all([
      this.renderStatsAndDiets(stats, guests),
      this.renderGuestsList(guests),
	  this.renderTeam(guests),
	  this.renderSeatingPlan(guests),
	  this.renderMoodboard(),
      this.renderMass(guests),
      this.renderContentPublication()
    ]);
	// Initialiser et positionner les onglets intercalaires
    this.initTabs();
  } catch (e) {
    console.error('[Admin] Erreur renderDashboard :', e);
    Animations.showToast("Erreur de chargement des données", "error");
  } finally {
    this.hideLoader();
  }
},

// ════════════════════════════════════════════════════════════
// renderManagementZone(tasks)
// ════════════════════════════════════════════════════════════
async renderManagementZone(tasks) {
  // Si appelé sans tasks (refresh manuel), recharger
  if (!tasks) tasks = await this._loadTasks();
 
  const root = document.querySelector('#page-admin-dashboard .container');
  if (!root) return;
 
  const existing = document.getElementById('admin-mgmt');
  if (existing) existing.remove();
 
  // ── Compte à rebours ──
  const target = new Date(2027, 4, 8);
  const now    = new Date();
  let months = (target.getFullYear() - now.getFullYear()) * 12
             + (target.getMonth() - now.getMonth());
  let days = target.getDate() - now.getDate();
  if (days < 0) { months--; days += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); }
  const countdown = now >= target
    ? '🎉 Le grand jour est arrivé !'
    : `Plus que ${months > 0 ? months + ' mois' : ''}${months > 0 && days > 0 ? ' et ' : ''}${days > 0 ? days + ' jour' + (days > 1 ? 's' : '') : ''} !`;
 
  // ── Prochaine tâche ──
  const nextTask = tasks.find(t => !t.done);
 
  // ── Stats progression ──
  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
 
  // ── Catégories pour filtre ──
  const allCats = ['Toutes', ...new Set(tasks.map(t => t.cat))];
 
  // ── Groupes par mois ──
  const groups = {};
  tasks.forEach(t => {
    if (!groups[t.month]) groups[t.month] = [];
    groups[t.month].push(t);
  });
 
  const html = `
    <style>
      /* Widget bannière */
      .mgmt-banner {
        display: flex;
        align-items: center;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        min-height: 44px;
      }
      .mgmt-banner__left {
        background: var(--sage, #9CAF88);
        color: #fff;
        padding: 10px 22px;
        font-family: var(--font-display, serif);
        font-size: 1rem;
        font-style: italic;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .mgmt-banner__right {
        flex: 1;
        background: #fff;
        border: 1.5px solid var(--sage, #9CAF88);
        border-left: none;
        padding: 10px 20px;
        font-family: var(--font-body, sans-serif);
        font-size: 0.88rem;
        color: var(--text-dark, #2C2C2C);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        border-radius: 0 10px 10px 0;
      }
      .mgmt-banner__right em {
        color: var(--text-muted, #6B6B6B);
        font-style: normal;
        font-size: 0.78rem;
      }
 
      /* Barre de progression */
      .mgmt-progress-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 0;
        padding: 8px 0;
      }
      .mgmt-progress-bar-wrap {
        flex: 1;
        background: #e8e0d0;
        border-radius: 100px;
        height: 7px;
        overflow: hidden;
      }
      .mgmt-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--sage), var(--forest));
        border-radius: 100px;
        transition: width 0.4s ease;
      }
      .mgmt-progress-label {
        font-size: 12px;
        color: var(--text-muted);
        white-space: nowrap;
      }
      .mgmt-progress-label strong { color: var(--forest); }
      .mgmt-toggle-btn {
        padding: 5px 14px;
        background: none;
        border: 1.5px solid var(--sage);
        border-radius: 6px;
        font-size: 12px;
        font-family: var(--font-body);
        color: var(--forest);
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
        flex-shrink: 0;
      }
      .mgmt-toggle-btn:hover { background: #f0f7f0; }
 
      /* Checklist (masquée par défaut) */
      #admin-checklist-wrap {
        margin-top: 14px;
        display: none;
      }
      #admin-checklist-wrap.open { display: block; }
 
      /* Tableau */
      .checklist-table-wrap {
        overflow-x: auto;
        border-radius: 10px;
        border: 1px solid #ede8df;
      }
      .checklist-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        background: #fff;
      }
      .checklist-table thead th {
        background: #fdfaf5;
        padding: 9px 14px;
        font-family: var(--font-body);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
        border-bottom: 2px solid #e8e0d0;
        white-space: nowrap;
      }
      .checklist-table thead th select {
        border: none;
        background: transparent;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
        cursor: pointer;
        outline: none;
        padding: 0 2px;
      }
      tr.month-sep td {
        background: #fdfaf5;
        padding: 5px 14px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--gold);
        border-top: 1px solid #e8e0d0;
      }
      tr.task-row td { padding: 7px 14px; border-bottom: 1px solid #f5f0e8; vertical-align: middle; }
      tr.task-row:hover td { background: #fdfaf5; }
      tr.task-row.done td { opacity: 0.5; }
      tr.task-row.done .task-label { text-decoration: line-through; color: var(--text-muted); }
 
      .task-check-cell { display: flex; align-items: center; gap: 8px; }
      .task-check-cell input[type="checkbox"] {
        width: 14px; height: 14px; flex-shrink: 0;
        accent-color: var(--forest); cursor: pointer; margin: 0;
      }
      .task-label { font-size: 13px; color: var(--text-dark); line-height: 1.35; }
 
      /* Étiquettes catégories */
      .cat-badge {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        border: 1px solid transparent;
      }
 
      .task-actions { white-space: nowrap; text-align: center; }
      .task-btn {
        background: none; border: 1px solid #ddd; border-radius: 4px;
        padding: 2px 6px; font-size: 11px; cursor: pointer;
        color: var(--text-muted); margin-left: 2px;
        transition: border-color 0.15s, color 0.15s;
      }
      .task-btn:hover     { border-color: var(--forest); color: var(--forest); }
      .task-btn.del:hover { border-color: #c0392b; color: #c0392b; }
 
      /* Ajouter */
      .checklist-add-row {
        display: flex; gap: 8px; margin-top: 10px;
        padding: 10px; background: #f8f5f0; border-radius: 8px; flex-wrap: wrap;
      }
      .checklist-add-row select,
      .checklist-add-row input {
        padding: 7px 10px; border: 1px solid #ddd; border-radius: 6px;
        font-family: var(--font-body); font-size: 12px; background: #fff;
      }
      .checklist-add-row select { flex: 0 0 130px; }
      .checklist-add-row input  { flex: 1; min-width: 160px; }
      .checklist-add-row button {
        padding: 7px 14px; background: var(--forest); color: #fff;
        border: none; border-radius: 6px; font-size: 12px; font-weight: 600;
        cursor: pointer; flex-shrink: 0;
      }
 
      @media (max-width: 600px) {
        .mgmt-banner { flex-direction: column; border-radius: 10px; }
        .mgmt-banner__left { width: 100%; text-align: center; border-radius: 10px 10px 0 0; padding: 10px 16px; }
        .mgmt-banner__right { border: 1.5px solid var(--sage); border-top: none; border-radius: 0 0 10px 10px; justify-content: center; }
      }
    </style>
 
    <div id="admin-mgmt">
 
      <!-- ── Bannière ── -->
      <div class="mgmt-banner">
        <div class="mgmt-banner__left">${countdown}</div>
        <div class="mgmt-banner__right">
          ${nextTask
            ? `${nextTask.label} <em> </em>`
            : `<em>Tout est prêt !</em>`}
        </div>
      </div>
 
      <!-- ── Barre de progression + bouton ── -->
      <div class="mgmt-progress-row">
        <div class="mgmt-progress-bar-wrap">
          <div class="mgmt-progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="mgmt-progress-label">
          <strong>${done}</strong> / ${total} &nbsp;(${pct}%)
        </div>
        <button class="mgmt-toggle-btn" id="checklist-toggle-btn">
          Voir la checklist ▾
        </button>
      </div>
 
      <!-- ── Checklist (masquée par défaut) ── -->
      <div id="admin-checklist-wrap">
        <div class="checklist-table-wrap">
          <table class="checklist-table">
            <thead>
              <tr>
                <th style="width:100px;">Mois</th>
                <th style="width:130px;">
                  Catégorie
                  <select id="cat-filter" onchange="window._adminFilterCat(this.value)">
                    ${allCats.map(c => `<option value="${c}">${c}</option>`).join('')}
                  </select> ▾
                </th>
                <th>Tâche</th>
                <th style="width:70px;">Actions</th>
              </tr>
            </thead>
            <tbody id="checklist-tbody">
              ${this._renderChecklistRows(groups, 'Toutes')}
            </tbody>
          </table>
        </div>
 
        <!-- Ajouter une tâche -->
        <div class="checklist-add-row">
          <select id="new-task-month">
            ${Object.keys(groups).map(m => `<option value="${m}">${m}</option>`).join('')}
            <option value="Autre">Autre</option>
          </select>
          <select id="new-task-cat">
            ${Object.keys(CAT_COLORS).map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <input type="text" id="new-task-label" placeholder="Libellé de la nouvelle tâche…">
          <button onclick="window._adminAddTask()">+ Ajouter</button>
        </div>
      </div>
 
    </div>
  `;
 
  // Insérer EN PREMIER dans le container (avant les stats)
  root.insertAdjacentHTML('afterbegin', html);
 
  // Toggle checklist
  document.getElementById('checklist-toggle-btn')?.addEventListener('click', function() {
    const wrap = document.getElementById('admin-checklist-wrap');
    const isOpen = wrap.classList.toggle('open');
    this.textContent = isOpen ? 'Masquer la checklist ▴' : 'Voir la checklist ▾';
  });
 
  this._bindChecklistHandlers(tasks, groups);
},

// ════════════════════════════════════════════════════════════
// _renderChecklistRows
// ════════════════════════════════════════════════════════════
_renderChecklistRows(groups, catFilter) {
  let rows = '';
  Object.entries(groups).forEach(([month, tasks]) => {
    const filtered = catFilter === 'Toutes' ? tasks : tasks.filter(t => t.cat === catFilter);
    if (!filtered.length) return;
    rows += `<tr class="month-sep"><td colspan="4">${month}</td></tr>`;
    filtered.forEach(t => {
      const colors = CAT_COLORS[t.cat] || { bg: '#f1f5f9', color: '#475569' };
      rows += `
        <tr class="task-row ${t.done ? 'done' : ''}" id="task-row-${t.id}">
          <td></td>
          <td>
            <span class="cat-badge" style="background:${colors.bg};color:${colors.color};border-color:${colors.color}33;">
              ${t.cat}
            </span>
          </td>
          <td>
            <div class="task-check-cell">
              <input type="checkbox" ${t.done ? 'checked' : ''}
                onchange="window._adminToggleTask(${t.id}, this.checked)">
              <span class="task-label" id="task-label-${t.id}">${t.label}</span>
            </div>
          </td>
          <td class="task-actions">
            <button class="task-btn" onclick="window._adminEditTask(${t.id})" title="Modifier">✏️</button>
            <button class="task-btn del" onclick="window._adminDeleteTask(${t.id})" title="Supprimer">×</button>
          </td>
        </tr>`;
    });
  });
  return rows;
},

// ════════════════════════════════════════════════════════════
// _bindChecklistHandlers
// ════════════════════════════════════════════════════════════
_bindChecklistHandlers(tasks, groups) {
  window._adminToggleTask = async (id, done) => {
    await this._saveTaskDone(id, done);
    // Mettre à jour visuellement sans recharger tout
    const row = document.getElementById(`task-row-${id}`);
    if (row) row.classList.toggle('done', done);
    // Mettre à jour la tâche dans le tableau local
    const t = tasks.find(t => t.id === id);
    if (t) t.done = done;
    // Rafraîchir le widget (compteur + prochaine tâche)
    await this.renderManagementZone(tasks);
    // Rouvrir la checklist
    const wrap = document.getElementById('admin-checklist-wrap');
    if (wrap) wrap.classList.add('open');
    const btn = document.getElementById('checklist-toggle-btn');
    if (btn) btn.textContent = 'Masquer la checklist ▴';
  };
 
  window._adminEditTask = async (id) => {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    const newLabel = prompt('Modifier la tâche :', t.label);
    if (!newLabel || newLabel.trim() === t.label) return;
    t.label = newLabel.trim();
    await this._updateTaskInDb(id, t.label);
    await this.renderManagementZone(tasks);
    document.getElementById('admin-checklist-wrap')?.classList.add('open');
    const btn = document.getElementById('checklist-toggle-btn');
    if (btn) btn.textContent = 'Masquer la checklist ▴';
  };
 
  window._adminDeleteTask = async (id) => {
    if (!confirm('Supprimer cette tâche définitivement ?')) return;
    await this._deleteTaskFromDb(id);
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) tasks.splice(idx, 1);
    await this.renderManagementZone(tasks);
    document.getElementById('admin-checklist-wrap')?.classList.add('open');
    const btn = document.getElementById('checklist-toggle-btn');
    if (btn) btn.textContent = 'Masquer la checklist ▴';
  };
 
  window._adminAddTask = async () => {
    const month = document.getElementById('new-task-month')?.value;
    const cat   = document.getElementById('new-task-cat')?.value;
    const label = document.getElementById('new-task-label')?.value.trim();
    if (!label) return;
    const newRows = await this._addTaskToDb(month, cat, label);
    if (newRows && newRows[0]) tasks.push(newRows[0]);
    await this.renderManagementZone(tasks);
    document.getElementById('admin-checklist-wrap')?.classList.add('open');
    const btn = document.getElementById('checklist-toggle-btn');
    if (btn) btn.textContent = 'Masquer la checklist ▴';
  };
 
  window._adminFilterCat = (cat) => {
    const groups2 = {};
    tasks.forEach(t => { if (!groups2[t.month]) groups2[t.month] = []; groups2[t.month].push(t); });
    const tbody = document.getElementById('checklist-tbody');
    if (tbody) tbody.innerHTML = this._renderChecklistRows(groups2, cat);
    const sel = document.getElementById('cat-filter');
    if (sel) sel.value = cat;
  };
},
 
toggleTask(id) {
  // Conservé pour compatibilité — non utilisé directement
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

// ════════════════════════════════════════════════════════════
  // GESTION DE L'ÉQUIPE PRÉPA (API Supabase)
  // ════════════════════════════════════════════════════════════
  async _loadTeam() {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/wedding_team?select=*&order=name.asc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error("Erreur chargement équipe:", e);
      return [];
    }
  },

  async _saveTeamMember(data, id = null) {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    const url = id 
      ? `${SUPABASE_URL}/rest/v1/wedding_team?id=eq.${id}` 
      : `${SUPABASE_URL}/rest/v1/wedding_team`;
    
    // Nettoyage pour s'assurer que les heures sont bien transmises
    const cleanData = {
      ...data,
      time_thursday: data.time_thursday || null,
      time_friday: data.time_friday || null,
      time_saturday: data.time_saturday || null
    };

    await fetch(url, {
      method: id ? 'PATCH' : 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(cleanData)
    });
  },

  async _deleteTeamMember(id) {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    await fetch(`${SUPABASE_URL}/rest/v1/wedding_team?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  },

// ════════════════════════════════════════════════════════════
  // RENDU DU TABLEAU ÉQUIPE PRÉPA
  // ════════════════════════════════════════════════════════════
  async renderTeam(guests) {
    const container = document.getElementById('admin-team');
    if (!container) return;

    container.innerHTML = '<p class="text-muted" style="padding:10px 0;">Chargement de l\'équipe...</p>';
    const team = await this._loadTeam();

    // Formatage de l'heure sans coche (ex: 14h30)
    const formatDayBadge = (active, time) => {
      if (!active) return '<span style="color:#ccc;">—</span>';
      let formattedTime = time ? time.slice(0, 5).replace(':', 'h') : 'NC';
      return `<span style="background:var(--gold-light, #E8D5A3); color:#5c4718; font-size:11px; padding:3px 8px; border-radius:4px; font-weight:700; display:inline-block;">${formattedTime}</span>`;
    };

    // Calcul des totaux pour le pied de page (uniquement si loge sur place = oui)
    const totalPeople = team ? team.length : 0;
    // Calcul cumulé : une arrivée le jeudi compte pour le ven/sam, une arrivée le vendredi compte pour le sam
    const totalThu = team ? team.filter(m => m.stays_on_site && m.arrival_thursday).length : 0;
    const totalFri = team ? team.filter(m => m.stays_on_site && (m.arrival_thursday || m.arrival_friday)).length : 0;
    const totalSat = team ? team.filter(m => m.stays_on_site && (m.arrival_thursday || m.arrival_friday || m.arrival_saturday)).length : 0;

    // 1. Tableau collé aux onglets (margin-top: 0)
    let html = `
      <div class="table-responsive" style="margin-top:0;">
        <table class="admin-table" style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gold); text-align: left;">
              <th rowspan="2" style="padding:10px; width:26%; vertical-align:bottom;">Nom &amp; Téléphone</th>
              <th rowspan="2" style="padding:10px; width:20%; vertical-align:bottom;">Rôle(s)</th>
              <th colspan="3" style="padding:6px 10px; text-align:center; border-bottom:1px solid #ddd; color:var(--forest);">Arrivée</th>
              <th rowspan="2" style="padding:10px; width:11%; text-align:center; vertical-align:bottom;">Loge sur place</th>
              <th rowspan="2" style="padding:10px; width:70px; vertical-align:bottom; text-align:center;">Actions</th>
            </tr>
            <tr style="border-bottom: 2px solid var(--gold); text-align: center; font-size:12px;">
              <th style="padding:6px 4px; width:12%; text-align:center;">Jeudi</th>
              <th style="padding:6px 4px; width:12%; text-align:center;">Vendredi</th>
              <th style="padding:6px 4px; width:12%; text-align:center;">Samedi</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (!team || team.length === 0) {
      html += `<tr><td colspan="7" class="text-center text-muted" style="padding:20px;">Aucun membre dans l'équipe pour le moment.</td></tr>`;
    } else {
      team.forEach((m, idx) => {
        const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
        const formattedPhone = typeof formatPhone === 'function' ? formatPhone(m.phone) : (m.phone || '');
        
        // 2. Gestion de l'affichage multi-rôles (max 3)
        const rolesArray = m.role ? m.role.split(',').map(r => r.trim()).slice(0, 3) : ['Organisation'];
        const rolesHtml = rolesArray.map(r => `
          <span class="badge" style="background:#e8f0e6; color:var(--forest); border:1px solid var(--sage); font-weight:600; padding:2px 6px; border-radius:4px; font-size:11px; display:inline-block; margin:1px 2px 1px 0;">
            ${r}
          </span>`).join('');

        html += `
          <tr style="background:${bg}; border-bottom:1px solid #eee;">
            <td style="padding:10px; word-wrap:break-word;">
              <strong>${m.name || 'Sans nom'}</strong>
              ${formattedPhone ? `<br><small style="color:var(--text-muted); font-family:monospace; font-size:12px;">${formattedPhone}</small>` : ''}
            </td>
            <td style="padding:10px;">
              <div style="display:flex; flex-wrap:wrap; gap:2px;">${rolesHtml}</div>
            </td>
            <td style="padding:10px; text-align:center;">${formatDayBadge(m.arrival_thursday, m.time_thursday)}</td>
            <td style="padding:10px; text-align:center;">${formatDayBadge(m.arrival_friday, m.time_friday)}</td>
            <td style="padding:10px; text-align:center;">${formatDayBadge(m.arrival_saturday, m.time_saturday)}</td>
            <td style="padding:10px; text-align:center;">
              ${m.stays_on_site ? '<span style="background:#d1fae5; color:#065f46; padding:3px 8px; border-radius:12px; font-size:12px; font-weight:600;">Oui</span>' : '<span style="color:#999;">Non</span>'}
            </td>
            <td style="padding:10px; display:flex; gap:6px; justify-content:center;">
              <button class="btn btn--outline edit-team-btn" data-id="${m.id}" style="padding:2px 6px; font-size:13px; color:var(--gold); border-color:var(--gold); cursor:pointer;" title="Modifier">✏️</button>
              <button class="btn btn--outline delete-team-btn" data-id="${m.id}" style="padding:2px 6px; font-size:13px; color:red; border-color:red; cursor:pointer;" title="Supprimer">×</button>
            </td>
          </tr>
        `;
      });
    }

    // 5. Ligne de totaux en fin de tableau
    html += `
          </tbody>
          <tfoot>
            <tr style="background:#fdfaf5; border-top: 2px solid var(--gold); font-weight:700; color:var(--forest); font-size:13px;">
              <td style="padding:12px 10px;">Total : ${totalPeople} personne${totalPeople > 1 ? 's' : ''}</td>
              <td style="padding:12px 10px; text-align:right; font-size:11px; color:var(--text-muted); font-weight:normal;">Logeant sur place :</td>
              <td style="padding:12px 4px; text-align:center; color:var(--forest);">${totalThu}</td>
              <td style="padding:12px 4px; text-align:center; color:var(--forest);">${totalFri}</td>
              <td style="padding:12px 4px; text-align:center; color:var(--forest);">${totalSat}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-top:16px; display:flex; justify-content:flex-start;">
        <button class="btn btn--primary btn--sm" id="add-team-btn" style="background:var(--forest); color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">+ Ajouter un membre</button>
      </div>
    `;

    container.innerHTML = html;

    // Réattachement des événements
    document.getElementById('add-team-btn')?.addEventListener('click', () => {
      this.openTeamModal(null, guests);
    });

    container.querySelectorAll('.edit-team-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = team.find(item => item.id == e.currentTarget.dataset.id);
        if (target) this.openTeamModal(target, guests);
      });
    });

    container.querySelectorAll('.delete-team-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm("Supprimer cette personne de l'équipe prépa ?")) {
          await this._deleteTeamMember(e.currentTarget.dataset.id);
          if (typeof Animations !== 'undefined' && Animations.showToast) {
            Animations.showToast("Membre supprimé", "success");
          }
          await this.renderTeam(guests);
        }
      });
    });
  },
  
// ════════════════════════════════════════════════════════════
  // MODALE AJOUT / MODIFICATION ÉQUIPE PRÉPA (AVEC MULTI-RÔLES)
  // ════════════════════════════════════════════════════════════
  openTeamModal(member, guests) {
    const existing = document.getElementById('admin-team-modal');
    if (existing) existing.remove();

    const guestOptions = guests
      .filter(g => g.attending === true || g.attending === 'true' || g.attending === 'oui' || g.attending === 1)
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
      .map(g => `<option value="${g.id}" ${member?.guest_id === g.id ? 'selected' : ''}>${g.firstName || ''} ${g.lastName || ''} (${typeof formatPhone === 'function' ? formatPhone(g.phone) : g.phone || 'Sans tel'})</option>`)
      .join('');

    // Rôles disponibles et rôles actuellement assignés
    const availableRoles = ['Messe', 'Animation', 'Covoiturage', 'Décoration', 'Fleuriste', 'Sono', 'Photographe', 'Logistique', 'Traiteur', 'Coordination'];
    const currentRoles = member?.role ? member.role.split(',').map(r => r.trim()) : ['Organisation'];

    const rolesCheckboxesHtml = availableRoles.map(role => {
      const isChecked = currentRoles.includes(role);
      return `
        <label style="display:inline-flex; align-items:center; gap:6px; background:#f4f8f3; border:1px solid #c8dcc4; padding:6px 10px; border-radius:6px; font-size:12px; cursor:pointer; color:var(--forest); font-weight:500;">
          <input type="checkbox" name="team-role-cb" value="${role}" ${isChecked ? 'checked' : ''} style="accent-color:var(--forest); width:14px; height:14px; margin:0;">
          ${role}
        </label>
      `;
    }).join('');

    const modalHtml = `
      <div id="admin-team-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);">
        <div style="background:var(--cream, #FAF8F5); border-radius:var(--radius-lg, 20px); width:95%; max-width:520px; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 15px 35px rgba(0,0,0,0.25); border:1px solid var(--gold);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--gold-light); padding-bottom:12px; margin-bottom:16px;">
            <h3 style="margin:0; font-family:var(--font-display); color:var(--forest); font-size:22px;">
              ${member ? '✏️ Modifier le membre' : '➕ Ajouter à l\'équipe prépa'}
            </h3>
            <button type="button" id="team-close-x" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-muted);">×</button>
          </div>

          <form id="admin-team-form" style="display:flex; flex-direction:column; gap:16px; text-align:left;">
            
            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0; background:#fff;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px; font-size:13px;">👤 Identité</legend>
              <div style="margin-bottom:10px;">
                <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">Auto-remplir depuis un invité :</label>
                <select id="team-guest-select" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; background:#fdfcfa;">
                  <option value="">-- Saisie manuelle ou prestataire externe --</option>
                  ${guestOptions}
                </select>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Nom affiché *</label>
                  <input type="text" id="team-name" value="${member?.name || ''}" placeholder="Ex: Alexandre Dupont" required style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
                </div>
                <div>
                  <label style="font-size:12px; color:var(--text-muted);">Téléphone</label>
                  <input type="text" id="team-phone" value="${member?.phone || ''}" placeholder="06 00 00 00 00" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;" />
                </div>
              </div>
            </fieldset>

            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0; background:#fff;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px; font-size:13px;">🏷️ Missions (3 maximum)</legend>
              <p id="role-limit-msg" style="font-size:11px; color:#c2410c; margin:0 0 8px 0; display:none;">⚠️ Vous ne pouvez sélectionner que 3 rôles maximum.</p>
              <div id="roles-container" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
                ${rolesCheckboxesHtml}
              </div>
              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Autre rôle (optionnel) :</label>
              <input type="text" id="team-role-custom" placeholder="Ex: Chauffeur mariés..." style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid #ccc; font-size:12px; box-sizing:border-box;" />
            </fieldset>

            <fieldset style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:0; background:#fff;">
              <legend style="font-weight:600; color:var(--forest); padding:0 6px; font-size:13px;">📅 Planning d'arrivée &amp; Logement</legend>
              
              <div style="display:grid; grid-template-columns: 1fr 110px; gap:8px; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed #eee;">
                <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
                  <input type="checkbox" id="team-arr-thu" ${member?.arrival_thursday ? 'checked' : ''} style="accent-color:var(--forest); width:16px; height:16px;">
                  Arrivée Jeudi (6 mai)
                </label>
                <input type="time" id="team-time-thu" value="${member?.time_thursday || ''}" style="padding:4px 6px; border:1px solid #ccc; border-radius:6px; font-size:12px;">
              </div>

              <div style="display:grid; grid-template-columns: 1fr 110px; gap:8px; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed #eee;">
                <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
                  <input type="checkbox" id="team-arr-fri" ${member?.arrival_friday ? 'checked' : ''} style="accent-color:var(--forest); width:16px; height:16px;">
                  Arrivée Vendredi (7 mai)
                </label>
                <input type="time" id="team-time-fri" value="${member?.time_friday || ''}" style="padding:4px 6px; border:1px solid #ccc; border-radius:6px; font-size:12px;">
              </div>

              <div style="display:grid; grid-template-columns: 1fr 110px; gap:8px; align-items:center; margin-bottom:12px;">
                <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
                  <input type="checkbox" id="team-arr-sat" ${member?.arrival_saturday ? 'checked' : ''} style="accent-color:var(--forest); width:16px; height:16px;">
                  Arrivée Samedi (8 mai)
                </label>
                <input type="time" id="team-time-sat" value="${member?.time_saturday || ''}" style="padding:4px 6px; border:1px solid #ccc; border-radius:6px; font-size:12px;">
              </div>

              <div style="background:#f4f8f3; padding:10px; border-radius:6px; border:1px solid #c8dcc4;">
                <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; font-weight:600; color:var(--forest);">
                  <input type="checkbox" id="team-onsite" ${member?.stays_on_site ? 'checked' : ''} style="accent-color:var(--forest); width:18px; height:18px;">
                  Loge sur place au Domaine
                </label>
              </div>
            </fieldset>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
              <button type="button" id="team-cancel-btn" class="btn btn--outline" style="padding:10px 18px;">Annuler</button>
              <button type="submit" class="btn btn--primary" style="padding:10px 18px; background:var(--forest); color:#fff; border:none; border-radius:var(--radius-sm); font-weight:600; cursor:pointer;">Enregistrer</button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('admin-team-modal');
    const closeX = document.getElementById('team-close-x');
    const cancelBtn = document.getElementById('team-cancel-btn');
    const form = document.getElementById('admin-team-form');
    const guestSelect = document.getElementById('team-guest-select');
    const roleCheckboxes = modal.querySelectorAll('input[name="team-role-cb"]');
    const limitMsg = document.getElementById('role-limit-msg');

    const closeModal = () => modal.remove();
    closeX.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // 2. Limitation stricte à 3 cases à cocher maximum pour les rôles
    roleCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const checkedCount = modal.querySelectorAll('input[name="team-role-cb"]:checked').length;
        if (checkedCount > 3) {
          cb.checked = false;
          limitMsg.style.display = 'block';
          setTimeout(() => { limitMsg.style.display = 'none'; }, 3000);
        }
      });
    });

    guestSelect.addEventListener('change', (e) => {
      const gId = e.target.value;
      if (!gId) return;
      const selectedGuest = guests.find(g => g.id == gId);
      if (selectedGuest) {
        document.getElementById('team-name').value = `${selectedGuest.firstName || ''} ${selectedGuest.lastName || ''}`.trim();
        document.getElementById('team-phone').value = selectedGuest.phone || '';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Récupérer et assembler les rôles (max 3)
      const selectedRoles = Array.from(modal.querySelectorAll('input[name="team-role-cb"]:checked')).map(cb => cb.value);
      const customRole = document.getElementById('team-role-custom').value.trim();
      if (customRole && selectedRoles.length < 3) {
        selectedRoles.push(customRole);
      }
      const finalRoleString = selectedRoles.length > 0 ? selectedRoles.slice(0, 3).join(', ') : 'Organisation';

      const payload = {
        guest_id: guestSelect.value || null,
        name: document.getElementById('team-name').value.trim(),
        phone: document.getElementById('team-phone').value.trim(),
        role: finalRoleString,
        arrival_thursday: document.getElementById('team-arr-thu').checked,
        time_thursday: document.getElementById('team-time-thu').value || null,
        arrival_friday: document.getElementById('team-arr-fri').checked,
        time_friday: document.getElementById('team-time-fri').value || null,
        arrival_saturday: document.getElementById('team-arr-sat').checked,
        time_saturday: document.getElementById('team-time-sat').value || null,
        stays_on_site: document.getElementById('team-onsite').checked
      };

      try {
        await this._saveTeamMember(payload, member?.id);
        if (typeof Animations !== 'undefined' && Animations.showToast) {
          Animations.showToast(member ? "Membre mis à jour" : "Membre ajouté à l'équipe", "success");
        }
        closeModal();
        await this.renderTeam(guests);
      } catch (err) {
        console.error("Erreur sauvegarde:", err);
        alert("Erreur lors de l'enregistrement ! Vérifiez les permissions SQL dans Supabase.");
      }
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
	
	// Pré-cochage automatique des jours suivants (décochable manuellement)
    document.getElementById('team-arr-thu')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.getElementById('team-arr-fri').checked = true;
        document.getElementById('team-arr-sat').checked = true;
      }
    });

    document.getElementById('team-arr-fri')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.getElementById('team-arr-sat').checked = true;
      }
    });
	
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

  // ════════════════════════════════════════════════════════════
  // API SUPABASE : MOODBOARD
  // ════════════════════════════════════════════════════════════
async _loadMoodboard(category) {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    try {
      // Modifié ici : order=position.asc,id.desc
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/moodboard_items?category=eq.${encodeURIComponent(category)}&order=position.asc,id.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      return res.ok ? await res.json() : [];
    } catch (e) {
      console.error("Erreur chargement moodboard:", e);
      return [];
    }
  },

async _saveMoodboardItem(item) {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    await fetch(`${SUPABASE_URL}/rest/v1/moodboard_items`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(item)
    });
  },

async _deleteMoodboardItem(id) {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    await fetch(`${SUPABASE_URL}/rest/v1/moodboard_items?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  },
  
// ════════════════════════════════════════════════════════════
  // RENDU DU MOODBOARD (STYLE PINTEREST + TRI GLISSER-DÉPOSER)
  // ════════════════════════════════════════════════════════════
  async renderMoodboard(activeCategory = 'Faire-parts') {
    const container = document.getElementById('admin-moodboard');
    if (!container) return;

    const categories = [
      'Faire-parts', 'Robe de mariée', 'Coiffure', 'Maquillage', 'Bouquet',
      'Décoration église', 'Décoration réception', 'Plan de table', 'Tables'
    ];

    const items = await this._loadMoodboard(activeCategory);

    // 1. Navigation
    const subNavHtml = categories.map(cat => `
      <button class="moodboard-nav-btn" data-cat="${cat}"
              style="padding: 6px 14px; border-radius: 20px; border: 1px solid var(--gold); 
                     background: ${cat === activeCategory ? 'var(--forest)' : '#fff'}; 
                     color: ${cat === activeCategory ? '#fff' : 'var(--forest)'}; 
                     font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s;">
        ${cat}
      </button>
    `).join('');

    // 2. Grille avec cartes DRAGGABLES pour le tri
    let gridHtml = items.map((item, index) => {
      const isLarge = item.size === 'large';
      const cardStyle = isLarge 
        ? "break-inside: avoid; margin-bottom: 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.12); background: #fff; position: relative; border: 2px solid var(--gold-light); cursor: grab; transition: transform 0.15s, border-color 0.15s;"
        : "break-inside: avoid; margin-bottom: 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); background: #fff; position: relative; cursor: grab; transition: transform 0.15s, border-color 0.15s;";

      return `
        <div class="moodboard-card" draggable="true" data-id="${item.id}" data-index="${index}" data-size="${item.size || 'normal'}" style="${cardStyle}">
          <img src="${item.image_url}" alt="Inspiration" 
               style="width: 100%; height: auto; display: block; max-height: ${isLarge ? '600px' : '380px'}; object-fit: cover; pointer-events: none;">
          
          <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; opacity: 0.85;">
            <button class="resize-moodboard-btn" data-id="${item.id}" data-size="${isLarge ? 'normal' : 'large'}"
                    title="${isLarge ? 'Réduire' : 'Mettre en vedette (Grand format)'}"
                    style="background: var(--sage, #84a98c); color: white; border: none; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ${isLarge ? '🗜️' : '⭐'}
            </button>
            <button class="delete-moodboard-btn" data-id="${item.id}" title="Supprimer"
                    style="background: var(--sage, #84a98c); color: white; border: none; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ×
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #eee;">
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">${subNavHtml}</div>
        <button id="add-moodboard-url-btn" class="btn btn--outline btn--sm" 
                style="border-color: var(--sage, #84a98c); color: var(--forest); font-size: 12px; padding: 6px 12px; border-radius: 20px; display: flex; align-items: center; gap: 6px; background: #fff; cursor: pointer;">
          <span>➕ Coller le lien d'une image</span>
        </button>
      </div>

      <div id="moodboard-grid-area" style="min-height: 200px; border: 2px dashed transparent; border-radius: 12px; transition: all 0.2s; padding: 4px;">
        <div style="column-count: 3; column-gap: 16px; width: 100%;">
          ${gridHtml || '<p class="text-muted" style="text-align:center; padding: 40px 0; font-style: italic;">Aucune image ici. Glissez-déposez une image depuis un autre onglet ou cliquez sur "Coller le lien" !</p>'}
        </div>
      </div>
    `;

    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
      @media (max-width: 900px) { #moodboard-grid-area > div { column-count: 2 !important; } }
      @media (max-width: 600px) { #moodboard-grid-area > div { column-count: 1 !important; } }
      .moodboard-card:hover div { opacity: 1 !important; }
      .moodboard-card:active { cursor: grabbing !important; }
    `;
    container.appendChild(styleBlock);

    // 3. Navigation & Actions boutons
    container.querySelectorAll('.moodboard-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.renderMoodboard(e.currentTarget.dataset.cat));
    });

    container.querySelectorAll('.delete-moodboard-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm("Supprimer cette image ?")) {
          await this._deleteMoodboardItem(e.currentTarget.dataset.id);
          if (typeof Animations !== 'undefined' && Animations.showToast) Animations.showToast("Image supprimée", "success");
          this.renderMoodboard(activeCategory);
        }
      });
    });

    container.querySelectorAll('.resize-moodboard-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const newSize = e.currentTarget.dataset.size;
        const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
        await fetch(`${SUPABASE_URL}/rest/v1/moodboard_items?id=eq.${id}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: newSize })
        });
        this.renderMoodboard(activeCategory);
      });
    });

    document.getElementById('add-moodboard-url-btn').addEventListener('click', async () => {
      const url = prompt("Collez l'URL (lien https://...) de l'image :");
      if (url && url.startsWith('http')) {
        await this._saveMoodboardItem({ category: activeCategory, image_url: url, size: 'normal', position: items.length });
        if (typeof Animations !== 'undefined' && Animations.showToast) Animations.showToast("Image ajoutée !", "success");
        this.renderMoodboard(activeCategory);
      }
    });

    // ════════════════════════════════════════════════════════════
    // 4. GESTION DU TRI GLISSER-DÉPOSER (RÉORGANISER LES CARTES)
    // ════════════════════════════════════════════════════════════
    container.querySelectorAll('.moodboard-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        // Identification unique d'une carte interne
        e.dataTransfer.setData('text/internal-id', card.dataset.id);
        card.style.opacity = '0.4';
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.style.transform = 'scale(1.03)';
        card.style.borderColor = 'var(--forest, #2D5A3D)';
      });

      card.addEventListener('dragleave', () => {
        card.style.transform = 'none';
        card.style.borderColor = card.dataset.size === 'large' ? 'var(--gold-light)' : 'transparent';
      });

      // DROP SUR UNE AUTRE CARTE = PERMUTATION / RÉORDONNEMENT
      card.addEventListener('drop', async (e) => {
        e.stopPropagation(); // ⚠️ CAPITAL : Empêche la grille de croire à un nouvel ajout d'image !
        e.preventDefault();
        
        card.style.transform = 'none';
        card.style.borderColor = card.dataset.size === 'large' ? 'var(--gold-light)' : 'transparent';

        const draggedId = e.dataTransfer.getData('text/internal-id');
        const targetId = card.dataset.id;

        // Si on a bien glissé une carte interne sur une autre carte interne différente
        if (draggedId && draggedId !== targetId) {
          const draggedIndex = items.findIndex(i => i.id == draggedId);
          const targetIndex = items.findIndex(i => i.id == targetId);
          
          // Réorganisation instantanée en mémoire
          const [draggedItem] = items.splice(draggedIndex, 1);
          items.splice(targetIndex, 0, draggedItem);

          // Rendu visuel immédiat pour l'utilisateur
          this.renderMoodboard(activeCategory);

          // Sauvegarde silencieuse en arrière-plan des nouvelles positions dans Supabase
          const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
          const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
          
          await Promise.all(items.map((it, idx) => 
            fetch(`${SUPABASE_URL}/rest/v1/moodboard_items?id=eq.${it.id}`, {
              method: 'PATCH',
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: idx })
            })
          ));
        }
      });
    });

    // ════════════════════════════════════════════════════════════
    // 5. AJOUT D'IMAGES DEPUIS INTERNET (ANTI-DÉDOUBLEMENT)
    // ════════════════════════════════════════════════════════════
    const gridArea = document.getElementById('moodboard-grid-area');

    gridArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      // Si c'est un déplacement de carte interne, on ne change pas le fond
      if (!e.dataTransfer.types.includes('text/internal-id')) {
        gridArea.style.borderColor = 'var(--sage, #84a98c)';
        gridArea.style.background = '#f4f8f3';
      }
    });

    gridArea.addEventListener('dragleave', () => {
      gridArea.style.borderColor = 'transparent';
      gridArea.style.background = 'transparent';
    });

    gridArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      gridArea.style.borderColor = 'transparent';
      gridArea.style.background = 'transparent';

      // ⚠️ SÉCURITÉ ANTI-DÉDOUBLEMENT : Si l'élément relâché est une carte interne, on s'arrête net !
      if (e.dataTransfer.getData('text/internal-id')) return;

      const htmlData = e.dataTransfer.getData('text/html');
      const textData = e.dataTransfer.getData('text/plain');
      let imageUrl = null;

      if (htmlData) {
        const match = htmlData.match(/src\s*=\s*["']([^"']+)["']/i);
        if (match && match[1]) imageUrl = match[1];
      }
      if (!imageUrl && textData && (textData.startsWith('http://') || textData.startsWith('https://'))) {
        imageUrl = textData;
      }

      if (imageUrl) {
        await this._saveMoodboardItem({ category: activeCategory, image_url: imageUrl, size: 'normal', position: items.length });
        if (typeof Animations !== 'undefined' && Animations.showToast) Animations.showToast("Image ajoutée !", "success");
        this.renderMoodboard(activeCategory);
      } else {
        alert("Impossible de lire ce lien. Utilisez le bouton 'Coller le lien d'une image' juste au-dessus !");
      }
    });
  },
  
  // ════════════════════════════════════════════════════════════
  // API SUPABASE : MESSE
  // ════════════════════════════════════════════════════════════
  async _loadMassDb() {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/wedding_mass?id=eq.main&select=data`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].data) return rows[0].data;
      }
    } catch (e) { console.error("Erreur chargement messe:", e); }
    return { roles: {}, schedule: {} };
  },

  async _saveMassDb(data) {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    await fetch(`${SUPABASE_URL}/rest/v1/wedding_mass`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: 'main', data })
    });
  },

  // ════════════════════════════════════════════════════════════
  // RENDU DE L'ONGLET MESSE
  // ════════════════════════════════════════════════════════════
  async renderMass(guests, activeSubTab = 'roles') {
    const container = document.getElementById('admin-messe');
    if (!container) return;

    const massData = await this._loadMassDb();
    const rolesData = massData.roles || {};
    const scheduleData = massData.schedule || {};

    // 1. Boutons de sous-navigation
    const subNavHtml = `
      <div style="display:flex; gap:8px; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid #eee;">
        <button class="mass-nav-btn ${activeSubTab === 'roles' ? 'active' : ''}" data-sub="roles"
                style="padding: 8px 16px; border-radius: 20px; border: 1px solid var(--gold); background: ${activeSubTab === 'roles' ? 'var(--forest)' : '#fff'}; color: ${activeSubTab === 'roles' ? '#fff' : 'var(--forest)'}; font-weight: 600; cursor: pointer; font-size: 13px;">
          👥 1. Qui fait quoi ?
        </button>
        <button class="mass-nav-btn ${activeSubTab === 'schedule' ? 'active' : ''}" data-sub="schedule"
                style="padding: 8px 16px; border-radius: 20px; border: 1px solid var(--gold); background: ${activeSubTab === 'schedule' ? 'var(--forest)' : '#fff'}; color: ${activeSubTab === 'schedule' ? '#fff' : 'var(--forest)'}; font-weight: 600; cursor: pointer; font-size: 13px;">
          📜 2. Déroulé de la messe
        </button>
      </div>
    `;

    // Filtre des invités confirmés pour l'autocomplétion
    const confirmedGuests = guests
      .filter(g => g.attending === true || g.attending === 'true' || g.attending === 'oui' || g.attending === 1)
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    // ════════════════════════════════════════════════════════════
    // SOUS-ONGLET 1 : QUI FAIT QUOI ?
    // ════════════════════════════════════════════════════════════
    if (activeSubTab === 'roles') {
      const predefinedRoles = [
        { label: 'Prêtre célébrant', multi: false },
        { label: 'Curé', multi: false },
        { label: 'Sacristine', multi: false },
        { label: 'Service de l\'autel', multi: true },
        { label: 'Animation des chants', multi: true },
        { label: 'Chorale', multi: true },
        { label: 'Instruments', multi: true },
        { label: 'Première lecture', multi: false },
        { label: 'Deuxième lecture', multi: false },
        { label: 'Prière universelle', multi: true },
        { label: 'Accueil des invités', multi: true }
      ];

      let rowsHtml = predefinedRoles.map((roleObj, idx) => {
        const role = roleObj.label;
        const stored = rolesData[role];
        
        let rArray = Array.isArray(stored) ? stored : (stored ? [stored] : []);
        if (!rArray || rArray.length === 0) {
          rArray = [{ name: '', phone: '', email: '' }];
        }

        const bg = idx % 2 === 0 ? '#fafafa' : '#fff';

        const inputsHtml = rArray.map((item, subIdx) => `
          <div class="role-entry-row" style="display:flex; gap:8px; margin-bottom:${subIdx < rArray.length - 1 ? '8px' : '0'}; align-items:center;">
            <div style="position:relative; flex:1;">
              <input type="text" class="mass-role-input autocomplete-name" data-role="${role}" data-field="name" value="${item.name || ''}" placeholder="Nom..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;">
              <div class="autocomplete-list" style="position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #ccc; border-radius:4px; max-height:150px; overflow-y:auto; z-index:1000; display:none; box-shadow:0 4px 10px rgba(0,0,0,0.1);"></div>
            </div>
            <div style="flex:1;">
              <input type="text" class="mass-role-input" data-role="${role}" data-field="phone" value="${item.phone || ''}" placeholder="Téléphone..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;">
            </div>
            <div style="flex:1;">
              <input type="text" class="mass-role-input" data-role="${role}" data-field="email" value="${item.email || ''}" placeholder="Mail..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;">
            </div>
            ${subIdx > 0 ? `<button type="button" class="btn-remove-subrow" style="background:none; border:none; color:red; cursor:pointer; font-size:16px; padding:0 4px;" title="Supprimer cette ligne">×</button>` : `<div style="width:20px;"></div>`}
          </div>
        `).join('');

        return `
          <tr style="background:${bg}; border-bottom:1px solid #eee;" data-row-role="${role}">
            <td style="padding:12px; font-weight:700; color:var(--forest); width:24%; vertical-align:top;">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <span>${role}</span>
                ${roleObj.multi ? `<button type="button" class="btn-add-role-row" data-role="${role}" style="background:var(--sage); color:#fff; border:none; border-radius:4px; width:22px; height:22px; font-size:14px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" title="Ajouter une personne">+</button>` : ''}
              </div>
            </td>
            <td style="padding:10px; width:66%;" class="role-inputs-container">
              ${inputsHtml}
            </td>
            <td style="padding:10px; width:10%; text-align:center; vertical-align:top;">
              <button type="button" class="btn-clear-role" data-role="${role}" style="background:none; border:1px solid #ddd; border-radius:4px; padding:4px 8px; color:var(--text-muted); cursor:pointer; font-size:11px;" title="Effacer la ligne">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        ${subNavHtml}
        <div class="table-responsive">
          <table style="width:100%; border-collapse:collapse; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.05); border-radius:8px; overflow:visible;">
            <thead>
              <tr style="background:#fdfaf5; border-bottom:2px solid var(--gold); text-align:left; font-size:12px; color:var(--text-muted); text-transform:uppercase;">
                <th style="padding:10px 12px;">Rôle / Mission</th>
                <th style="padding:10px 10px;">Intervenant(s) (Nom, Téléphone, Mail)</th>
                <th style="padding:10px 8px; text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <div style="margin-top:16px; display:flex; justify-content:flex-end;">
          <button id="save-mass-roles-btn" class="btn btn--primary" style="background:var(--forest); color:#fff; border:none; padding:10px 24px; border-radius:6px; font-weight:600; cursor:pointer;">
            Valider
          </button>
        </div>
      `;

      const attachAutocomplete = (input) => {
        input.addEventListener('input', (e) => {
          const val = e.target.value.trim().toLowerCase();
          const listDiv = e.target.nextElementSibling;
          listDiv.innerHTML = '';

          if (val.length < 1) {
            listDiv.style.display = 'none';
            return;
          }

          const matches = confirmedGuests.filter(g => {
            const fullName = `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase();
            return fullName.includes(val);
          });

          if (matches.length === 0) {
            listDiv.style.display = 'none';
            return;
          }

          matches.forEach(g => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = "padding:8px; font-size:12px; cursor:pointer; border-bottom:1px solid #eee; background:#fff; color:var(--forest);";
            itemDiv.textContent = `${g.firstName || ''} ${g.lastName || ''} (${g.phone || 'Sans tel'})`;
            
            itemDiv.addEventListener('mouseover', () => itemDiv.style.background = '#f4f8f3');
            itemDiv.addEventListener('mouseout', () => itemDiv.style.background = '#fff');
            
            itemDiv.addEventListener('click', () => {
              const row = input.closest('.role-entry-row');
              input.value = `${g.firstName || ''} ${g.lastName || ''}`.trim();
              const phoneInput = row.querySelector('input[data-field="phone"]');
              const emailInput = row.querySelector('input[data-field="email"]');
              if (phoneInput) phoneInput.value = g.phone || '';
              if (emailInput) emailInput.value = g.email || '';
              listDiv.style.display = 'none';
            });
            listDiv.appendChild(itemDiv);
          });
          listDiv.style.display = 'block';
        });

        document.addEventListener('click', (e) => {
          if (!input.contains(e.target)) {
            const listDiv = input.nextElementSibling;
            if (listDiv) listDiv.style.display = 'none';
          }
        });
      };

      container.querySelectorAll('.autocomplete-name').forEach(attachAutocomplete);

      container.querySelectorAll('.btn-add-role-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const role = e.currentTarget.dataset.role;
          const tr = container.querySelector(`tr[data-row-role="${role}"]`);
          const tdInputs = tr.querySelector('.role-inputs-container');
          
          const newRow = document.createElement('div');
          newRow.className = "role-entry-row";
          newRow.style.cssText = "display:flex; gap:8px; margin-top:8px; align-items:center;";
          newRow.innerHTML = `
            <div style="position:relative; flex:1;">
              <input type="text" class="mass-role-input autocomplete-name" data-role="${role}" data-field="name" value="" placeholder="Nom..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;">
              <div class="autocomplete-list" style="position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #ccc; border-radius:4px; max-height:150px; overflow-y:auto; z-index:1000; display:none; box-shadow:0 4px 10px rgba(0,0,0,0.1);"></div>
            </div>
            <div style="flex:1;">
              <input type="text" class="mass-role-input" data-role="${role}" data-field="phone" value="" placeholder="Téléphone..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;">
            </div>
            <div style="flex:1;">
              <input type="text" class="mass-role-input" data-role="${role}" data-field="email" value="" placeholder="Mail..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;">
            </div>
            <button type="button" class="btn-remove-subrow" style="background:none; border:none; color:red; cursor:pointer; font-size:16px; padding:0 4px;" title="Supprimer cette ligne">×</button>
          `;
          
          tdInputs.appendChild(newRow);
          attachAutocomplete(newRow.querySelector('.autocomplete-name'));
          
          newRow.querySelector('.btn-remove-subrow').addEventListener('click', () => {
            newRow.remove();
          });
        });
      });

      container.querySelectorAll('.btn-remove-subrow').forEach(btn => {
        btn.addEventListener('click', (e) => e.currentTarget.closest('.role-entry-row').remove());
      });

      container.querySelectorAll('.btn-clear-role').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const role = e.currentTarget.dataset.role;
          const tr = container.querySelector(`tr[data-row-role="${role}"]`);
          tr.querySelectorAll('input').forEach(inp => inp.value = '');
          const subrows = tr.querySelectorAll('.role-entry-row');
          subrows.forEach((row, idx) => { if (idx > 0) row.remove(); });
        });
      });

      document.getElementById('save-mass-roles-btn').addEventListener('click', async () => {
        const newRoles = {};
        container.querySelectorAll('tr[data-row-role]').forEach(tr => {
          const role = tr.dataset.rowRole;
          const entries = [];
          tr.querySelectorAll('.role-entry-row').forEach(row => {
            const name = row.querySelector('input[data-field="name"]').value.trim();
            const phone = row.querySelector('input[data-field="phone"]').value.trim();
            const email = row.querySelector('input[data-field="email"]').value.trim();
            if (name || phone || email) {
              entries.push({ name, phone, email });
            }
          });
          newRoles[role] = entries.length === 1 ? entries[0] : entries;
        });
        
        massData.roles = newRoles;
        await this._saveMassDb(massData);
        if (typeof Animations !== 'undefined' && Animations.showToast) {
          Animations.showToast("Équipe liturgique enregistrée", "success");
        }
      });
    }

    // ════════════════════════════════════════════════════════════
    // SOUS-ONGLET 2 : DÉROULÉ DE LA MESSE (ERGO OPTIMISÉE)
    // ════════════════════════════════════════════════════════════
    if (activeSubTab === 'schedule') {
      const massSteps = [
        'Procession', 'Entrée des mariés', 'Gloria', 'Première lecture', 'Psaume', 
        'Deuxième lecture', 'Alléluia', 'Evangile', 'Litanie des saints (facultatif)', 'Credo', 
        'Appel des témoins', 'Dialogue initial', 'Bénédiction et échange des alliances', 
        'Action de grâce', 'Prière des époux (facultative)', 'Prière universelle', 
        'Quête', 'Offertoire', 'Sanctus', 'Notre-Père', 'Bénédiction nuptiale', 
        'Agnus Dei', 'Communion', 'Consécration à Marie (facultatif)', 
        'Bénédiction finale', 'Signature des registres (époux, témoins, prêtre)', 'Sortie'
      ];

      // Générateur de cellules intelligentes : Bouton minimaliste +, Auto-resize, Bouton × et Liens cliquables
      const renderToggleField = (step, field, value, label, isTextarea = true) => {
        const hasValue = value && value.trim() !== '';
        const inputStyle = `width:100%; padding:6px 22px 6px 6px; border:1px solid #ccc; border-radius:4px; font-size:12px; font-family:var(--font-body); box-sizing:border-box; overflow:hidden; ${isTextarea ? 'resize:none; min-height:34px;' : ''}`;
        
        // 1. Bouton + minimaliste (plus esthétique sans texte)
        const btnStyle = `display: ${hasValue ? 'none' : 'inline-flex'}; align-items:center; justify-content:center; background:#f8f9fa; border:1px dashed #ced4da; color:#6c757d; width:28px; height:28px; border-radius:4px; font-size:15px; font-weight:bold; cursor:pointer; transition:all 0.2s;`;
        
        return `
          <div class="field-toggle-wrap" style="position:relative;">
            <button type="button" class="btn-reveal-field" style="${btnStyle}" title="Ajouter : ${label}">+</button>
            <div class="input-wrapper" style="display: ${hasValue ? 'block' : 'none'}; position:relative;">
              ${isTextarea 
                ? `<textarea class="mass-sched-input auto-expand" data-step="${step}" data-field="${field}" rows="1" placeholder="${label}..." style="${inputStyle}">${value || ''}</textarea>`
                : `<input type="text" class="mass-sched-input" data-step="${step}" data-field="${field}" value="${value || ''}" placeholder="${label}..." style="${inputStyle}">`
              }
              <!-- 2. Bouton × pour supprimer et refermer la case -->
              <button type="button" class="btn-close-field" style="position:absolute; top:4px; right:4px; background:none; border:none; color:#aaa; font-size:15px; cursor:pointer; padding:0 4px; line-height:1;" title="Vider et fermer">×</button>
              <!-- 3. Conteneur pour afficher le badge de lien cliquable -->
              <div class="links-preview-container"></div>
            </div>
          </div>
        `;
      };

      let scheduleRowsHtml = massSteps.map((step, idx) => {
        const sData = scheduleData[step] || { text: '', music: '', sheet: '', responsible: '' };
        const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
        return `
          <tr style="background:${bg}; border-bottom:1px solid #eee;">
            <td style="padding:12px 10px; font-weight:700; color:var(--forest); font-size:13px; width:22%; vertical-align:top;">
              ${idx + 1}. ${step}
            </td>
            <td style="padding:8px; width:22%; vertical-align:top;">
              ${renderToggleField(step, 'text', sData.text, 'Texte / Référence')}
            </td>
            <td style="padding:8px; width:22%; vertical-align:top;">
              ${renderToggleField(step, 'music', sData.music, 'Musique / Chant')}
            </td>
            <td style="padding:8px; width:17%; vertical-align:top;">
              ${renderToggleField(step, 'sheet', sData.sheet, 'Partition (Lien)')}
            </td>
            <td style="padding:8px; width:17%; vertical-align:top;">
              ${renderToggleField(step, 'responsible', sData.responsible, 'Nom(s)', false)}
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        ${subNavHtml}
        <div class="table-responsive">
          <table style="width:100%; border-collapse:collapse; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.05); border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background:#fdfaf5; border-bottom:2px solid var(--gold); text-align:left; font-size:12px; color:var(--text-muted); text-transform:uppercase;">
                <th style="padding:10px 10px;">Étape de la messe</th>
                <th style="padding:10px 8px;">Texte / Lecture</th>
                <th style="padding:10px 8px;">Musique / Chants (Liens)</th>
                <th style="padding:10px 8px;">Partitions</th>
                <th style="padding:10px 8px;">Qui s'en charge</th>
              </tr>
            </thead>
            <tbody>${scheduleRowsHtml}</tbody>
          </table>
        </div>
        <div style="margin-top:16px; display:flex; justify-content:flex-end;">
          <button id="save-mass-sched-btn" class="btn btn--primary" style="background:var(--forest); color:#fff; border:none; padding:10px 24px; border-radius:6px; font-weight:600; cursor:pointer;">
            Valider
          </button>
        </div>
      `;

      // 4. Fonction pour ajuster automatiquement la hauteur du textarea selon son contenu
      const autoResize = (el) => {
        if (!el || el.tagName !== 'TEXTAREA') return;
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight + 2) + 'px';
      };

      // 3. Fonction pour extraire et afficher un lien cliquable sous la zone de saisie
      const updateLinksPreview = (inputEl) => {
        const container = inputEl.closest('.input-wrapper').querySelector('.links-preview-container');
        if (!container) return;
        
        const val = inputEl.value || '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = val.match(urlRegex);
        
        if (links && links.length > 0) {
          container.innerHTML = links.map(url => `
            <a href="${url}" target="_blank" rel="noopener noreferrer" 
               style="display:inline-flex; align-items:center; gap:4px; margin-top:6px; font-size:11px; color:#fff; background:var(--forest); padding:3px 8px; border-radius:12px; text-decoration:none; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.15);">
              🔗 Ouvrir le lien
            </a>
          `).join(' ');
        } else {
          container.innerHTML = '';
        }
      };

      // Initialisation : Ajustement hauteur et affichage des liens existants au chargement
      container.querySelectorAll('.mass-sched-input').forEach(input => {
        if (input.closest('.input-wrapper').style.display !== 'none') {
          autoResize(input);
          updateLinksPreview(input);
        }

        // Événement lors de la frappe ou copier/coller
        input.addEventListener('input', () => {
          autoResize(input);
          updateLinksPreview(input);
        });

        // 2. Magic Blur : Si on quitte une case vide, elle se referme automatiquement !
        input.addEventListener('blur', () => {
          setTimeout(() => {
            if (input.value.trim() === '') {
              const wrap = input.closest('.field-toggle-wrap');
              const inputWrap = wrap?.querySelector('.input-wrapper');
              const revealBtn = wrap?.querySelector('.btn-reveal-field');
              if (inputWrap) inputWrap.style.display = 'none';
              if (revealBtn) revealBtn.style.display = 'inline-flex';
            }
          }, 150);
        });
      });

      // Révéler la case au clic sur le bouton +
      container.querySelectorAll('.btn-reveal-field').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const wrap = e.currentTarget.closest('.field-toggle-wrap');
          e.currentTarget.style.display = 'none';
          const inputWrap = wrap.querySelector('.input-wrapper');
          if (inputWrap) {
            inputWrap.style.display = 'block';
            const input = inputWrap.querySelector('.mass-sched-input');
            if (input) {
              input.focus();
              autoResize(input);
              updateLinksPreview(input);
            }
          }
        });
      });

      // 2. Bouton × : Vider le texte et refermer manuellement la case
      container.querySelectorAll('.btn-close-field').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const wrap = e.currentTarget.closest('.field-toggle-wrap');
          const inputWrap = wrap.querySelector('.input-wrapper');
          const input = wrap.querySelector('.mass-sched-input');
          const revealBtn = wrap.querySelector('.btn-reveal-field');
          
          if (input) {
            input.value = '';
            updateLinksPreview(input);
          }
          if (inputWrap) inputWrap.style.display = 'none';
          if (revealBtn) revealBtn.style.display = 'inline-flex';
        });
      });

      // Sauvegarde
      document.getElementById('save-mass-sched-btn').addEventListener('click', async () => {
        const newSched = {};
        container.querySelectorAll('.mass-sched-input').forEach(input => {
          const step = input.dataset.step;
          const field = input.dataset.field;
          if (!newSched[step]) newSched[step] = {};
          newSched[step][field] = input.value.trim();
        });
        massData.schedule = newSched;
        await this._saveMassDb(massData);
        if (typeof Animations !== 'undefined' && Animations.showToast) {
          Animations.showToast("Déroulé de la messe enregistré", "success");
        }
      });
    }

    // Changement de sous-onglet
    container.querySelectorAll('.mass-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.renderMass(guests, e.currentTarget.dataset.sub));
    });
  },
 
// ════════════════════════════════════════════════════════════
  // GESTION DU PLAN DE TABLE COMPACT & RENOMMABLE (DRAG & DROP)
  // ════════════════════════════════════════════════════════════

  async _loadSeatingDb() {
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/wedding_seating?id=eq.main&select=data`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].data) return rows[0].data;
      }
    } catch (e) { console.warn('Secours localStorage pour le plan de table'); }
    
    const local = localStorage.getItem('wedding_seating_plan');
    return local ? JSON.parse(local) : { guests: {}, tableNames: {} };
  },

  async _saveSeatingDb(data) {
    localStorage.setItem('wedding_seating_plan', JSON.stringify(data));
    const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/wedding_seating`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id: 'main', data })
      });
    } catch (e) { console.error('Erreur sauvegarde Supabase seating:', e); }
  },

  async renderSeatingPlan(guests) {
    const container = document.getElementById('admin-seating-plan');
    if (!container) return;

    // 1. Charger la disposition et assurer la compatibilité de structure
    const rawData = await this._loadSeatingDb();
    const seatingData = {
      guests: rawData.guests || (rawData.tableNames ? {} : rawData), // Rétro-compatibilité
      tableNames: rawData.tableNames || {}
    };
    const seatingMap = seatingData.guests;

    // 2. Extraire et formater tous les invités confirmés + accompagnants
    const allPeople = [];
    guests.forEach(g => {
      const isConfirmed = g.attending === true || g.attending === 'true' || g.attending === 'oui' || g.attending === 1;
      if (!isConfirmed) return;

      const formatName = (first, last) => {
        const f = (first || '').trim();
        const l = (last || '').trim();
        const initial = l ? ` ${l.charAt(0).toUpperCase()}.` : '';
        return `${f}${initial}` || 'Invité';
      };

      allPeople.push({
        id: String(g.id),
        name: formatName(g.firstName, g.lastName),
        table: seatingMap[g.id] || null
      });

      if (Array.isArray(g.companions)) {
        g.companions.forEach((comp, idx) => {
          const compId = `${g.id}__c__${idx}`;
          const parts = (comp.name || '').trim().split(' ');
          const first = parts[0] || 'Accompagnant';
          const last = parts.slice(1).join(' ');
          allPeople.push({
            id: compId,
            name: formatName(first, last),
            table: seatingMap[compId] || null
          });
        });
      }
    });

    // 3. Séparer placés et non placés
    const unassigned = allPeople.filter(p => !p.table || p.table < 1 || p.table > 10);
    const tables = Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      name: seatingData.tableNames[i + 1] || `Table ${i + 1}`,
      guests: allPeople.filter(p => Number(p.table) === i + 1)
    }));

    // 4. CSS Ultra-Compact (Sans scroll, teintes sauge)
    const css = `
      <style>
        .seating-wrapper { margin-top: 4px; font-family: var(--font-body); }
        .seating-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        @media (min-width: 1100px) {
          .seating-grid { grid-template-columns: repeat(5, 1fr); }
        }
        .seating-table-card {
          background: #FAF8F5;
          border: 1.5px solid var(--sage, #9CAF88);
          border-radius: 8px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .seating-table-header {
          font-weight: 700;
          color: var(--forest, #2D5A3D);
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 4px;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }
        .seating-table-header span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 85%;
        }
        .btn-rename-table {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 11px;
          padding: 0 2px;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .btn-rename-table:hover { opacity: 1; }
        .seating-slots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          flex: 1;
        }
        .seat-slot {
          height: 26px;
          border: 1px dashed #dedede;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafbfc;
          transition: all 0.2s;
          overflow: hidden;
        }
        .seat-slot.drag-over {
          background: #e8f0e6;
          border-color: var(--forest);
          transform: scale(1.02);
        }
        .guest-chip {
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          cursor: grab;
          user-select: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
          transition: opacity 0.2s, transform 0.1s;
        }
        /* Style des invités PLACÉS sur les tables (Vert Sauge) */
        .seat-slot .guest-chip {
          background: var(--sage, #9CAF88);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        /* Style des invités NON PLACÉS dans la zone d'attente (Fond blanc, contour sapin) */
        .unassigned-chips .guest-chip {
          width: auto;
          background: #fff;
          color: var(--forest, #2D5A3D);
          border: 1px solid var(--forest, #2D5A3D);
          padding: 4px 10px;
        }
        .guest-chip:active { cursor: grabbing; }
        .guest-chip.dragging { opacity: 0.4; }
        
        .unassigned-pool {
          background: var(--cream, #FAF8F5);
          border: 1px solid var(--gold, #C9A84C);
          border-radius: 10px;
          padding: 10px 14px;
          min-height: 50px;
        }
        .unassigned-pool.drag-over {
          background: #fff8eb;
          border-style: dashed;
        }
        .unassigned-title {
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 8px;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .unassigned-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      </style>
    `;

    let html = `${css}<div class="seating-wrapper">`;

    // Grille compacte des 10 tables
    html += `<div class="seating-grid">`;
    tables.forEach(t => {
      const safeName = t.name.replace(/'/g, "\\'");
      html += `
        <div class="seating-table-card">
          <div class="seating-table-header">
            <span id="t-name-${t.number}" title="${t.name}">${t.name}</span>
            <button class="btn-rename-table" onclick="window._seatingRename(${t.number}, '${safeName}')" title="Renommer la table">✏️</button>
          </div>
          <div class="seating-slots">
      `;
      
      // 8 places par table (sans le texte 'vide')
      for (let i = 0; i < 8; i++) {
        const guest = t.guests[i];
        if (guest) {
          html += `
            <div class="seat-slot" ondragover="window._seatingDragOver(event)" ondrop="window._seatingDrop(event, ${t.number})">
              <div class="guest-chip" draggable="true" ondragstart="window._seatingDragStart(event, '${guest.id}')" title="${guest.name}">
                ${guest.name}
              </div>
            </div>`;
        } else {
          html += `
            <div class="seat-slot" ondragover="window._seatingDragOver(event)" ondrop="window._seatingDrop(event, ${t.number})"></div>`;
        }
      }
      html += `</div></div>`;
    });
    html += `</div>`;

    // Zone compacte des non placés
    html += `
      <div class="unassigned-pool" ondragover="window._seatingDragOver(event)" ondrop="window._seatingDrop(event, null)">
        <div class="unassigned-title">
          <span>👥 Invités à placer (${unassigned.length})</span>
          <button class="btn btn--outline btn--sm" onclick="window._seatingReset()" style="font-size:11px; padding:2px 8px;">Réinitialiser</button>
        </div>
        <div class="unassigned-chips">
          ${unassigned.length > 0 
            ? unassigned.map(g => `
              <div class="guest-chip" draggable="true" ondragstart="window._seatingDragStart(event, '${g.id}')" title="${g.name}">
                ${g.name}
              </div>`).join('') 
            : `<span class="text-muted" style="font-size:12px; font-style:italic;">Tous les invités confirmés ont été placés ! 🎉</span>`}
        </div>
      </div>
    </div>`;

    container.innerHTML = html;
    this._bindSeatingHandlers(allPeople, seatingData);
  },

  _bindSeatingHandlers(allPeople, seatingData) {
    const seatingMap = seatingData.guests;

    window._seatingRename = async (tableNum, currentName) => {
      const newName = prompt(`Donnez un nom à la Table ${tableNum} :`, currentName);
      if (newName === null) return;
      const trimmed = newName.trim() || `Table ${tableNum}`;
      seatingData.tableNames[tableNum] = trimmed;
      await this._saveSeatingDb(seatingData);
      const label = document.getElementById(`t-name-${tableNum}`);
      if (label) { label.textContent = trimmed; label.title = trimmed; }
    };

    window._seatingDragStart = (e, guestId) => {
      e.dataTransfer.setData('text/plain', guestId);
      e.target.classList.add('dragging');
    };

    window._seatingDragOver = (e) => {
      e.preventDefault();
      const slot = e.currentTarget;
      slot.classList.add('drag-over');
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'), { once: true });
    };

    window._seatingDrop = async (e, targetTable) => {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      
      const guestId = e.dataTransfer.getData('text/plain');
      if (!guestId) return;

      if (targetTable !== null) {
        const currentCount = Object.values(seatingMap).filter(val => Number(val) === targetTable).length;
        if (seatingMap[guestId] !== targetTable && currentCount >= 8) {
          if (typeof Animations !== 'undefined' && Animations.showToast) {
            Animations.showToast("Cette table est déjà complète (8 places max)", "error");
          } else {
            alert("Cette table est déjà complète (8 places max)");
          }
          return;
        }
      }

      if (targetTable === null) {
        delete seatingMap[guestId];
      } else {
        seatingMap[guestId] = targetTable;
      }

      await this._saveSeatingDb(seatingData);
      if (typeof Store !== 'undefined' && Store.getGuests) {
        this.renderSeatingPlan(await Store.getGuests());
      }
    };

    window._seatingReset = async () => {
      if (confirm("Voulez-vous vraiment réinitialiser tout le plan de table (les noms de tables seront conservés) ?")) {
        seatingData.guests = {};
        await this._saveSeatingDb(seatingData);
        if (typeof Store !== 'undefined' && Store.getGuests) {
          this.renderSeatingPlan(await Store.getGuests());
        }
      }
    };
  },

  // ════════════════════════════════════════════════════════════
  // renderContentPublication()
  // ════════════════════════════════════════════════════════════
  async renderContentPublication() {
    const container = document.getElementById('admin-publication');
    if (!container) return;
    
    const settings = await Store.getSettings('publication');
    
    container.innerHTML = `
      <h3>Contrôle de publication</h3>
      <p class="text-muted" style="margin-bottom: 20px;">
        Activez ou désactivez l'affichage des informations pour les invités. 
        Si désactivé, le message "Plus d'informations à venir" sera affiché.
      </p>
      <div class="publication-toggles" style="display:flex; flex-direction:column; gap:12px; max-width: 400px;">
        ${['messe', 'animations', 'contacts', 'liste', 'covoiturage', 'hebergements'].map(key => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e8e0d0;">
            <span style="font-weight: 500; text-transform: capitalize;">${key === 'messe' ? 'Messe & Réception' : key}</span>
            <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
              <input type="checkbox" data-pub-key="${key}" ${settings[key] ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
              <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;">
                <span class="slider-knob" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; transform: ${settings[key] ? 'translateX(20px)' : 'translateX(0)'};"></span>
              </span>
            </label>
          </div>
        `).join('')}
      </div>
    `;
    
    // Style for toggles dynamically injected since it's a new feature
    if (!document.getElementById('pub-toggles-style')) {
      document.head.insertAdjacentHTML('beforeend', `
        <style id="pub-toggles-style">
          .publication-toggles input:checked + .slider { background-color: var(--sage, #9CAF88); }
          .publication-toggles input:focus + .slider { box-shadow: 0 0 1px var(--sage, #9CAF88); }
        </style>
      `);
    }

    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const key = e.target.dataset.pubKey;
        const isChecked = e.target.checked;
        
        // Animate knob visually immediately for UX
        const knob = e.target.nextElementSibling.querySelector('.slider-knob');
        if (isChecked) {
          knob.style.transform = 'translateX(20px)';
        } else {
          knob.style.transform = 'translateX(0)';
        }
        
        settings[key] = isChecked;
        const success = await Store.updateSettings('publication', settings);
        if (success) {
          Animations.showToast(`Section ${key} mise à jour`, 'success');
        } else {
          Animations.showToast(`Erreur lors de la mise à jour`, 'error');
          // Revert UI
          e.target.checked = !isChecked;
          knob.style.transform = !isChecked ? 'translateX(20px)' : 'translateX(0)';
          settings[key] = !isChecked;
        }
      });
    });
  }
}; // Fin de AdminDashboard

export default AdminDashboard;