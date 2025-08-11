// components/ProductScanner.tsx

import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import AdviceFormModal from './AdviceFormModal'; // Importa il nuovo componente modale

// Importazioni Firebase Realtime Database
import { initializeApp } from 'firebase/app';
import { equalTo, getDatabase, off, onValue, orderByChild, push, query, ref, serverTimestamp } from 'firebase/database';
import AdviceSection from './AdviceSection';

// Interfaccia per i dati del prodotto che ci aspettiamo dall'API Open Food Facts
interface ProductInfo {
  product_name?: string;
  ingredients_text?: string;
  allergens_from_ingredients?: string | string[];
  image_url?: string;
  // Aggiungi altri campi che potrebbero interessarti
}

// Interfaccia per un consiglio utente
interface UserAdvice {
  id: string; // ID univoco del consiglio
  adviceText: string;
  timestamp: number; // Timestamp per l'ordinamento
  userId: string; // ID utente generato casualmente
  userName: string; // Nuovo campo per il nome dell'utente (non opzionale)
}

// Variabili globali per Firebase (fornite dall'ambiente Canvas)
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;

// --- CONFIGURAZIONE FIREBASE ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0) {
    return JSON.parse(__firebase_config);
  } else {
    return {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    };
  }
};

const getAppId = () => {
  if (typeof __app_id !== 'undefined') {
    return __app_id;
  } else {
    return process.env.EXPO_PUBLIC_APP_ID || "default-local-app-id";
  }
};

/**
 * Componente per la scansione di codici a barre tramite la fotocamera.
 * Permette all'utente di scansionare un codice a barre, recupera i dettagli del prodotto
 * da Open Food Facts API, analizza la presenza di lattosio/glutine e permette
 * di aggiungere e visualizzare consigli da altri utenti tramite Firebase Realtime Database.
 */
const ProductScanner: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [messageColor, setMessageColor] = useState<string | null>(null);
  
  // Stati per Firebase Realtime Database
  const [database, setDatabase] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [adviceText, setAdviceText] = useState<string>('');
  const [productAdvice, setProductAdvice] = useState<UserAdvice[]>([]);
  const [dbMessage, setDbMessage] = useState<string | null>(null);
  
  // Nuovo stato per la visibilità del modal
  const [showAdviceModal, setShowAdviceModal] = useState(false);

  const colors = useThemeColor();
  const { themeMode } = useTheme();

  // Inizializzazione Firebase Realtime Database e generazione UserId casuale
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = getFirebaseConfig();
        const appId = getAppId();

        if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.projectId) {
          console.error("Firebase config non disponibile. Assicurati che sia definito in Canvas o nel file .env.");
          setDbMessage("Errore: Configurazione Firebase mancante.");
          return;
        }

        const app = initializeApp(firebaseConfig);
        const realtimeDb = getDatabase(app);
        
        setDatabase(realtimeDb);
        setCurrentUserId(Date.now().toString(36) + Math.random().toString(36).substring(2)); 
        
      } catch (error) {
        console.error("Errore nell'inizializzazione di Firebase Realtime Database:", error);
        setDbMessage("Errore nell'inizializzazione del database.");
      }
    };

    initializeFirebase();
  }, []);

  // Richiede i permessi della fotocamera all'avvio del componente
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  

  // useEffect per ascoltare i consigli per il prodotto scansionato
  useEffect(() => {
    if (!database || !scannedData) {
      setProductAdvice([]);
      return;
    }

    const appId = getAppId();
    const adviceRef = ref(database, `artifacts/${appId}/public/data/productAdvice`);
    
    const productAdviceQuery = query(
      adviceRef,
      orderByChild('barcode'),
      equalTo(scannedData)
    );

    const unsubscribe = onValue(productAdviceQuery, (snapshot) => {
      const data = snapshot.val();
      const loadedAdvice: UserAdvice[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          loadedAdvice.push({
            id: key,
            adviceText: data[key].adviceText,
            timestamp: data[key].timestamp,
            userId: data[key].userId,
            userName: data[key].userName || 'Anonimo', // Garantisco che userName sia sempre una stringa
          });
        });
      }
      loadedAdvice.sort((a, b) => b.timestamp - a.timestamp);
      setProductAdvice(loadedAdvice);
    }, (error) => {
      console.error("Errore nel recupero dei consigli:", error);
      setDbMessage("Errore nel caricamento dei consigli.");
    });

    return () => {
      off(productAdviceQuery, 'value', unsubscribe);
    };
  }, [database, scannedData]);

  // Funzione per analizzare gli ingredienti
  const analyzeIngredients = (ingredientsText: string): { message: string, color: string } => {
    const crossContaminationRegex = new RegExp(
      '(\\s*\\(?può\\s+contenere[^)]*\\)?' +
      '|\\s*\\(?potrebbe\\s+contenere[^)]*\\)?' +
      '|\\s*prodotto\\s+in\\s+uno\\s+stabilimento\\s+che\\s+utilizza[^.]*\\.?\\s*' +
      '|\\s*tracce\\s+di[^.]*\\.?\\s*' +
      '|\\s*contaminazione\\s+crociata\\s+con[^.]*\\.?\\s*' +
      '|\\s*non\\s+garantito\\s+senza[^.]*\\.?\\s*' +
      '|\\s*può\\s+contenere\\s+anche[^.]*\\.?\\s*' +
      '|\\s*fabbricato\\s+in\\s+un\\s+impianto\\s+che\\s+lavora[^.]*\\.?\\s*' +
      ')', 'gi'
    );
    const cleanedIngredientsText = ingredientsText.replace(crossContaminationRegex, '');

    const lowerCaseIngredients = cleanedIngredientsText.toLowerCase();
    let containsLactose = false;
    let containsGluten = false;

    const lactoseKeywords = ['latte', 'lattosio', 'siero di latte', 'caseina', 'burro', 'yogurt', 'formaggio', 'crema', 'panna', 'whey', 'caseinato', 'latticello'];
    const glutenKeywords = ['grano', 'frumento', 'orzo', 'segale', 'malto', 'farro', 'kamut', 'couscous', 'seitan', 'avena (se non certificata senza glutine)', 'amido di frumento'];

    for (const keyword of lactoseKeywords) {
      if (lowerCaseIngredients.includes(keyword)) {
        containsLactose = true;
        break;
      }
    }

    for (const keyword of glutenKeywords) {
      if (lowerCaseIngredients.includes(keyword)) {
        containsGluten = true;
        break;
      }
    }

    if (containsLactose && containsGluten) {
      return { message: "Attenzione: Contiene lattosio e glutine! Non adatto ai celiaci.", color: colors.error };
    } else if (containsLactose) {
      return { message: "Attenzione: Contiene lattosio!", color: colors.error };
    } else if (containsGluten) {
      return { message: "Attenzione: Contiene glutine! Non adatto ai celiaci.", color: colors.error };
    } else {
      return { message: "Sembra essere senza lattosio e senza glutine! Adatto ai celiaci.", color: colors.success };
    }
  };

  // Funzione per recuperare i dettagli del prodotto dall'API Open Food Facts
  const fetchProductDetails = async (barcode: string) => {
    setLoading(true);
    setProductInfo(null);
    setScanMessage(null);
    setMessageColor(null);
    setDbMessage(null);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product: ProductInfo = {
          product_name: data.product.product_name || 'Nome non disponibile',
          ingredients_text: data.product.ingredients_text || 'Ingredienti non disponibili',
          allergens_from_ingredients: data.product.allergens_from_ingredients || 'Allergeni non specificati',
          image_url: data.product.image_url,
        };
        setProductInfo(product);

        if (product.ingredients_text) {
          const { message, color } = analyzeIngredients(product.ingredients_text);
          setScanMessage(message);
          setMessageColor(color);
        } else {
          setScanMessage("Ingredienti non disponibili per l'analisi.");
          setMessageColor(colors.warning);
        }

      } else {
        setScanMessage("Prodotto non trovato nel database Open Food Facts.");
        setMessageColor(colors.warning);
      }
    } catch (error) {
      console.error("Errore nel recupero dei dettagli del prodotto:", error);
      setScanMessage("Errore di rete o del server. Riprova.");
      setMessageColor(colors.error);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce la scansione del codice a barre
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      setScannedData(data);
      console.log(`Tipo di codice a barre: ${type}, Dati: ${data}`);
      fetchProductDetails(data);
    }
  };

  // Stili dinamici basati sul tema
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 20,
    },
    cameraContainer: {
      width: '100%',
      aspectRatio: 1,
      overflow: 'hidden',
      borderRadius: 10,
      marginBottom: 20,
    },
    camera: {
      flex: 1,
    },
    permissionText: {
      color: colors.text,
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
    },
    scanResultContainer: {
      marginTop: 20,
      padding: 15,
      marginBottom: 40,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderColor,
      width: '90%',
      maxWidth: 500,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    scanResultText: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'center',
    },
    productName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
      textAlign: 'center',
    },
    ingredientsText: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'left',
      width: '100%',
      marginBottom: 10,
    },
    allergensText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'left',
      width: '100%',
      marginBottom: 10,
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontVariant: ['small-caps'],
    },
    messageText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 10,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 15,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
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
    actionButtonText: {
      color: colors.cardBackground,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    dbMessageText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
    },
    adviceSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
      width: '100%',
    },
    adviceItem: {
      backgroundColor: colors.cardBackground,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderColor,
      marginBottom: 8,
      width: '100%',
    },
    adviceText: {
      color: colors.text,
      fontSize: 14,
      marginBottom: 5,
    },
    adviceMeta: {
      color: colors.secondary,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'right',
    },
    productImage: {
      width: 200,
      height: 200,
      resizeMode: 'contain',
      marginVertical: 10,
      borderRadius: 5,
    },
    openAdviceButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginTop: 15,
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
    openAdviceButtonText: {
      color: colors.cardBackground,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  // Gestione dello stato dei permessi
  if (hasPermission === null || !database || !currentUserId) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Caricamento app e database...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Accesso alla fotocamera negato. Per favore, abilita i permessi nelle impostazioni del tuo dispositivo.
        </Text>
        <Button
          title="Apri Impostazioni"
          onPress={() => Linking.openSettings()}
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Text style={[styles.permissionText, { color: colors.primary, fontSize: 20, fontWeight: 'bold' }]}>
        Scansiona un Codice a Barre
      </Text>
      {!scanned && (
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'], 
            }}
            style={styles.camera}
          />
        </View>
      )}

      {loading && (
        <View style={styles.scanResultContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.scanResultText}>Caricamento dettagli prodotto...</Text>
        </View>
      )}
      
      {scannedData && !loading && (
        <ScrollView style={styles.scanResultContainer} contentContainerStyle={{ alignItems: 'center' }}>
          <Text style={styles.scanResultText}>Codice a Barre Scansionato:</Text>
          <Text style={[styles.scanResultText, { fontWeight: 'bold', fontSize: 18, color: colors.primary }]}>
            {scannedData}
          </Text>

          {scanMessage && (
            <Text style={[styles.messageText, { color: messageColor || colors.text }]}>
              {scanMessage}
            </Text>
          )}

          {productInfo && productInfo.product_name && (
            <Text style={styles.productName}>{productInfo.product_name}</Text>
          )}

          {productInfo && productInfo.image_url && (
            <Image source={{ uri: productInfo.image_url }} style={styles.productImage} />
          )}

          {productInfo && productInfo.ingredients_text && (
            <Text style={styles.ingredientsText}>
              Ingredienti: {productInfo.ingredients_text}
            </Text>
          )}
          
          {productInfo && productInfo.allergens_from_ingredients && (
            <Text style={styles.allergensText}> 
              Allergeni: {Array.isArray(productInfo.allergens_from_ingredients) ? productInfo.allergens_from_ingredients.join(', ') : productInfo.allergens_from_ingredients}
            </Text>
          )}

          {/* Bottone "Scansiona di Nuovo" */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setScanned(false);
                setScannedData(null);
                setProductInfo(null);
                setScanMessage(null);
                setMessageColor(null);
                setDbMessage(null);
                setProductAdvice([]);
              }}
            >
              <Text style={styles.actionButtonText}>Scansiona di Nuovo</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottone per aprire la modale */}
          <TouchableOpacity
            style={styles.openAdviceButton}
            onPress={() => setShowAdviceModal(true)}
          >
            <Text style={styles.openAdviceButtonText}>Lascia un Consiglio</Text>
          </TouchableOpacity>

          {dbMessage && (
            <Text style={styles.dbMessageText}>{dbMessage}</Text>
          )}

          <Text style={styles.adviceSectionTitle}>Consigli degli Utenti</Text>

          {/* Sezione per visualizzare i consigli esistenti */}
          <AdviceSection
            productAdvice={productAdvice}
            dbMessage={dbMessage}
            setShowAdviceModal={setShowAdviceModal}
          />

        </ScrollView>
      )}

      {/* Includi il componente modale qui */}
      <AdviceFormModal
        visible={showAdviceModal}
        onClose={() => setShowAdviceModal(false)}
        userName={userName}
        setUserName={setUserName}
        adviceText={adviceText}
        setAdviceText={setAdviceText} addAdviceToDatabase={function (): void {
          throw new Error('Function not implemented.');
        } }        
      />
    </KeyboardAvoidingView>
  );
};

export default ProductScanner;
