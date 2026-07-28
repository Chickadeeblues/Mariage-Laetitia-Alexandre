/**
 * howToGet.js — Page "Comment venir ?"
 * Refonte sobre avec sélection du mode de transport et intégration des adresses complètes.
 */
const HowToGet = {
  _elements: { page: null },
  _mode: 'voiture', // 'voiture' ou 'train'

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

  _setMode(mode) {
    this._mode = mode;
    this._render();
  },

  _render() {
    if (!this._elements.page) return;

    // Définition du contenu selon le mode choisi
    const isCar = this._mode === 'voiture';

    const churchContent = isCar 
      ? `<p class="htg-text">
           Le centre du village est constitué de ruelles médiévales <strong>inaccessibles aux véhicules</strong>. Nous vous conseillons de prévoir une marge pour vous garer et rejoindre l'église à pied.
         </p>
         <h4 class="htg-subtitle">Parkings à disposition</h4>
         <ul class="htg-list">
           <li><strong>Parking du Bourg</strong> (à environ 3 min à pied)</li>
           <li><strong>Parking de la Mairie</strong> (à environ 2 min à pied)</li>
           <li><strong>Parking route de Pélussin</strong> (à environ 8 min à pied, en montée)</li>
         </ul>`
      : `<p class="htg-text">
           La gare la plus proche est la <strong>Gare TER Le Péage-de-Roussillon</strong> (ligne Lyon ↔ Valence, à environ 40 min de Lyon Part-Dieu).
         </p>
         <p class="htg-text">
           Depuis la gare, l'église se trouve à une quinzaine de minutes en voiture. N'hésitez pas à consulter la page covoiturage pour trouver un trajet depuis la gare.
         </p>
         <a href="https://maps.google.com/?q=Gare+Le+Péage-de-Roussillon" target="_blank" rel="noopener" class="htg-link-map">Voir la gare sur la carte</a>`;

    const receptionContent = isCar
      ? `<p class="htg-text">
           Le trajet depuis l'église dure environ 35 minutes. 
         </p>
         <div class="htg-highlight-box">
           <strong>Stationnement :</strong> Un parking gratuit est disponible sur place. Une fois arrivés à Doizieux, suivez les ballons pour trouver l'entrée du domaine !
         </div>`
      : `<p class="htg-text">
           Le domaine de la Scie du May est situé en pleine nature dans le parc naturel du Pilat.
         </p>
         <div class="htg-highlight-box">
           <strong>Important :</strong> Le domaine n'étant pas desservi directement par les transports en commun, <strong>le covoiturage est indispensable</strong> depuis l'église ou la gare pour vous y rendre.
         </div>`;

    this._elements.page.innerHTML = `
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>${window.I18n?.t('htg.title') || 'Comment venir ?'}</h2>
          <div class="ornament"></div>
        </div>

        <!-- Boutons de sélection du transport -->
        <div class="htg-transport-selector">
          <button class="btn-transport ${isCar ? 'active' : ''}" data-mode="voiture">En voiture</button>
          <button class="btn-transport ${!isCar ? 'active' : ''}" data-mode="train">En train</button>
          <a href="#/covoiturage" class="btn-transport btn-carpool" data-internal="true">Covoiturage</a>
        </div>

        <!-- Blocs d'informations -->
        <div class="htg-content-grid">
          
          <!-- Bloc Cérémonie -->
          <div class="htg-block">
            <h3 class="htg-block-title">Cérémonie religieuse</h3>
            <address class="htg-address">
              <strong>Église Notre-Dame-de-Pitié</strong><br>
              42520 Malleval
            </address>
            <div class="htg-block-body">
              ${churchContent}
            </div>
            <a href="https://maps.google.com/?q=Église+Notre-Dame-de-Pitié,Malleval,42520" target="_blank" rel="noopener" class="htg-link-map">Ouvrir dans Google Maps</a>
          </div>

          <!-- Bloc Réception -->
          <div class="htg-block">
            <h3 class="htg-block-title">Réception</h3>
            <address class="htg-address">
              <strong>Domaine de la Scie du May</strong><br>
              38 Les Scies, 42740 Doizieux
            </address>
            <div class="htg-block-body">
              ${receptionContent}
            </div>
            <a href="https://maps.google.com/?q=Domaine+de+la+Scie+du+May,38+Les+Scies,Doizieux,42740" target="_blank" rel="noopener" class="htg-link-map">Ouvrir dans Google Maps</a>
          </div>

        </div>
      </div>

      <style>
        .htg-transport-selector { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 3rem; }
        .btn-transport { padding: 10px 24px; font-family: var(--font-body, 'Outfit', sans-serif); font-size: 14px; font-weight: 500; border: 1px solid var(--sage, #9CAF88); background: transparent; color: var(--text-dark, #2C2C2C); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-transport.active { background: var(--forest, #2D5A3D); color: white; border-color: var(--forest, #2D5A3D); }
        .btn-transport:hover:not(.active) { background: var(--cream, #FAF8F5); }
        .btn-transport.btn-carpool { background: var(--gold, #C9A84C); color: white; border-color: var(--gold, #C9A84C); }
        .btn-transport.btn-carpool:hover { background: #b5953b; }

        .htg-content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; }
        
        .htg-block { background: var(--white, #FFFFFF); padding: 32px; border: 1px solid #e8e0d0; border-radius: 12px; display: flex; flex-direction: column; }
        .htg-block-title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.6rem; color: var(--forest, #2D5A3D); margin: 0 0 16px 0; border-bottom: 1px solid #e8e0d0; padding-bottom: 12px; }
        
        .htg-address { font-style: normal; font-size: 15px; color: var(--text-dark, #2C2C2C); margin-bottom: 20px; line-height: 1.5; padding-left: 16px; border-left: 3px solid var(--sage, #9CAF88); }
        .htg-address strong { color: var(--forest, #2D5A3D); font-size: 16px; }
        
        .htg-block-body { flex-grow: 1; margin-bottom: 24px; }
        .htg-text { font-size: 14.5px; color: var(--text-muted, #6B6B6B); line-height: 1.6; margin-bottom: 16px; }
        .htg-text strong { color: var(--text-dark, #2C2C2C); }
        
        .htg-subtitle { font-size: 14px; font-weight: 600; color: var(--text-dark, #2C2C2C); margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .htg-list { list-style: none; padding: 0; margin: 0; }
        .htg-list li { font-size: 14px; color: var(--text-muted, #6B6B6B); margin-bottom: 8px; padding-left: 16px; position: relative; }
        .htg-list li::before { content: '•'; color: var(--gold, #C9A84C); position: absolute; left: 0; font-weight: bold; }
        .htg-list li strong { color: var(--text-dark, #2C2C2C); }
        
        .htg-highlight-box { background: var(--cream, #FAF8F5); border-radius: 6px; padding: 16px; font-size: 14px; color: var(--text-dark, #2C2C2C); line-height: 1.5; border-left: 3px solid var(--gold, #C9A84C); }
        
        .htg-link-map { display: inline-block; font-size: 13px; color: var(--gold, #C9A84C); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; align-self: flex-start; transition: color 0.2s; }
        .htg-link-map:hover { color: var(--forest, #2D5A3D); }
      </style>`;

    // Ajout des écouteurs d'événements pour le sélecteur
    this._elements.page.querySelectorAll('button[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._setMode(e.target.dataset.mode);
      });
    });

    // Liens internes SPA (Covoiturage)
    this._elements.page.querySelectorAll('a[data-internal="true"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        import('../utils/router.js').then(m => m.default.navigate(a.getAttribute('href')));
      });
    });
  },

  destroy() {
    this._elements.page = null;
  }
};

export default HowToGet;