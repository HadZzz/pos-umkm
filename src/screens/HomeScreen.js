import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Animated } from 'react-native';
import { Card, Title, Paragraph, Surface, IconButton, Button } from 'react-native-paper';
import { removeUserData, removeUserToken, getUserData } from '../utils/storage';

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    loadUserData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const handleLogout = async () => {
    try {
      await Promise.all([
        removeUserData(),
        removeUserToken()
      ]);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const adminMenuItems = [
    {
      title: 'Transaksi Baru',
      icon: 'cart',
      screen: 'Transaction',
      description: 'Buat transaksi penjualan baru',
      color: '#4CAF50',
    },
    {
      title: 'Produk',
      icon: 'package-variant',
      screen: 'Products',
      description: 'Kelola data produk dan stok',
      color: '#2196F3',
    },
    {
      title: 'Laporan',
      icon: 'chart-bar',
      screen: 'Reports',
      description: 'Lihat laporan penjualan',
      color: '#9C27B0',
    },
    {
      title: 'Pengguna & Pelanggan',
      icon: 'account-group',
      screen: 'Users',
      description: 'Kelola data pengguna dan pelanggan',
      color: '#FF9800',
    },
  ];

  const cashierMenuItems = [
    {
      title: 'Transaksi Baru',
      icon: 'cart',
      screen: 'Transaction',
      description: 'Buat transaksi penjualan baru',
      color: '#4CAF50',
    },
    {
      title: 'Laporan',
      icon: 'chart-bar',
      screen: 'Reports',
      description: 'Lihat laporan penjualan',
      color: '#9C27B0',
    },
  ];

  const menuItems = userData?.role === 'admin' ? adminMenuItems : cashierMenuItems;

  const renderCard = (item, index) => {
    return (
      <Animated.View
        key={index}
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Card
          style={[styles.card, { backgroundColor: item.color }]}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Card.Content style={styles.cardContent}>
            <IconButton
              icon={item.icon}
              size={40}
              iconColor="white"
              style={styles.cardIcon}
            />
            <Title style={styles.cardTitle}>{item.title}</Title>
            <Paragraph style={styles.cardDescription}>
              {item.description}
            </Paragraph>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={[styles.header, { backgroundColor: '#2196F3' }]} elevation={4}>
        <View style={styles.headerContent}>
          <View>
            <Title style={styles.headerTitle}>Selamat Datang!</Title>
            <Paragraph style={styles.headerSubtitle}>
              {userData?.name} ({userData?.role === 'admin' ? 'Administrator' : 'Kasir'})
            </Paragraph>
          </View>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonLabel}
          >
            Logout
          </Button>
        </View>
      </Surface>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => renderCard(item, index))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },
  logoutButtonLabel: {
    color: 'white',
  },
  menuGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    marginBottom: 15,
  },
  card: {
    elevation: 4,
    borderRadius: 15,
  },
  cardContent: {
    alignItems: 'center',
    padding: 15,
    minHeight: 180,
  },
  cardIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    marginBottom: 10,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
}); 