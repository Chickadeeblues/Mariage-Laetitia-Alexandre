/**
 * Composant InfoHub — Menu central des informations pratiques
 */

const InfoHub = {
  _elements: {
    page: null,
  },

  init() {
    this._elements.page = document.getElementById('page-home');
    if (!this._elements.page) return;
    
    // On remplace le contenu de la page par la grille
    this._elements.page.innerHTML = this._renderGrid();
  },

  _renderGrid() {
    const items = [
      { title: 'Messe & Réception', hash: '#/programme', icon: '💒' },
      { title: 'Animations & Discours', hash: '#/programme', icon: '🎤' },
      { title: 'Comment venir ?', hash: '#/transports', icon: '🚗' },
      { title: 'Où dormir ?', hash: '#/hebergements', icon: '🛌' },
      { title: 'Liste de mariage', hash: '#/liste', icon: '🎁' },
      { title: 'Contacts utiles', hash: '#/contact', icon: '✉️' }
    ];

    return `
      <section class="info-hub-section">
        <h2 class="section-title">Informations</h2>
        <div class="info-grid">
          ${items.map(item => `
            <a href="${item.hash}" class="info-card">
              <span class="info-icon">${item.icon}</span>
              <h3 class="info-title">${item.title}</h3>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  },

  destroy() {
    // Nettoyage si nécessaire
  }
};

export default InfoHub;