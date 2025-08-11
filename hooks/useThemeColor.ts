// Importa l'hook useTheme dal contesto del tema
import { useTheme } from '../context/ThemeContext';
// Importa ColorKey direttamente da constants/Colors
import { ColorKey } from '../constants/Color';

// Definizione locale del tipo ThemeColors
type ThemeColors = Record<ColorKey, string>;

/**
 * Un hook React per accedere alla palette di colori corrente del tema.
 * Questo hook utilizza il `ThemeContext` per determinare se la modalità è chiara o scura
 * e restituisce la palette di colori corrispondente.
 *
 * Utilizzo:
 * const colors = useThemeColor();
 * // Poi puoi accedere ai colori come colors.primary, colors.background, ecc.
 *
 * @returns L'oggetto 'ThemeColors' contenente tutti i colori per il tema corrente.
 */
export const useThemeColor = (): ThemeColors => {
  const { colors } = useTheme(); // Ottiene il tema dal contesto
  return colors as ThemeColors;
};

/**
 * Un hook React per ottenere un colore specifico dalla palette del tema corrente tramite il suo nome (chiave).
 * Restituisce una funzione che accetta una chiave di colore e restituisce il valore del colore.
 *
 * Utilizzo:
 * const getSpecificColor = useSpecificThemeColor();
 * const primaryColor = getSpecificColor('primary');
 * const backgroundColor = getSpecificColor('background');
 *
 * @returns Una funzione che prende una chiave di 'ThemeColors' e restituisce il colore corrispondente.
 */
export const useSpecificThemeColor = () => {
  const { colors } = useTheme(); // Ottiene il tema dal contesto

  const getThemeColor = (colorName: ColorKey): string => {
    return colors[colorName];
  };
  return getThemeColor;
};