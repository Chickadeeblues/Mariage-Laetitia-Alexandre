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
  },

  _render() {
    if (!this._elements.page) return;
    this._elements.page.innerHTML = `
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Comment venir ?</h2>
          <div class="ornament"></div>
        </div>

        <div class="htg-grid">

          <!-- MESSE -->
          <div class="card htg-card">
            <div class="htg-card__head">
              <span class="htg-icon">💒</span>
              <div>
                <h3>Cérémonie religieuse</h3>
                <p class="htg-subtitle">Église Notre-Dame-de-Pitié — Malleval (42520)</p>
              </div>
            </div>
            <p class="htg-desc">
              Malleval est un village médiéval perché sur un éperon rocheux. Les rues sont étroites et le stationnement limité — 
              prévoyez d'arriver <strong>au moins 20 min à l'avance</strong>.
            </p>

            <h4 class="htg-section-title">🅿️ Parkings disponibles</h4>
            <div class="htg-parking-list">
              <div class="htg-parking">
                <strong>Parking du Bourg</strong>
                <span class="htg-badge htg-badge--green">Principal</span>
                <p>Entrée du village, route du Bourg. <em>~3 min à pied jusqu'à l'église.</em></p>
              </div>
              <div class="htg-parking">
                <strong>Parking de la Mairie</strong>
                <p>Place de la Mairie, centre-bourg. <em>~2 min à pied jusqu'à l'église.</em></p>
              </div>
              <div class="htg-parking">
                <strong>Stationnement route de Pélussin</strong>
                <p>En bas du village, sur la D386. <em>~8 min à pied en montée.</em></p>
              </div>
            </div>

            <div class="htg-alert">
              ⚠️ Les ruelles du centre médiéval sont inaccessibles en voiture. Ne remontez pas le village en voiture.
            </div>

            <a href="https://maps.google.com/?q=Église+Notre-Dame-de-Pitié,Malleval,42520" 
               target="_blank" rel="noopener" class="htg-link">
              📍 Ouvrir dans Google Maps →
            </a>
          </div>

          <!-- RÉCEPTION -->
          <div class="card htg-card">
            <div class="htg-card__head">
              <span class="htg-icon">🏰</span>
              <div>
                <h3>Réception</h3>
                <p class="htg-subtitle">Domaine de la Scie du May — Doizieux (42740)</p>
              </div>
            </div>
            <p class="htg-desc">
              Le domaine est accessible par la route de Doizieux. Un <strong>parking gratuit sur place</strong> vous accueille — 
              suivez simplement les <strong>ballons</strong> à partir du village !
            </p>

            <h4 class="htg-section-title">🗺️ Depuis l'église (après la cérémonie)</h4>
            <p style="font-size:14px;color:#666;">
              Comptez environ <strong>20 minutes en voiture</strong> depuis Malleval. L'itinéraire vous sera communiqué le jour J. 
              Un convoi depuis l'église sera organisé pour ceux qui le souhaitent.
            </p>

            <a href="https://maps.google.com/?q=Domaine+de+la+Scie+du+May,Doizieux,42740" 
               target="_blank" rel="noopener" class="htg-link" style="margin-top:14px;">
              📍 Ouvrir dans Google Maps →
            </a>
          </div>

          <!-- TRAIN -->
          <div class="card htg-card">
            <div class="htg-card__head">
              <span class="htg-icon">🚆</span>
              <div>
                <h3>Venir en train</h3>
                <p class="htg-subtitle">Gare TER Le Péage-de-Roussillon</p>
              </div>
            </div>
            <p class="htg-desc">
              La gare la plus proche est <strong>Le Péage-de-Roussillon</strong>, desservie par la ligne TER Lyon ↔ Valence. 
              Depuis Lyon Part-Dieu, comptez environ <strong>40 minutes</strong>.
            </p>
            <p style="font-size:14px;color:#666;margin-top:8px;">
              Depuis la gare, il n'y a pas de transport en commun jusqu'à Malleval ou Doizieux — 
              pensez à vous organiser avec d'autres invités !
            </p>

            <div class="htg-alert htg-alert--info">
              💡 Des invités proposent du covoiturage depuis la gare. Consultez la page covoiturage !
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
              <a href="https://maps.google.com/?q=Gare+Le+Péage-de-Roussillon" 
                 target="_blank" rel="noopener" class="htg-link">📍 Gare sur Maps →</a>
              <a href="#/covoiturage" class="htg-link htg-link--gold">🚗 Voir le covoiturage →</a>
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