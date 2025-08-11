// app/index.tsx (Questa è la tua pagina principale di Expo Router)

import React from 'react';
import { StyleSheet, View } from 'react-native';
import ProductScanner from '../components/ProductScanner'; // Importa il componente ProductScanner
import { useThemeColor } from '../hooks/useThemeColor'; // Importa il tuo hook per i colori

/**
 * Pagina principale dell'applicazione.
 * Attualmente renderizza il componente ProductScanner per la scansione di codici a barre.
 * In futuro, qui potrebbe esserci una navigazione tra diverse sezioni dell'app.
 */
const HomePage: React.FC = () => {
  const colors = useThemeColor(); // Ottiene i colori del tema corrente

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Sfondo basato sul tema
      // Assicurati che il ProductScanner occupi tutto lo spazio disponibile
    },
  });

  return (
    <View style={styles.container}>
      <ProductScanner />
    </View>
  );
};

export default HomePage;
