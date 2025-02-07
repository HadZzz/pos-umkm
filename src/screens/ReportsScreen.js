import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Animated } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  DataTable,
  Searchbar,
  Button,
  ActivityIndicator,
  Surface,
  Text,
  Chip,
  IconButton,
} from 'react-native-paper';
import { getTransactions, getTransactionDetails } from '../utils/database';
import { getUserData } from '../utils/storage';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [userData, setUserData] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
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

  const loadData = async () => {
    try {
      const [transactionsData, user] = await Promise.all([
        getTransactions(),
        getUserData()
      ]);
      
      if (user.role === 'cashier') {
        const today = new Date().toISOString().split('T')[0];
        const filteredTransactions = transactionsData.filter(t => 
          t.date.startsWith(today)
        );
        setTransactions(filteredTransactions);
      } else {
        setTransactions(transactionsData);
      }
      
      setUserData(user);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSelect = async (transaction) => {
    try {
      setSelectedTransaction(transaction);
      const details = await getTransactionDetails(transaction.id);
      setTransactionDetails(details);
    } catch (error) {
      console.error('Error loading transaction details:', error);
    }
  };

  const calculateTotalSales = () => {
    return transactions.reduce((total, t) => total + t.total, 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Surface style={styles.summarySection} elevation={4}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.summaryHeader}>
                <IconButton
                  icon="chart-bar"
                  size={40}
                  style={styles.summaryIcon}
                />
                <View>
                  <Title style={styles.summaryTitle}>
                    {userData?.role === 'cashier' ? 'Total Penjualan Hari Ini' : 'Total Semua Penjualan'}
                  </Title>
                  <Paragraph style={styles.summarySubtitle}>
                    {transactions.length} Transaksi
                  </Paragraph>
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.totalAmount}>
                  Rp {calculateTotalSales().toLocaleString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Surface>

        <Surface style={styles.transactionsSection} elevation={4}>
          <Title style={styles.sectionTitle}>Riwayat Transaksi</Title>
          <Searchbar
            placeholder="Cari transaksi..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Tanggal</DataTable.Title>
              <DataTable.Title numeric>Total</DataTable.Title>
              <DataTable.Title>Customer</DataTable.Title>
              <DataTable.Title>Detail</DataTable.Title>
            </DataTable.Header>

            {transactions
              .filter(t => 
                t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                formatDate(t.date).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(transaction => (
                <DataTable.Row key={transaction.id}>
                  <DataTable.Cell>{formatDate(transaction.date)}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={styles.transactionAmount}>
                      Rp {transaction.total.toLocaleString()}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Chip icon="account">
                      {transaction.customer_name}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Button
                      mode="contained-tonal"
                      onPress={() => handleTransactionSelect(transaction)}
                      compact
                    >
                      Lihat
                    </Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
          </DataTable>
        </Surface>

        {selectedTransaction && (
          <Surface style={styles.detailCard} elevation={4}>
            <Card.Content>
              <View style={styles.detailHeader}>
                <Title>Detail Transaksi</Title>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setSelectedTransaction(null)}
                />
              </View>
              <View style={styles.detailInfo}>
                <Chip icon="calendar" style={styles.detailChip}>
                  {formatDate(selectedTransaction.date)}
                </Chip>
                <Chip icon="account" style={styles.detailChip}>
                  {selectedTransaction.customer_name}
                </Chip>
              </View>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Produk</DataTable.Title>
                  <DataTable.Title numeric>Qty</DataTable.Title>
                  <DataTable.Title numeric>Harga</DataTable.Title>
                  <DataTable.Title numeric>Subtotal</DataTable.Title>
                </DataTable.Header>

                {transactionDetails.map((item, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{item.product_name}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      Rp {item.price_per_item.toLocaleString()}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text style={styles.subtotalAmount}>
                        Rp {(item.quantity * item.price_per_item).toLocaleString()}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
              <View style={styles.detailTotal}>
                <Title>Total</Title>
                <Title style={styles.detailTotalAmount}>
                  Rp {selectedTransaction.total.toLocaleString()}
                </Title>
              </View>
            </Card.Content>
          </Surface>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: {
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  summaryCard: {
    backgroundColor: '#2196F3',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 15,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 5,
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  transactionsSection: {
    margin: 15,
    padding: 15,
    borderRadius: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 20,
  },
  searchbar: {
    marginBottom: 15,
    elevation: 2,
  },
  transactionAmount: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  detailCard: {
    margin: 15,
    borderRadius: 15,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailChip: {
    marginRight: 10,
  },
  subtotalAmount: {
    color: '#666',
  },
  detailTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailTotalAmount: {
    color: '#2196F3',
  },
}); 