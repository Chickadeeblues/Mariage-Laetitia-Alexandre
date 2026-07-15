/**
 * howToGet.js — Page "Comment venir ?"
 */
const HowToGet = {
  _elements: { page: null },

  init() {
    this._elements.page = document.getElementById('page-comment-venir');
    if (!this._elements.page) return;
    this._render();
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/comment-venir') this._render();
    });
    window.addEventListener('language-changed', () => {
      if (window.location.hash === '#/comment-venir') this._render();
    });
  },

  _render() {
    if (!this._elements.page) return;
    this._elements.page.innerHTML = `
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>${window.I18n.t('htg.title')}</h2>
          <div class="ornament"></div>
        </div>

        <div class="htg-grid">

          <!-- MESSE -->
          <div class="card htg-card">
            <div class="htg-card__head">
              <span class="htg-icon">💒</span>
              <div>
                <h3>${window.I18n.t('htg.church.title')}</h3>
                <p class="htg-subtitle">${window.I18n.t('htg.church.subtitle')}</p>
              </div>
            </div>
            <p class="htg-desc">
              ${window.I18n.t('htg.church.desc')}
            </p>

            <h4 class="htg-section-title">${window.I18n.t('htg.parking.title')}</h4>
            <div class="htg-parking-list">
              <div class="htg-parking">
                <strong>${window.I18n.t('htg.parking.1.name')}</strong>
                <span class="htg-badge htg-badge--green">${window.I18n.t('htg.parking.1.badge')}</span>
                <p>${window.I18n.t('htg.parking.1.desc')}</p>
              </div>
              <div class="htg-parking">
                <strong>${window.I18n.t('htg.parking.2.name')}</strong>
                <p>${window.I18n.t('htg.parking.2.desc')}</p>
              </div>
              <div class="htg-parking">
                <strong>${window.I18n.t('htg.parking.3.name')}</strong>
                <p>${window.I18n.t('htg.parking.3.desc')}</p>
              </div>
            </div>

            <div class="htg-alert">
              ${window.I18n.t('htg.alert.noCar')}
            </div>

            <a href="https://maps.google.com/?q=Église+Notre-Dame-de-Pitié,Malleval,42520" 
               target="_blank" rel="noopener" class="htg-link">
              ${window.I18n.t('htg.link.maps')}
            </a>
          </div>

          <!-- RÉCEPTION -->
          <div class="card htg-card">
            <div class="htg-card__head">
              <span class="htg-icon">🏰</span>
              <div>
                <h3>${window.I18n.t('htg.domain.title')}</h3>
                <p class="htg-subtitle">${window.I18n.t('htg.domain.subtitle')}</p>
              </div>
            </div>
            <p class="htg-desc">
              ${window.I18n.t('htg.domain.desc')}
            </p>

            <h4 class="htg-section-title">${window.I18n.t('htg.domain.fromChurch')}</h4>
            <p style="font-size:14px;color:#666;">
              ${window.I18n.t('htg.domain.fromChurch.desc')}
            </p>

            <a href="https://maps.google.com/?q=Domaine+de+la+Scie+du+May,Doizieux,42740" 
               target="_blank" rel="noopener" class="htg-link" style="margin-top:14px;">
              ${window.I18n.t('htg.link.maps')}
            </a>
          </div>

          <!-- TRAIN -->
          <div class="card htg-card">
            <div class="htg-card__head">
              <span class="htg-icon">🚆</span>
              <div>
                <h3>${window.I18n.t('htg.train.title')}</h3>
                <p class="htg-subtitle">${window.I18n.t('htg.train.subtitle')}</p>
              </div>
            </div>
            <p class="htg-desc">
              ${window.I18n.t('htg.train.desc1')}
            </p>
            <p style="font-size:14px;color:#666;margin-top:8px;">
              ${window.I18n.t('htg.train.desc2')}
            </p>

            <div class="htg-alert htg-alert--info">
              ${window.I18n.t('htg.train.alert')}
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
              <a href="https://maps.google.com/?q=Gare+Le+Péage-de-Roussillon" 
                 target="_blank" rel="noopener" class="htg-link">${window.I18n.t('htg.link.station')}</a>
              <a href="#/covoiturage" class="htg-link htg-link--gold">${window.I18n.t('htg.carpool.btn')}</a>
            </div>
          </div>

        </div>
      </div>

      <style>
        .htg-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-top:1.5rem; }
        .htg-card { padding:22px; }
        .htg-card__head { display:flex;align-items:flex-start;gap:14px;margin-bottom:14px; }
        .htg-icon { font-size:2rem;flex-shrink:0;margin-top:2px; }
        .htg-card__head h3 { margin:0 0 2px;font-size:1.1rem;color:#2D5A3D; }
        .htg-subtitle { font-size:13px;color:#888;margin:0; }
        .htg-desc { font-size:14px;color:#555;line-height:1.6;margin-bottom:14px; }
        .htg-section-title { font-size:14px;font-weight:600;color:#5c4e35;margin:14px 0 8px; }
        .htg-parking-list { display:flex;flex-direction:column;gap:10px;margin-bottom:14px; }
        .htg-parking { background:#fdfaf5;border-left:3px solid #c8b89a;border-radius:6px;padding:10px 12px;font-size:13px; }
        .htg-parking strong { display:block;color:#2D5A3D;margin-bottom:2px; }
        .htg-parking p { margin:4px 0 0;color:#666; }
        .htg-badge { display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px; }
        .htg-badge--green { background:#eafaf1;color:#1e8449; }
        .htg-alert { background:#fdf8ee;border-left:3px solid #d4aa5a;border-radius:6px;padding:10px 12px;font-size:13px;color:#7a6135;margin:12px 0; }
        .htg-alert--info { background:#eaf4fb;border-left-color:#2874a6;color:#1a5276; }
        .htg-link { display:inline-block;margin-top:10px;font-size:13px;color:#9b8660;font-weight:500;text-decoration:underline; }
        .htg-link--gold { color:#c8960c;margin-left:4px; }
      </style>`;

    // Liens internes SPA
    this._elements.page.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        import('../utils/router.js').then(m => m.default.navigate(a.getAttribute('href')));
      });
    });
  },

  destroy() {}
};

export default HowToGet;