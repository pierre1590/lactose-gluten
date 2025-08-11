import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import AdviceFormModal from './AdviceFormModal';
import { useTheme } from '@/context/ThemeContext';

interface AdviceSectionProps {
  productAdvice: { id: string; adviceText: string; timestamp: any; userName: string }[];
  dbMessage: string | null;
  setShowAdviceModal: (visible: boolean) => void;
}

const AdviceSection: React.FC<AdviceSectionProps> = ({
  productAdvice,
  dbMessage,
  setShowAdviceModal,
}) => {
  const colors = useThemeColor();
  const { themeMode } = useTheme(); // Ottiene la modalità del tema corrente

  const styles = StyleSheet.create({
    adviceSectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    openAdviceButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 10,
    },
    openAdviceButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    dbMessageText: {
      textAlign: 'center',
      color: colors.text,
      marginTop: 10,
      fontWeight: 'bold',
    },
    adviceItem: {
      backgroundColor: colors.cardBackground,
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    adviceText: {
      color: colors.text,
      fontSize: 14,
      marginBottom: 5,
    },
    adviceMeta: {
    color: themeMode === 'light' ? colors.text : colors.secondary,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'right',
    },
  });

  return (
    <View>
      
      {dbMessage && <Text style={styles.dbMessageText}>{dbMessage}</Text>}


      {productAdvice.length > 0 ? (
        productAdvice.map((advice) => (
          <View key={advice.id} style={styles.adviceItem}>
            <Text style={styles.adviceText}>{advice.adviceText}</Text>
            <Text style={styles.adviceMeta}>
              Condiviso da: {advice.userName || 'Anonimo'} il{' '}
              {new Date(advice.timestamp).toLocaleDateString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={[styles.adviceText, { textAlign: 'center' }]}>Nessun consiglio ancora. Sii il primo!</Text>
      )}
    </View>
  );
};

export default AdviceSection;
