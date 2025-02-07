import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  DataTable,
  Searchbar,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { getTransactions, getTransactionDetails } from '../utils/database';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
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
    <View style={styles.container}>
      <View style={styles.summarySection}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Total Penjualan</Title>
            <Paragraph style={styles.totalAmount}>
              Rp {calculateTotalSales().toLocaleString()}
            </Paragraph>
            <Paragraph>Total Transaksi: {transactions.length}</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.transactionsSection}>
        <Title style={styles.sectionTitle}>Riwayat Transaksi</Title>
        <Searchbar
          placeholder="Cari transaksi..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView>
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
                    Rp {transaction.total.toLocaleString()}
                  </DataTable.Cell>
                  <DataTable.Cell>{transaction.customer_name}</DataTable.Cell>
                  <DataTable.Cell>
                    <Button
                      mode="text"
                      onPress={() => handleTransactionSelect(transaction)}
                    >
                      Lihat
                    </Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
          </DataTable>
        </ScrollView>
      </View>

      {selectedTransaction && (
        <Card style={styles.detailCard}>
          <Card.Content>
            <Title>Detail Transaksi</Title>
            <Paragraph>
              Tanggal: {formatDate(selectedTransaction.date)}
            </Paragraph>
            <Paragraph>
              Customer: {selectedTransaction.customer_name}
            </Paragraph>
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
                    Rp {(item.quantity * item.price_per_item).toLocaleString()}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
            <Title style={styles.totalText}>
              Total: Rp {selectedTransaction.total.toLocaleString()}
            </Title>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryCard: {
    elevation: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 10,
  },
  transactionsSection: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  searchbar: {
    marginBottom: 10,
  },
  detailCard: {
    marginTop: 10,
    elevation: 4,
  },
  totalText: {
    marginTop: 10,
    textAlign: 'right',
  },
}); 