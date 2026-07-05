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
 
    // Widget + barre de progression EN PREMIER
    await this.renderManagementZone(tasks);
 
    // Puis le reste
    await Promise.all([
      this.renderStatsAndDiets(stats, guests),
      this.renderGuestsList(guests),
      this.renderCarpools(stats),
      this.renderAccommodations()
    ]);
 
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
            ? `${nextTask.label} <em>→ ${nextTask.month}</em>`
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
 // ════════════════════════════════════════════════════════════
async renderCarpools(stats) {
  const container = document.getElementById('admin-carpools');
  if (!container) return;
  container.innerHTML = `
    <div class="admin-grid">
      <div class="card" style="border-left:4px solid var(--sage);">
        <h4>🚗 Conducteurs</h4>
        <p class="text-muted" style="margin-top:8px;">
          ${stats.transport.drivers} voiture(s) —
          <strong>${stats.transport.seatsAvailable} place(s)</strong> disponible(s).
        </p>
      </div>
      <div class="card" style="border-left:4px solid var(--gold);">
        <h4>🙋 Recherche de places</h4>
        <p class="text-muted" style="margin-top:8px;">
          ${stats.transport.needRide} personne(s) —
          <strong>${stats.transport.seatsNeeded} place(s)</strong> recherchée(s).
        </p>
      </div>
    </div>`;
},
 
// ════════════════════════════════════════════════════════════
// renderAccommodations — 3 premiers + Voir plus
// ════════════════════════════════════════════════════════════
async renderAccommodations() {
  const container = document.getElementById('admin-accommodations');
  if (!container) return;
  container.innerHTML = '<p class="text-muted" style="padding:8px 0;">Chargement…</p>';
  const accommodations = await Store.getAccommodations();
 
  const renderCard = (acc) => `
    <div class="card" style="padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <div style="flex:1;min-width:0;">
        <strong style="font-size:13px;">${acc.name}</strong>
        <p style="font-size:11px;color:var(--text-muted);margin:2px 0 0;">
          📏 ${acc.distance || '—'} &nbsp;·&nbsp; 🛏️ ${acc.capacity || '—'}
          ${acc.capacityNumber > 0 ? `&nbsp;·&nbsp; <strong>${acc.spotsLeft ?? acc.capacityNumber} place(s) restante(s)</strong>` : ''}
        </p>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;">
        ${acc.bookingUrl ? `<a href="${acc.bookingUrl}" target="_blank" class="btn btn--outline btn--sm">🔗</a>` : ''}
        <button class="btn btn--outline btn--sm delete-acc-btn" data-id="${acc.id}" style="color:red;border-color:red;">×</button>
      </div>
    </div>`;
 
  const LIMIT = 3;
  const first = accommodations.slice(0, LIMIT);
  const rest  = accommodations.slice(LIMIT);
 
  let html = `
    <div style="margin-bottom:10px;">
      <button class="btn btn--primary btn--sm" id="add-acc-btn">+ Ajouter</button>
    </div>
    ${first.map(renderCard).join('')}
    ${rest.length > 0 ? `
      <div id="acc-more" class="hidden">${rest.map(renderCard).join('')}</div>
      <button id="acc-toggle-btn" class="btn btn--outline btn--sm" style="margin-top:4px;width:100%;">
        Voir ${rest.length} hébergement${rest.length > 1 ? 's' : ''} de plus ▾
      </button>` : ''}`;
 
  container.innerHTML = html;
 
  container.querySelector('#acc-toggle-btn')?.addEventListener('click', function() {
    const more = document.getElementById('acc-more');
    const isHidden = more.classList.toggle('hidden');
    this.textContent = isHidden
      ? `Voir ${rest.length} hébergement${rest.length > 1 ? 's' : ''} de plus ▾`
      : 'Réduire ▴';
  });
 
  container.querySelector('#add-acc-btn')?.addEventListener('click', async () => {
    const name = prompt("Nom de l'hébergement :"); if (!name) return;
    const lat  = prompt("Latitude (ex: 45.42) :");
    const lng  = prompt("Longitude (ex: 4.59) :");
    const capacity   = prompt("Capacité :") || '';
    const bookingUrl = prompt("Lien de réservation (optionnel) :") || '';
    await Store.saveAccommodation({
      name, lat: parseFloat(lat)||45.411, lng: parseFloat(lng)||4.588,
      capacity, bookingUrl, description:'', distance:'', icon:'gite'
    });
    Animations.showToast("Hébergement ajouté", "success");
  });
 
  container.querySelectorAll('.delete-acc-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (confirm("Supprimer cet hébergement ?")) {
        await Store.deleteAccommodation(e.currentTarget.dataset.id);
        Animations.showToast("Hébergement supprimé", "success");
      }
    });
  });
},


};  // ← fermeture de l'objet AdminDashboard

export default AdminDashboard;