import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Surface, IconButton } from 'react-native-paper';

export default function HomeScreen({ navigation }) {
  const menuItems = [
    {
      title: 'Transaksi Baru',
      icon: 'cart',
      screen: 'Transaction',
      description: 'Buat transaksi penjualan baru',
    },
    {
      title: 'Produk',
      icon: 'package-variant',
      screen: 'Products',
      description: 'Kelola data produk dan stok',
    },
    {
      title: 'Laporan',
      icon: 'chart-bar',
      screen: 'Reports',
      description: 'Lihat laporan penjualan',
    },
    {
      title: 'Pelanggan',
      icon: 'account-group',
      screen: 'Customers',
      description: 'Kelola data pelanggan',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Title style={styles.headerTitle}>Selamat Datang!</Title>
        <Paragraph style={styles.headerSubtitle}>
          Pilih menu di bawah untuk memulai
        </Paragraph>
      </Surface>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <Card
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Card.Content style={styles.cardContent}>
              <IconButton
                icon={item.icon}
                size={40}
                style={styles.cardIcon}
              />
              <Title style={styles.cardTitle}>{item.title}</Title>
              <Paragraph style={styles.cardDescription}>
                {item.description}
              </Paragraph>
            </Card.Content>
          </Card>
        ))}
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
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuGrid: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 15,
  },
  cardContent: {
    alignItems: 'center',
    padding: 10,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
}); 