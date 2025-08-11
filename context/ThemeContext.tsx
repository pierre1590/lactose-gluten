 // context/ThemeContext.tsx

    import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
    import { lightColors, darkColors } from '../constants/Color'; // Importa le palette di colori

    // Definisce i tipi per la modalità del tema
    export type ThemeMode = 'light' | 'dark';

    // Definisce l'interfaccia per i colori del tema (sarà la stessa per light e dark)
    export type ThemeColors = typeof lightColors;

    // Definisce l'interfaccia per il contesto del tema
    interface ThemeContextType {
      themeMode: ThemeMode;
      colors: ThemeColors; // I colori attuali basati sulla modalità
      toggleTheme: () => void;
    }

    // Crea il contesto con un valore predefinito (questo valore verrà sovrascritto dal Provider)
    // Forniamo un valore che corrisponde a ThemeContextType per evitare errori di tipizzazione.
    const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

    // Definisce le props per il ThemeProvider
    interface ThemeProviderProps {
      children: ReactNode; // I componenti figli che verranno avvolti dal provider
    }

    /**
     * ThemeProvider è un componente che fornisce lo stato del tema (modalità e colori)
     * e una funzione per cambiarlo a tutti i componenti figli.
     * Utilizza lo stato locale per gestire la modalità del tema e un effetto per
     * determinare i colori attuali basati sulla modalità.
     */
    export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
      // Inizializza la modalità del tema a 'light'
      const [themeMode, setThemeMode] = useState<ThemeMode>('light');
      // Inizializza i colori del tema con quelli della modalità chiara
      const [colors, setColors] = useState<ThemeColors>(lightColors);

      // useEffect per aggiornare i colori ogni volta che themeMode cambia
      useEffect(() => {
        if (themeMode === 'light') {
          setColors(lightColors);
        } else {
          setColors(darkColors);
        }
      }, [themeMode]); // Dipendenza da themeMode

      // Funzione per cambiare la modalità del tema
      const toggleTheme = () => {
        setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      };

      // Il valore che verrà fornito dal contesto
      const contextValue: ThemeContextType = {
        themeMode,
        colors,
        toggleTheme,
      };

      return (
        <ThemeContext.Provider value={contextValue}>
          {children}
        </ThemeContext.Provider>
      );
    };

    /**
     * useTheme è un hook personalizzato per accedere facilmente al contesto del tema.
     * Restituisce la modalità del tema corrente, i colori attuali e la funzione per cambiarlo.
     * Genera un errore se utilizzato al di fuori di un ThemeProvider.
     */
    export const useTheme = () => {
      const context = useContext(ThemeContext);
      if (context === undefined) {
        throw new Error('useTheme deve essere usato all\'interno di un ThemeProvider');
      }
      return context;
    };

    