/**
 * i18n.js — Système de traduction
 */

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.info': 'Informations pratiques ▾',
    'nav.rsvp': 'RSVP',
    'nav.howToGet': 'Comment venir ?',
    'nav.accommodations': 'Hébergements',
    'nav.carpool': 'Covoiturage',
    'nav.giftList': 'Liste de mariage',
    'nav.faq': 'Questions fréquentes',
    'nav.admin': 'Espace mariés',
    'nav.myResponses': 'Mes réponses',
    'nav.sub.messe': '💒 Messe & Réception',
    'nav.sub.animations': '🎤 Animations & Discours',
    'nav.sub.contacts': '✉️ Contacts utiles',

    // Hero (Page d'accueil)
    'hero.invite': 'Nous avons le bonheur de vous convier',
    'hero.celebrate': 'à célébrer le mariage de',
    'hero.date': '8 MAI 2027',
    'hero.rsvpBefore': 'RSVP avant le <strong>30 décembre 2026</strong>',
    'hero.btn.rsvp': 'Confirmer ma présence',
    'hero.btn.info': 'Informations pratiques',
    'hero.btn.edit': 'Modifier ma réponse',

    // Publication (Placeholders)
    'publication.comingSoon': 'Plus d\'informations à venir.',

    // Hub Infos
    'hub.title': 'Informations pratiques',
    'hub.subtitle': 'Tout ce qu\'il faut savoir pour préparer votre venue.',
    'hub.card.messe.title': 'Messe & Réception',
    'hub.card.messe.desc': 'Horaires, lieux et déroulé de la journée',
    'hub.card.sleep.title': 'Où dormir ?',
    'hub.card.sleep.desc': 'Hébergements à proximité du domaine',
    'hub.card.travel.title': 'Comment venir ?',
    'hub.card.travel.desc': 'Itinéraires, parkings et covoiturage',
    'hub.card.gift.title': 'Liste de mariage',
    'hub.card.gift.desc': 'Nos envies pour débuter notre vie ensemble',
    'hub.card.anim.title': 'Animations & Discours',
    'hub.card.anim.desc': 'Programme des animations de la soirée',
    'hub.card.contact.title': 'Contacts utiles',
    'hub.card.contact.desc': 'Les personnes à contacter le jour J',

    // General
    'general.loading': 'Chargement...',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.info': 'Información práctica ▾',
    'nav.rsvp': 'Asistencia',
    'nav.howToGet': '¿Cómo llegar?',
    'nav.accommodations': 'Alojamiento',
    'nav.carpool': 'Viaje compartido',
    'nav.giftList': 'Lista de bodas',
    'nav.faq': 'Preguntas frecuentes',
    'nav.admin': 'Área de novios',
    'nav.myResponses': 'Mis respuestas',
    'nav.sub.messe': '💒 Ceremonia y Recepción',
    'nav.sub.animations': '🎤 Animaciones y Discursos',
    'nav.sub.contacts': '✉️ Contactos útiles',

    // Hero (Page d'accueil)
    'hero.invite': 'Tenemos la alegría de invitarles',
    'hero.celebrate': 'a celebrar la boda de',
    'hero.date': '8 DE MAYO DE 2027',
    'hero.rsvpBefore': 'Confirmar antes del <strong>30 de diciembre de 2026</strong>',
    'hero.btn.rsvp': 'Confirmar mi asistencia',
    'hero.btn.info': 'Información práctica',
    'hero.btn.edit': 'Modificar mi respuesta',

    // Publication (Placeholders)
    'publication.comingSoon': 'Más información próximamente.',

    // Hub Infos
    'hub.title': 'Información práctica',
    'hub.subtitle': 'Todo lo que necesitas saber para preparar tu llegada.',
    'hub.card.messe.title': 'Ceremonia y Recepción',
    'hub.card.messe.desc': 'Horarios, lugares y programa del día',
    'hub.card.sleep.title': '¿Dónde dormir?',
    'hub.card.sleep.desc': 'Alojamientos cerca del lugar',
    'hub.card.travel.title': '¿Cómo llegar?',
    'hub.card.travel.desc': 'Rutas, aparcamiento y viajes compartidos',
    'hub.card.gift.title': 'Lista de bodas',
    'hub.card.gift.desc': 'Nuestros deseos para empezar la vida juntos',
    'hub.card.anim.title': 'Animaciones y Discursos',
    'hub.card.anim.desc': 'Programa de animaciones de la noche',
    'hub.card.contact.title': 'Contactos útiles',
    'hub.card.contact.desc': 'Personas a contactar el gran día',

    // General
    'general.loading': 'Cargando...',
  }
};

const I18n = {
  currentLang: localStorage.getItem('wedding_lang') || 'fr',

  init() {
    this.updateDOM();
  },

  setLang(lang) {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    localStorage.setItem('wedding_lang', lang);
    document.documentElement.lang = lang;
    this.updateDOM();
    
    // Émettre un événement pour que les composants puissent se re-rendre si nécessaire
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
  },

  t(key) {
    return translations[this.currentLang][key] || translations['fr'][key] || key;
  },

  updateDOM() {
    // Met à jour tous les éléments avec l'attribut data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        // Si c'est un input/textarea placeholder
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
           el.placeholder = translation;
        } else {
           el.innerHTML = translation;
        }
      }
    });
  }
};

export default I18n;
