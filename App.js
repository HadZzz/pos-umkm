import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/utils/database';
import { View, StyleSheet, Image } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import UsersScreen from './src/screens/UsersScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    accent: '#03A9F4',
    background: '#F5F5F5',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/splash.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: '#fff',
              headerShadowVisible: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Dashboard' }}
            />
            <Stack.Screen 
              name="Products" 
              component={ProductsScreen}
              options={{ title: 'Manajemen Produk' }}
            />
            <Stack.Screen 
              name="Transaction" 
              component={TransactionScreen}
              options={{ title: 'Transaksi Baru' }}
            />
            <Stack.Screen 
              name="Reports" 
              component={ReportsScreen}
              options={{ title: 'Laporan Penjualan' }}
            />
            <Stack.Screen 
              name="Users" 
              component={UsersScreen}
              options={{ title: 'Manajemen Pengguna & Pelanggan' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '80%',
    height: '80%',
  },
});
