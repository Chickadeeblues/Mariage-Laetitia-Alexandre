/**
 * howToGet.js — Page "Comment venir ?" (Version Unifiée avec Covoiturage et Onglets)
 */
import Carpool from './carpool.js';

const HowToGet = {
  _elements: { 
    page: null, 
    contentArea: null, 
    transportButtons: null,
    tabButtons: null 
  },
  _mode: 'voiture', // 'voiture' ou 'train'
  _tab: 'ceremonie', // 'ceremonie' ou 'reception'

  async init() {
    this._elements.page = document.getElementById('page-comment-venir');
    if (!this._elements.page) return;
    
    // 1. Rendre l'interface globale et attacher les écouteurs
    this._renderShell();
    
    // 2. Mettre à jour le contenu de l'onglet actif
    this._updateContent();
    
    // 3. Initialiser le module de covoiturage dans la colonne de droite
    await Carpool.init();
    
    // 4. Écouteurs globaux pour le routeur et la langue
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/comment-venir') {
        this._renderShell();
        this._updateContent();
        Carpool.init(); // Réinitialiser le covoiturage si on revient sur la page
      }
    });
    
    window.addEventListener('language-changed', () => {
      if (window.location.hash === '#/comment-venir') {
        this._renderShell();
        this._updateContent();
      }
    });
  },

  _setMode(mode) {
    this._mode = mode;
    this._updateContent();
    this._updateActiveButtons();
  },

  _setTab(tab) {
    this._tab = tab;
    this._updateContent();
    this._updateActiveButtons();
  },

  _updateActiveButtons() {
    if (this._elements.transportButtons) {
      this._elements.transportButtons.forEach(btn => {
        if (btn.dataset.mode === this._mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    if (this._elements.tabButtons) {
      this._elements.tabButtons.forEach(btn => {
        if (btn.dataset.tab === this._tab) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  },

  _renderShell() {
    if (!this._elements.page) return;

    this._elements.page.innerHTML = `
      <div class="container htg-integrated-layout">
        <div class="section-header animate-on-scroll">
          <h2>${window.I18n?.t('htg.title') || 'Comment venir ?'}</h2>
          <div class="ornament"></div>
        </div>

        <div class="htg-columns">
          
          <!-- COLONNE GAUCHE : LIEUX & TRANSPORT -->
          <div class="htg-left-column">
            
            <!-- Sélecteur Voiture / Train -->
            <div class="htg-transport-selector">
              <button class="btn-transport ${this._mode === 'voiture' ? 'active' : ''}" data-mode="voiture">🚗 En voiture</button>
              <button class="btn-transport ${this._mode === 'train' ? 'active' : ''}" data-mode="train">🚆 En train</button>
            </div>

            <!-- Bloc unique avec Onglets intercalaires -->
            <div class="htg-block htg-content-block">
              <div class="htg-tabs">
                <button class="htg-tab-btn ${this._tab === 'ceremonie' ? 'active' : ''}" data-tab="ceremonie">Cérémonie religieuse</button>
                <button class="htg-tab-btn ${this._tab === 'reception' ? 'active' : ''}" data-tab="reception">Réception</button>
              </div>
              
              <!-- Contenu dynamique (Adresse + Texte) injecté par _updateContent() -->
              <div id="htg-dynamic-content" class="htg-tab-content"></div>
            </div>
            
          </div>

          <!-- COLONNE DROITE : COVOITURAGE -->
          <div class="htg-right-column">
            <!-- Le conteneur cible pour carpool.js -->
            <div id="carpool-container"></div> 
          </div>

        </div>
      </div>

      <style>
        /* Grille principale à deux colonnes */
        .htg-columns { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 32px; 
          align-items: start; 
        }

        /* Sélecteur de transport (Haut de la colonne de gauche) */
        .htg-transport-selector { 
          display: flex; 
          gap: 12px; 
          margin-bottom: 24px; 
        }
        
        .btn-transport { 
          padding: 10px 24px; 
          font-family: var(--font-body, 'Outfit', sans-serif); 
          font-size: 15px; 
          font-weight: 500; 
          border: 1px solid var(--forest, #2D5A3D); 
          background: var(--cream, #FAF8F5); 
          color: var(--forest, #2D5A3D); 
          border-radius: 6px; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          display: inline-flex; 
          align-items: center; 
        }
        
        .btn-transport.active { 
          background: #dce3d5; 
          color: var(--forest, #2D5A3D); 
          border-color: var(--sage, #9CAF88); 
        }
        
        .btn-transport:hover:not(.active) { 
          background: #f0ebe0; 
        }

        /* Bloc principal et structure des onglets */
        .htg-block { 
          background: var(--white, #FFFFFF); 
          border: 1px solid #e8e0d0; 
          border-radius: 12px; 
          display: flex; 
          flex-direction: column; 
          overflow: hidden;
        }

        .htg-content-block {
          min-height: 480px; /* Assure une hauteur stable lors du changement d'onglets */
        }

        .htg-tabs { 
          display: flex; 
          background: var(--cream, #FAF8F5);
          border-bottom: 1px solid #e8e0d0;
        }

        .htg-tab-btn {
          flex: 1;
          padding: 16px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: 1.4rem;
          color: var(--text-muted, #6B6B6B);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .htg-tab-btn:hover {
          color: var(--forest, #2D5A3D);
          background: rgba(156, 175, 136, 0.1);
        }

        .htg-tab-btn.active {
          color: var(--forest, #2D5A3D);
          font-weight: 600;
          border-bottom-color: var(--sage, #9CAF88);
          background: var(--white, #FFFFFF);
        }

        /* Contenu de l'onglet actif */
        .htg-tab-content {
          padding: 32px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .htg-address { 
          font-style: normal; 
          font-size: 15px; 
          color: var(--text-dark, #2C2C2C); 
          margin-bottom: 24px; 
          line-height: 1.5; 
          padding-left: 16px; 
          border-left: 3px solid var(--sage, #9CAF88); 
        }
        
        .htg-address strong { 
          color: var(--forest, #2D5A3D); 
          font-size: 18px; 
          display: block;
          margin-bottom: 4px;
        }
        
        .htg-block-body { 
          flex-grow: 1; 
          margin-bottom: 24px; 
        }
        
        .htg-text { 
          font-size: 14.5px; 
          color: var(--text-muted, #6B6B6B); 
          line-height: 1.6; 
          margin-bottom: 16px; 
        }
        
        .htg-text strong { 
          color: var(--text-dark, #2C2C2C); 
        }
        
        .htg-subtitle { 
          font-size: 14px; 
          font-weight: 600; 
          color: var(--text-dark, #2C2C2C); 
          margin: 20px 0 10px 0; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }
        
        .htg-list { 
          list-style: none; 
          padding: 0; 
          margin: 0; 
        }
        
        .htg-list li { 
          font-size: 14px; 
          color: var(--text-muted, #6B6B6B); 
          margin-bottom: 8px; 
          padding-left: 16px; 
          position: relative; 
          line-height: 1.5; 
        }
        
        .htg-list li::before { 
          content: '•'; 
          color: var(--gold, #C9A84C); 
          position: absolute; 
          left: 0; 
          font-weight: bold; 
        }
        
        .htg-list li strong { 
          color: var(--text-dark, #2C2C2C); 
        }
        
        .htg-highlight-box { 
          background: var(--cream, #FAF8F5); 
          border-radius: 6px; 
          padding: 16px; 
          font-size: 14px; 
          color: var(--text-dark, #2C2C2C); 
          line-height: 1.5; 
          border-left: 3px solid var(--gold, #C9A84C); 
        }
        
        .htg-pmr-box { 
          background: #eef5f0; 
          border-radius: 6px; 
          padding: 12px 16px; 
          font-size: 13.5px; 
          color: var(--text-dark, #2C2C2C); 
          line-height: 1.5; 
          border-left: 3px solid var(--sage, #9CAF88); 
          margin-top: 12px; 
          margin-bottom: 24px;
        }
        
        .htg-link-map { 
          display: inline-block; 
          font-size: 13px; 
          color: var(--gold, #C9A84C); 
          font-weight: 600; 
          text-decoration: underline; 
          text-underline-offset: 4px; 
          align-self: flex-start; 
          transition: color 0.2s; 
        }
        
        .htg-link-map:hover { 
          color: var(--forest, #2D5A3D); 
        }

        /* Responsive Mobile */
        @media (max-width: 992px) {
          .htg-columns { 
            grid-template-columns: 1fr; 
          }
          .htg-content-block {
            min-height: auto;
          }
        }
      </style>
    `;

    // Cibler les conteneurs et boutons pour les événements
    this._elements.contentArea = document.getElementById('htg-dynamic-content');
    this._elements.transportButtons = this._elements.page.querySelectorAll('button[data-mode]');
    this._elements.tabButtons = this._elements.page.querySelectorAll('button[data-tab]');

    // Attacher les événements aux boutons de mode de transport (Voiture/Train)
    this._elements.transportButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._setMode(e.target.dataset.mode);
      });
    });

    // Attacher les événements aux onglets intercalaires (Cérémonie/Réception)
    this._elements.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._setTab(e.target.dataset.tab);
      });
    });
  },

  _updateContent() {
    if (!this._elements.contentArea) return;

    const isCar = this._mode === 'voiture';
    const isCeremony = this._tab === 'ceremonie';

    let contentHtml = '';

    if (isCeremony) {
      const addressHtml = `
        <address class="htg-address">
          <strong>Église Notre-Dame-de-Pitié</strong><br>
          42520 Malleval
        </address>
      `;
      
      const bodyHtml = isCar 
        ? `
          <p class="htg-text">
            Malleval est un petit village médiéval qui ne compte qu'<strong>une seule rue carrosable</strong>. Il faut prévoir un peu de marge pour rejoindre l'église à pied depuis les parkings :
          </p>
          <div class="htg-pmr-box">
            <strong>♿ Accessibilité :</strong> Un dépose-minute est possible au parking de la salle des fêtes (Rue de Renaud de Forez), permettant d'être déposé à proximité immédiate de l'église (attention, le stationnement prolongé n'y est pas garanti).
          </div>
          <h4 class="htg-subtitle">Parkings</h4>
          <ul class="htg-list">
            <li><strong>Dépose-minute de la Salle des fêtes</strong> ~ 3 min à pied</li>
            <li><strong>Parking du Bourg</strong> ~ 5 min à pied</li>
            <li><strong>Place du Pressoir</strong> ~ 10 min à pied</li>     
            <li><strong>Parking des Faugés</strong> ~ 15 min à pied, en montée</li>
          </ul>
        `
        : `
          <p class="htg-text">
            La gare la plus proche est la <strong>Gare TER Le Péage-de-Roussillon</strong> (ligne Lyon ↔ Valence, à environ 40 min de Lyon Part-Dieu).
          </p>
          <p class="htg-text">
            Depuis la gare, l'église se trouve à une quinzaine de minutes en voiture. N'hésitez pas à utiliser le module de covoiturage pour trouver un trajet depuis la gare.
          </p>
        `;
        
      const linkHtml = `<a href="https://maps.google.com/?q=Église+Notre-Dame-de-Pitié,Malleval,42520" target="_blank" rel="noopener" class="htg-link-map">Ouvrir dans Google Maps</a>`;
      
      contentHtml = addressHtml + `<div class="htg-block-body">` + bodyHtml + `</div>` + linkHtml;
      
    } else {
      const addressHtml = `
        <address class="htg-address">
          <strong>Domaine de la Scie du May</strong><br>
          38 Les Scies, 42740 Doizieux
        </address>
      `;

      const bodyHtml = isCar
        ? `
          <p class="htg-text">
            Comptez 30 minutes depuis l'église. 
          </p>
          <div class="htg-highlight-box">
            <strong>Stationnement :</strong> Un parking gratuit est disponible sur place. Une fois arrivés à Doizieux, suivez les ballons pour trouver l'entrée du domaine !
          </div>
        `
        : `
          <div class="htg-highlight-box">
            <strong>Important :</strong> Le domaine n'étant pas desservi directement par les transports en commun, <strong>le covoiturage est indispensable</strong> depuis l'église ou la gare pour vous y rendre.
          </div>
        `;

      const linkHtml = `<a href="https://maps.google.com/?q=Domaine+de+la+Scie+du+May,38+Les+Scies,Doizieux,42740" target="_blank" rel="noopener" class="htg-link-map">Ouvrir dans Google Maps</a>`;
      
      contentHtml = addressHtml + `<div class="htg-block-body">` + bodyHtml + `</div>` + linkHtml;
    }

    this._elements.contentArea.innerHTML = contentHtml;
  },

  destroy() {
    this._elements.page = null;
    this._elements.contentArea = null;
    this._elements.transportButtons = null;
    this._elements.tabButtons = null;
    
    // Nettoyer les listeners du composant Carpool
    if (typeof Carpool.destroy === 'function') {
      Carpool.destroy();
    }
  }
};

export default HowToGet;