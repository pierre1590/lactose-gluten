/**
 * Definisce la palette di colori per la modalità chiara dell'applicazione.
 */
export const lightColors = {
  primary: '#32CD32',   // Verde per intolleranza al lattosio (chiaro)
  secondary: '#FFD700',  // Arancione per intolleranza al glutine (chiaro)
  background: '#F5F5F5', // Sfondo grigio chiaro
  text: '#212121',       // Colore testo scuro
  error: '#FF4436',      // Rosso per errori
  warning: '#FFEB3B',    // Giallo per avvisi
  success: '#4CAF50',    // Verde per messaggi di successo
  cardBackground: '#FFFFFF', // Sfondo per schede/card in modalità chiara
  borderColor: '#E0E0E0',    // Colore del bordo in modalità chiara
};

/**
 * Definisce la palette di colori per la modalità scura dell'applicazione.
 * I colori sono stati adattati per essere più visibili e armoniosi in un tema scuro.
 */
export const darkColors = {
  primary: '#6BE06B',   // Verde più chiaro per intolleranza al lattosio (scuro)
  secondary: '#FFEB3B',  // Giallo più chiaro per intolleranza al glutine (scuro)
  background: '#121212', // Sfondo molto scuro
  text: '#E0E0E0',       // Colore testo chiaro
  error: '#FF7066',      // Rosso più chiaro per errori
  warning: '#FFF176',    // Giallo più chiaro per avvisi
  success: '#66BB6A',    // Verde più chiaro per messaggi di successo
  cardBackground: '#1E1E1E', // Sfondo per schede/card in modalità scura
  borderColor: '#333333',    // Colore del bordo in modalità scura
};

/**
 * Tipo che rappresenta una chiave di colore valida per entrambe le palette.
 * Utile per la tipizzazione sicura quando si accede ai colori.
 */
export type ColorKey = keyof typeof lightColors;