// components/AdviceFormModal.tsx

import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

// Definisce l'interfaccia per le props del componente
interface AdviceFormModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (text: string) => void;
  adviceText: string;
  setAdviceText: (text: string) => void;
  addAdviceToDatabase: () => void;
}

/**
 * Componente Modale per l'inserimento di consigli, ora con chiusura tramite gesto di scorrimento.
 * Appare dal basso dello schermo e può essere chiuso sia con i pulsanti che con un swipe verso il basso.
 */
const AdviceFormModal: React.FC<AdviceFormModalProps> = ({
  visible,
  onClose,
  userName,
  setUserName,
  adviceText,
  setAdviceText,
  addAdviceToDatabase,
}) => {
  const colors = useThemeColor();
  const [errorMessage, setErrorMessage] = useState(''); // Nuovo stato per il messaggio di errore

  // Variabile animata per tracciare la posizione Y del modal
  const pan = useRef(new Animated.ValueXY()).current;

  // PanResponder per gestire il gesto di swipe
  const panResponder = useRef(
    PanResponder.create({
      // Permette di iniziare il gesto solo se lo scorrimento verticale è maggiore di quello orizzontale
      // Questo rende il gesto più intuitivo e meno sensibile ai piccoli movimenti laterali
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      // Gestisce il movimento del dito
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dy: pan.y, // Associa il movimento del dito alla variabile animata `pan.y`
          },
        ],
        { useNativeDriver: false }
      ),
      // Gestisce il rilascio del dito
      onPanResponderRelease: (evt, gestureState) => {
        // Se la distanza di swipe verso il basso è superiore a 50 pixel, chiude il modal
        if (gestureState.dy > 50) {
          onClose();
        }
        // Riporta il modal alla posizione iniziale con un'animazione
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;
  
  // Funzione di validazione e invio
  const handleAddAdvice = () => {
    // Verifica che il campo del consiglio non sia vuoto
    if (adviceText.trim() === '') {
      setErrorMessage('Il consiglio non può essere vuoto.');
      return; // Interrompe la funzione se il campo è vuoto
    }
    // Se la validazione passa, azzera l'errore e invia il consiglio
    setErrorMessage('');
    addAdviceToDatabase();
  };


  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'space-around', // Allinea il modal in modo uniforme
      backgroundColor: 'rgba(0, 0, 0, 0.35)', // Sfondo semi-trasparente
    },
    modalView: {
      backgroundColor: colors.cardBackground, // Utilizza lo sfondo della card per un migliore contrasto
      borderRadius: 40,
      padding: 25,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '100%',
      maxWidth: 500, // Limita la larghezza per schermi grandi
      alignSelf: 'center', // Centra orizzontalmente il modal
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: 10,
    },
    userNameInput: {
      height: 40,
      borderColor: colors.borderColor,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      color: colors.text,
      backgroundColor: colors.background,
      width: '100%',
    },
    adviceInput: {
      height: 80,
      borderColor: colors.borderColor,
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      marginTop: 10,
      color: colors.text,
      backgroundColor: colors.background,
      width: '100%',
      textAlignVertical: 'top',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 20,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 25,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    closeButton: {
      backgroundColor: colors.secondary, // Colore diverso per il bottone di chiusura
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 25,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    buttonText: {
      color: colors.cardBackground,
      fontSize: 16,
      fontWeight: 'bold',
    },
    errorMessage: {
      color: colors.error, // Utilizza il colore di errore definito nel tema
      marginBottom: 10,
      textAlign: 'center',
      fontWeight: 'bold',
    },
  });

  return (
    <Modal
      animationType="slide" // Animazione di scivolamento dal basso
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.centeredView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.modalView,
            {
              // Applica la trasformazione per permettere lo swipe
              transform: [{ translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers} // Applica i gesti del PanResponder
        >
          <Text style={styles.modalTitle}>Lascia un Consiglio</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.userNameInput}
              placeholder="Il tuo nome (opzionale)"
              placeholderTextColor={colors.text}
              value={userName}
              onChangeText={setUserName}
            />
            <TextInput
              style={styles.adviceInput}
              placeholder="Scrivi qui il tuo consiglio sul prodotto..."
              placeholderTextColor={colors.text}
              multiline
              value={adviceText}
              onChangeText={text => {
                setAdviceText(text);
                if (errorMessage) setErrorMessage(''); // Azzera l'errore quando l'utente digita
              }}
            />
          </View>
          {/* Mostra il messaggio di errore se esiste */}
          {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Chiudi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddAdvice}>
              <Text style={styles.buttonText}>Aggiungi Consiglio</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AdviceFormModal;