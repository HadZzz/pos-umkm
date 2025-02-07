import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { storeUserData, getUserData, storeUserToken } from '../utils/storage';

// Dummy users untuk demo
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'kasir', password: 'kasir123', role: 'kasir' },
];

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingLogin();
  }, []);

  const checkExistingLogin = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking existing login:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Mohon isi username dan password');
      return;
    }

    setLoading(true);
    try {
      const user = USERS.find(
        u => u.username === username && u.password === password
      );

      if (user) {
        // Simpan data user dan token
        const userData = {
          username: user.username,
          role: user.role,
          loginTime: new Date().toISOString(),
        };
        
        await Promise.all([
          storeUserData(userData),
          storeUserToken('dummy-token-' + Date.now())
        ]);

        navigation.replace('Home');
      } else {
        Alert.alert('Error', 'Username atau password salah');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface} elevation={4}>
        <Text style={styles.title}>POS UMKM</Text>
        <Text style={styles.subtitle}>Point of Sale</Text>
        
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          mode="outlined"
          autoCapitalize="none"
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />
        
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Login
        </Button>

        <Text style={styles.hint}>
          Demo credentials:{'\n'}
          admin / admin123{'\n'}
          kasir / kasir123
        </Text>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  hint: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
}); 