import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Alert, Animated } from 'react-native';
import {
  Searchbar,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  List,
  Surface,
  Text,
  IconButton,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  Card,
  Title,
  Paragraph,
} from 'react-native-paper';
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
} from '../../utils/database';

export const CustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    loadCustomers();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = async (customer) => {
    try {
      setSelectedCustomer(customer);
      const transactions = await getCustomerTransactions(customer.id);
      setCustomerTransactions(transactions);
      setShowTransactions(true);
    } catch (error) {
      console.error('Error loading customer transactions:', error);
      Alert.alert('Error', 'Gagal memuat riwayat transaksi');
    }
  };

  const showDialog = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setNewCustomer({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setSelectedCustomer(null);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
    setSelectedCustomer(null);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  const handleSaveCustomer = async () => {
    try {
      if (!newCustomer.name) {
        Alert.alert('Error', 'Nama pelanggan harus diisi');
        return;
      }

      if (selectedCustomer) {
        await updateCustomer({
          ...newCustomer,
          id: selectedCustomer.id,
        });
      } else {
        await addCustomer(newCustomer);
      }

      hideDialog();
      loadCustomers();
      Alert.alert(
        'Sukses',
        selectedCustomer
          ? 'Data pelanggan berhasil diupdate'
          : 'Pelanggan baru berhasil ditambahkan'
      );
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Gagal menyimpan data pelanggan');
    }
  };

  const handleDeleteCustomer = (customer) => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menghapus pelanggan ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              loadCustomers();
              Alert.alert('Sukses', 'Pelanggan berhasil dihapus');
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Gagal menghapus pelanggan');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderCustomerItem = ({ item }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })
        }]
      }}
    >
      <Surface style={styles.customerCard} elevation={2}>
        <Card>
          <Card.Content>
            <View style={styles.customerHeader}>
              <View>
                <Title>{item.name}</Title>
                {item.phone && (
                  <Paragraph style={styles.contactInfo}>
                    📱 {item.phone}
                  </Paragraph>
                )}
                {item.email && (
                  <Paragraph style={styles.contactInfo}>
                    ✉️ {item.email}
                  </Paragraph>
                )}
              </View>
              <Chip icon="star" style={styles.pointsChip}>
                {item.points || 0} Poin
              </Chip>
            </View>
            
            <View style={styles.statsContainer}>
              <Chip icon="shopping" style={styles.statsChip}>
                {item.transaction_count || 0} Transaksi
              </Chip>
              <Chip icon="cash" style={styles.statsChip}>
                Total: Rp {(item.total_spent || 0).toLocaleString()}
              </Chip>
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="contained-tonal"
                onPress={() => handleViewTransactions(item)}
                style={styles.actionButton}
              >
                Riwayat
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => showDialog(item)}
                style={styles.actionButton}
              >
                Edit
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => handleDeleteCustomer(item)}
                style={[styles.actionButton, styles.deleteButton]}
              >
                Hapus
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Surface>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Cari pelanggan..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={customers.filter(customer =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer.phone && customer.phone.includes(searchQuery)) ||
          (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )}
        renderItem={renderCustomerItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>
            {selectedCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nama"
              value={newCustomer.name}
              onChangeText={text => setNewCustomer({ ...newCustomer, name: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="No. Telepon"
              value={newCustomer.phone}
              onChangeText={text => setNewCustomer({ ...newCustomer, phone: text })}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Email"
              value={newCustomer.email}
              onChangeText={text => setNewCustomer({ ...newCustomer, email: text })}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Alamat"
              value={newCustomer.address}
              onChangeText={text => setNewCustomer({ ...newCustomer, address: text })}
              multiline
              style={styles.input}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Batal</Button>
            <Button mode="contained" onPress={handleSaveCustomer}>
              Simpan
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showTransactions} onDismiss={() => setShowTransactions(false)}>
          <Dialog.Title>Riwayat Transaksi</Dialog.Title>
          <Dialog.Content>
            {customerTransactions.length > 0 ? (
              <FlatList
                data={customerTransactions}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <List.Item
                    title={`Rp ${item.total.toLocaleString()}`}
                    description={new Date(item.date).toLocaleString('id-ID')}
                    right={props => (
                      <View style={styles.transactionPoints}>
                        <Text>+{item.points_earned || 0} poin</Text>
                        {item.points_used > 0 && (
                          <Text>-{item.points_used} poin</Text>
                        )}
                      </View>
                    )}
                  />
                )}
              />
            ) : (
              <Text>Belum ada transaksi</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTransactions(false)}>Tutup</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => showDialog()}
      />
    </View>
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
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  listContainer: {
    padding: 10,
  },
  customerCard: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pointsChip: {
    backgroundColor: '#4CAF50',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statsChip: {
    marginRight: 8,
    backgroundColor: '#E8EAF6',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  transactionPoints: {
    alignItems: 'flex-end',
  },
}); 