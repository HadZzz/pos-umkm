import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Alert, Animated, Dimensions } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { storeUserData, getUserData, storeUserToken } from '../utils/storage';

const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'kasir', password: 'kasir123', role: 'kasir' },
];

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    checkExistingLogin();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
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
        const userData = {
          username: user.username,
          role: user.role,
          name: user.username === 'admin' ? 'Administrator' : 'Kasir',
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
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
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
            left={<TextInput.Icon icon="account" />}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon="eye" />}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 30,
  },
  hint: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
});