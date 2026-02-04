/**
 * Génère un ID court et lisible pour les réservations (format: #X87DY)
 * - 5 caractères alphanumériques majuscules
 * - Evite les caractères ambigus: 0, O, I, 1
 * - Facile à communiquer par téléphone/email
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans 0, O, I, 1

/**
 * Génère un ID aléatoire de 5 caractères
 * Exemple: X87DY, K3M9R, etc.
 */
export function generateShortId() {
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return id;
}

/**
 * Génère un ID court unique en vérifiant qu'il n'existe pas déjà
 * @param {Function} checkExists - Fonction async qui vérifie si l'ID existe déjà
 * @param {number} maxRetries - Nombre max de tentatives (défaut: 10)
 * @returns {Promise<string>} Un ID court unique
 */
export async function generateUniqueShortId(checkExists, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const id = generateShortId();
    const exists = await checkExists(id);
    
    if (!exists) {
      return id;
    }
    
    // Si collision, réessayer
    console.warn(`Short ID collision: ${id}, retrying...`);
  }
  
  throw new Error('Unable to generate unique short ID after ' + maxRetries + ' attempts');
}

/**
 * Formate un ID court avec le préfixe #
 * @param {string} id - L'ID court (avec ou sans #)
 * @returns {string} L'ID formaté avec #
 */
export function formatShortId(id) {
  if (!id) return '';
  return id.startsWith('#') ? id : '#' + id;
}

/**
 * Nettoie un ID court (enlève # et espaces, met en majuscules)
 * @param {string} id - L'ID à nettoyer
 * @returns {string} L'ID nettoyé
 */
export function cleanShortId(id) {
  if (!id) return '';
  return id.replace(/[#\s]/g, '').toUpperCase();
}
