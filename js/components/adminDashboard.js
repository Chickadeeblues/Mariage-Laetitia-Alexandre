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

// ════════════════════════════════════════════════════════════
// Système d'onglets intercalaires
// ════════════════════════════════════════════════════════════
_initTabs() {
  const tabs = document.querySelectorAll('#admin-tabs-nav .admin-tab');
  const panels = document.querySelectorAll('.admin-tab-panel');
  if (!tabs.length) return;

  if (!document.getElementById('admin-tabs-style')) {
    const style = document.createElement('style');
    style.id = 'admin-tabs-style';
    style.textContent = `
      #admin-tabs-container { margin-top: 20px; }
      .admin-tabs {
        display: flex; gap: 4px;
        border-bottom: 2px solid var(--sage, #9CAF88);
        margin-bottom: 0; padding: 0;
        overflow-x: auto; scrollbar-width: none;
      }
      .admin-tabs::-webkit-scrollbar { display: none; }
      .admin-tab {
        padding: 9px 20px;
        border: none; border-bottom: 3px solid transparent;
        background: none;
        font-family: var(--font-body, sans-serif);
        font-size: 13px; font-weight: 500;
        color: var(--text-muted, #6B6B6B);
        cursor: pointer; white-space: nowrap;
        transition: color 0.18s, border-color 0.18s, background 0.18s;
        border-radius: 8px 8px 0 0;
        position: relative; bottom: -2px; letter-spacing: 0.01em;
      }
      .admin-tab:hover { color: var(--forest, #2D5A3D); background: rgba(156,175,136,0.08); }
      .admin-tab.active {
        color: var(--forest, #2D5A3D); font-weight: 700;
        border-bottom-color: var(--forest, #2D5A3D);
        background: var(--cream, #FAF8F5);
      }
      .admin-tab-panel {
        display: none;
        background: var(--cream, #FAF8F5);
        border: 1.5px solid var(--sage, #9CAF88);
        border-top: none;
        border-radius: 0 0 12px 12px;
        padding: 20px;
        animation: tabFadeIn 0.18s ease;
      }
      .admin-tab-panel.active { display: block; }
      @keyframes tabFadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 600px) {
        .admin-tab { padding: 8px 12px; font-size: 12px; }
        .admin-tab-panel { padding: 14px; }
      }
    `;
    document.head.appendChild(style);
  }

  const savedTab = sessionStorage.getItem('adminActiveTab') || 'guests';

  const activateTab = (tabId) => {
    document.querySelectorAll('#admin-tabs-nav .admin-tab').forEach(t => {
      const isActive = t.dataset.tab === tabId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.admin-tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === `tab-panel-${tabId}`);
    });
    sessionStorage.setItem('adminActiveTab', tabId);
  };

  activateTab(savedTab);

  document.querySelectorAll('#admin-tabs-nav .admin-tab').forEach(tab => {
    const fresh = tab.cloneNode(true);
    tab.parentNode.replaceChild(fresh, tab);
    fresh.addEventListener('click', () => activateTab(fresh.dataset.tab));
  });
},

// ════════════════════════════════════════════════════════════
// Equipe prepa — Supabase helpers
// ════════════════════════════════════════════════════════════
_teamSupabase() {
  return {
    url: 'https://upaxcudmifqwiglodywf.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs',
  };
},

async _loadTeam() {
  const { url, key } = this._teamSupabase();
  try {
    const res = await fetch(`${url}/rest/v1/wedding_team?select=*&order=created_at.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) { console.warn('[Team] Erreur chargement equipe:', e); return []; }
},

async _saveTeamMember(member) {
  const { url, key } = this._teamSupabase();
  const method = member.id ? 'PATCH' : 'POST';
  const endpoint = member.id
    ? `${url}/rest/v1/wedding_team?id=eq.${member.id}`
    : `${url}/rest/v1/wedding_team`;
  const body = { ...member };
  delete body.id;
  const res = await fetch(endpoint, {
    method,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  return res.ok ? await res.json() : null;
},

async _deleteTeamMember(id) {
  const { url, key } = this._teamSupabase();
  await fetch(`${url}/rest/v1/wedding_team?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
},

// ════════════════════════════════════════════════════════════
// Onglet 2 : Equipe prepa
// ════════════════════════════════════════════════════════════
async renderTeam(guests) {
  const container = document.getElementById('admin-team');
  if (!container) return;

  const ROLES_DEFAULT = [
    'Sono', 'Animation', 'Decoration', 'Service de l\'autel',
    'Covoiturage', 'Fleurs', 'Accueil invites', 'Coiffure mariee', 'Photographe'
  ];
  // Charger les roles personnalises depuis localStorage
  const customRoles = JSON.parse(localStorage.getItem('wedding_team_custom_roles') || '[]');
  const allRoles = [...ROLES_DEFAULT, ...customRoles];

  const team = await this._loadTeam();

  // Correspondance guest_id -> voiture depuis la guestlist
  const guestCarMap = {};
  if (Array.isArray(guests)) {
    guests.forEach(g => {
      guestCarMap[g.id] = (g.transport && g.transport.mode === 'car');
    });
  }

  const roleBadgeColor = (role) => {
    const palette = [
      '#dbeafe:#1d4ed8','#fee2e2:#b91c1c','#ffedd5:#c2410c','#fce7f3:#be185d',
      '#f3e8ff:#7c3aed','#d1fae5:#065f46','#f1f5f9:#475569','#fef9c3:#854d0e',
      '#e0f2fe:#0369a1','#fdf4ff:#7e22ce','#ecfdf5:#065f46','#fff7ed:#9a3412'
    ];
    let hash = 0;
    for (let i = 0; i < role.length; i++) hash = (hash * 31 + role.charCodeAt(i)) & 0xffffffff;
    const p = palette[Math.abs(hash) % palette.length].split(':');
    return `background:${p[0]};color:${p[1]};`;
  };

  const renderRoles = (roles) => {
    if (!roles || !roles.length) return '<span style="color:var(--text-muted);font-size:12px;">—</span>';
    return roles.map(r =>
      `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;margin:2px;${roleBadgeColor(r)}">${r}</span>`
    ).join('');
  };

  const yesNo = (val) => val
    ? '<span style="color:#065f46;font-weight:600;">Oui</span>'
    : '<span style="color:var(--text-muted);">Non</span>';

  const carYesNo = (guestId) => {
    if (!guestId || guestCarMap[guestId] === undefined) return '<span style="color:var(--text-muted);">—</span>';
    return guestCarMap[guestId]
      ? '<span style="color:#065f46;font-weight:600;">Oui</span>'
      : '<span style="color:var(--text-muted);">Non</span>';
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  let html = `
    <style>
      .team-table { width:100%; border-collapse:collapse; font-size:13px; }
      .team-table thead th {
        background:#fdfaf5; padding:9px 12px;
        font-size:10px; font-weight:700; text-transform:uppercase;
        letter-spacing:0.08em; color:var(--text-muted);
        border-bottom:2px solid #e8e0d0; white-space:nowrap; text-align:left;
      }
      .team-table tbody tr { border-bottom:1px solid #f5f0e8; }
      .team-table tbody tr:hover td { background:#fdfaf5; }
      .team-table td { padding:9px 12px; vertical-align:middle; }
      .team-empty { padding:24px; text-align:center; color:var(--text-muted); font-style:italic; }
      .team-actions { display:flex; gap:6px; }
      .team-btn {
        background:none; border:1px solid #ddd; border-radius:4px;
        padding:3px 8px; font-size:12px; cursor:pointer;
        color:var(--text-muted); transition:border-color 0.15s,color 0.15s;
      }
      .team-btn:hover { border-color:var(--forest); color:var(--forest); }
      .team-btn.del:hover { border-color:#c0392b; color:#c0392b; }
    </style>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <span style="font-size:13px;color:var(--text-muted);">${team.length} membre${team.length !== 1 ? 's' : ''}</span>
      <button id="team-add-btn" class="btn btn--primary btn--sm" style="font-size:13px;padding:7px 16px;">+ Ajouter un membre</button>
    </div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #ede8df;">
      <table class="team-table">
        <thead>
          <tr>
            <th>Nom &amp; Telephone</th>
            <th>Roles</th>
            <th>Voiture</th>
            <th>Jeudi</th>
            <th>Vendredi</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="team-tbody">
  `;

  if (team.length === 0) {
    html += `<tr><td colspan="6" class="team-empty">Aucun membre pour l'instant. Cliquez sur "+ Ajouter un membre".</td></tr>`;
  } else {
    team.forEach(m => {
      const roles = Array.isArray(m.roles) ? m.roles : [];
      html += `
        <tr id="team-row-${m.id}">
          <td>
            <strong>${m.name || ''}</strong>
            ${m.phone ? `<br><small style="color:var(--text-muted);font-family:monospace;font-size:12px;">${formatPhone(m.phone)}</small>` : ''}
          </td>
          <td>${renderRoles(roles)}</td>
          <td>${carYesNo(m.guest_id)}</td>
          <td>${yesNo(m.arrives_thu)}</td>
          <td>${yesNo(m.arrives_fri)}</td>
          <td>
            <div class="team-actions">
              <button class="team-btn team-edit-btn" data-id="${m.id}" title="Modifier">✏️</button>
              <button class="team-btn del team-del-btn" data-id="${m.id}" title="Supprimer">×</button>
            </div>
          </td>
        </tr>`;
    });
  }

  html += `</tbody></table></div>`;
  container.innerHTML = html;

  // Bind delete
  container.querySelectorAll('.team-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer ce membre de l\'equipe ?')) return;
      await this._deleteTeamMember(btn.dataset.id);
      Animations.showToast('Membre supprime', 'success');
      this.renderTeam(guests);
    });
  });

  // Bind edit
  container.querySelectorAll('.team-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const member = team.find(m => m.id === btn.dataset.id);
      if (member) this._openTeamModal(member, guests, allRoles, () => this.renderTeam(guests));
    });
  });

  // Bind add
  document.getElementById('team-add-btn')?.addEventListener('click', () => {
    this._openTeamModal(null, guests, allRoles, () => this.renderTeam(guests));
  });
},

// ════════════════════════════════════════════════════════════
// Modale ajout / edition membre equipe
// ════════════════════════════════════════════════════════════
_openTeamModal(member, guests, allRoles, onSave) {
  const existing = document.getElementById('team-modal');
  if (existing) existing.remove();

  const isEdit = !!member;
  const currentRoles = isEdit && Array.isArray(member.roles) ? member.roles : [];
  const customRoles = JSON.parse(localStorage.getItem('wedding_team_custom_roles') || '[]');

  // Construire la liste de roles avec etat coche
  const rolesHtml = allRoles.map(r => {
    const checked = currentRoles.includes(r) ? 'checked' : '';
    return `
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 0;">
        <input type="checkbox" name="team-role" value="${r}" ${checked}
          style="width:14px;height:14px;accent-color:var(--forest);cursor:pointer;">
        <span style="font-size:13px;">${r}</span>
      </label>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'team-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
  modal.innerHTML = `
    <div style="background:var(--cream,#FAF8F5);border-radius:var(--radius-lg,20px);width:95%;max-width:520px;max-height:88vh;overflow-y:auto;padding:24px;box-shadow:0 15px 35px rgba(0,0,0,0.25);border:1px solid var(--gold);">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--gold-light);padding-bottom:12px;margin-bottom:18px;">
        <h3 style="margin:0;font-family:var(--font-display);color:var(--forest);font-size:20px;">
          ${isEdit ? 'Modifier le membre' : 'Ajouter un membre'}
        </h3>
        <button id="team-modal-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted);">×</button>
      </div>

      <form id="team-modal-form" style="display:flex;flex-direction:column;gap:16px;">

        <!-- Autocompletion depuis guestlist -->
        <fieldset style="border:1px solid #ddd;border-radius:8px;padding:12px;margin:0;">
          <legend style="font-weight:600;color:var(--forest);padding:0 6px;font-size:13px;">Identite</legend>
          <div style="position:relative;margin-bottom:10px;">
            <label style="font-size:12px;color:var(--text-muted);">Rechercher dans la guestlist</label>
            <input type="text" id="team-guest-search" placeholder="Tapez 3 lettres..." autocomplete="off"
              style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;box-sizing:border-box;font-size:13px;">
            <div id="team-autocomplete" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #ddd;border-radius:0 0 8px 8px;max-height:150px;overflow-y:auto;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.1);"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:12px;color:var(--text-muted);">Nom complet *</label>
              <input type="text" id="team-name" value="${isEdit ? (member.name || '') : ''}" required
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;box-sizing:border-box;font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px;color:var(--text-muted);">Telephone</label>
              <input type="tel" id="team-phone" value="${isEdit ? (member.phone || '') : ''}"
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;box-sizing:border-box;font-size:13px;">
            </div>
          </div>
          <input type="hidden" id="team-guest-id" value="${isEdit && member.guest_id ? member.guest_id : ''}">
        </fieldset>

        <!-- Roles -->
        <fieldset style="border:1px solid #ddd;border-radius:8px;padding:12px;margin:0;">
          <legend style="font-weight:600;color:var(--forest);padding:0 6px;font-size:13px;">Roles (choix multiples)</legend>
          <div id="team-roles-list" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:10px;">
            ${rolesHtml}
          </div>
          <!-- Ajouter une etiquette personnalisee -->
          <div style="display:flex;gap:6px;align-items:center;border-top:1px solid #eee;padding-top:10px;">
            <input type="text" id="team-new-role" placeholder="Nouvelle etiquette..."
              style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #ddd;font-size:12px;">
            <button type="button" id="team-add-role-btn"
              style="padding:6px 12px;background:var(--forest);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">
              + Ajouter
            </button>
          </div>
        </fieldset>

        <!-- Arrivees -->
        <fieldset style="border:1px solid #ddd;border-radius:8px;padding:12px;margin:0;">
          <legend style="font-weight:600;color:var(--forest);padding:0 6px;font-size:13px;">Arrivee</legend>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="font-size:12px;color:var(--text-muted);">Arrive le jeudi 7 mai ?</label>
              <select id="team-thu" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;font-size:13px;">
                <option value="false" ${isEdit && !member.arrives_thu ? 'selected' : ''}>Non</option>
                <option value="true"  ${isEdit && member.arrives_thu  ? 'selected' : ''}>Oui</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;color:var(--text-muted);">Arrive le vendredi 8 mai matin ?</label>
              <select id="team-fri" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;font-size:13px;">
                <option value="false" ${isEdit && !member.arrives_fri ? 'selected' : ''}>Non</option>
                <option value="true"  ${isEdit && member.arrives_fri  ? 'selected' : ''}>Oui</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" id="team-modal-cancel" class="btn btn--outline" style="padding:10px 18px;">Annuler</button>
          <button type="submit" class="btn btn--primary" style="padding:10px 18px;">
            ${isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById('team-modal-close').addEventListener('click', close);
  document.getElementById('team-modal-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // Autocompletion
  const searchInput = document.getElementById('team-guest-search');
  const autocomplete = document.getElementById('team-autocomplete');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 3) { autocomplete.style.display = 'none'; return; }
    const matches = (guests || []).filter(g => {
      const full = `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase();
      return full.includes(q);
    }).slice(0, 8);
    if (!matches.length) { autocomplete.style.display = 'none'; return; }
    autocomplete.innerHTML = matches.map(g => {
      const hasCar = g.transport && g.transport.mode === 'car';
      return `<div class="team-ac-item" data-id="${g.id}"
        data-name="${(g.firstName || '')} ${(g.lastName || '')}"
        data-phone="${g.phone || ''}"
        style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
        <span>${g.firstName || ''} ${g.lastName || ''}</span>
        <span style="font-size:11px;color:var(--text-muted);">${hasCar ? '🚗' : ''} ${g.phone || ''}</span>
      </div>`;
    }).join('');
    autocomplete.style.display = 'block';
    autocomplete.querySelectorAll('.team-ac-item').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
      item.addEventListener('mouseleave', () => item.style.background = '');
      item.addEventListener('click', () => {
        document.getElementById('team-name').value = item.dataset.name.trim();
        document.getElementById('team-phone').value = item.dataset.phone;
        document.getElementById('team-guest-id').value = item.dataset.id;
        autocomplete.style.display = 'none';
        searchInput.value = '';
      });
    });
  });
  document.addEventListener('click', e => {
    if (!autocomplete.contains(e.target) && e.target !== searchInput) {
      autocomplete.style.display = 'none';
    }
  }, { once: false });

  // Ajouter une etiquette personnalisee
  document.getElementById('team-add-role-btn').addEventListener('click', () => {
    const inp = document.getElementById('team-new-role');
    const val = inp.value.trim();
    if (!val) return;
    const stored = JSON.parse(localStorage.getItem('wedding_team_custom_roles') || '[]');
    if (!stored.includes(val)) {
      stored.push(val);
      localStorage.setItem('wedding_team_custom_roles', JSON.stringify(stored));
    }
    // Ajouter dynamiquement la case a cocher
    const rolesList = document.getElementById('team-roles-list');
    const lbl = document.createElement('label');
    lbl.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 0;';
    lbl.innerHTML = `
      <input type="checkbox" name="team-role" value="${val}" checked
        style="width:14px;height:14px;accent-color:var(--forest);cursor:pointer;">
      <span style="font-size:13px;">${val}</span>`;
    rolesList.appendChild(lbl);
    inp.value = '';
    Animations.showToast(`Etiquette "${val}" ajoutee`, 'success');
  });

  // Soumission du formulaire
  document.getElementById('team-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roles = [...document.querySelectorAll('input[name="team-role"]:checked')].map(cb => cb.value);
    const payload = {
      name: document.getElementById('team-name').value.trim(),
      phone: document.getElementById('team-phone').value.trim(),
      guest_id: document.getElementById('team-guest-id').value || null,
      roles,
      arrives_thu: document.getElementById('team-thu').value === 'true',
      arrives_fri: document.getElementById('team-fri').value === 'true',
    };
    if (!payload.name) return;
    if (isEdit) payload.id = member.id;
    try {
      await this._saveTeamMember(payload);
      Animations.showToast(isEdit ? 'Membre mis a jour' : 'Membre ajoute', 'success');
      close();
      if (onSave) onSave();
    } catch (err) {
      console.error(err);
      Animations.showToast('Erreur lors de la sauvegarde', 'error');
    }
  });
},

}; // fermeture de l'objet AdminDashboard