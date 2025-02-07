import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Animated, FlatList } from 'react-native';
import {
  Searchbar,
  List,
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Divider,
  Surface,
  TextInput,
  Portal,
  Dialog,
  ActivityIndicator,
  Text,
  Chip,
} from 'react-native-paper';
import { getProducts, addTransaction } from '../utils/database';
import { getUserData } from '../utils/storage';
import InvoiceGenerator from '../features/invoices/InvoiceGenerator';

export default function TransactionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [lastTransactionItems, setLastTransactionItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadInitialData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, user] = await Promise.all([
        getProducts(),
        getUserData()
      ]);
      setProducts(productsData);
      setUserData(user);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    if (product.stock < 1) {
      Alert.alert('Error', 'Stok produk habis');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        Alert.alert('Error', 'Stok tidak mencukupi');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      Alert.alert('Error', 'Stok tidak mencukupi');
      return;
    }

    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePayment = async () => {
    const total = calculateTotal();
    const payment = parseFloat(paymentAmount);

    if (payment < total) {
      Alert.alert('Error', 'Pembayaran kurang dari total belanja');
      return;
    }

    try {
      const transaction = {
        date: new Date().toISOString(),
        total: total,
        payment_amount: payment,
        payment_method: paymentMethod,
        customer_name: customerName || 'Guest',
        cashier_id: userData?.id,
      };

      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price,
      }));

      await addTransaction(transaction, items);

      setLastTransaction(transaction);
      setLastTransactionItems(items);
      setShowInvoice(true);

      Alert.alert(
        'Sukses',
        `Transaksi berhasil!\nKembalian: Rp ${(payment - total).toLocaleString()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCart([]);
              setPaymentVisible(false);
              setPaymentAmount('');
              setPaymentMethod('cash');
              setCustomerName('');
              loadInitialData();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Gagal memproses pembayaran');
    }
  };

  const renderProductItem = ({ item }) => (
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
      <Surface style={styles.productCard} elevation={2}>
        <View style={styles.productContent}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.priceText}>Rp {item.price.toLocaleString()}</Text>
            <Chip icon="package-variant" style={styles.stockChip}>
              Stok: {item.stock}
            </Chip>
          </View>
          <Button
            mode="contained"
            onPress={() => addToCart(item)}
            style={styles.addButton}
            disabled={item.stock < 1}
          >
            Tambah
          </Button>
        </View>
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
      <View style={styles.productList}>
        <Searchbar
          placeholder="Cari produk..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <FlatList
          data={products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.productListContainer}
        />
      </View>

      <Surface style={styles.cart} elevation={4}>
        <Title style={styles.cartTitle}>Keranjang</Title>
        <ScrollView style={styles.cartItems}>
          {cart.map(item => (
            <Card key={item.id} style={styles.cartItem}>
              <Card.Content>
                <View style={styles.cartItemHeader}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    Rp {item.price.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.cartItemActions}>
                  <View style={styles.quantityControl}>
                    <IconButton
                      icon="minus"
                      mode="contained"
                      size={20}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    />
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <IconButton
                      icon="plus"
                      mode="contained"
                      size={20}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    />
                  </View>
                  <IconButton
                    icon="delete"
                    mode="contained"
                    containerColor="#FF5252"
                    iconColor="white"
                    size={20}
                    onPress={() => removeFromCart(item.id)}
                  />
                </View>
                <Text style={styles.subtotalText}>
                  Subtotal: Rp {(item.quantity * item.price).toLocaleString()}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        <Divider style={styles.divider} />
        
        <View style={styles.total}>
          <Title>Total</Title>
          <Title style={styles.totalAmount}>
            Rp {calculateTotal().toLocaleString()}
          </Title>
        </View>

        <Button
          mode="contained"
          onPress={() => setPaymentVisible(true)}
          disabled={cart.length === 0}
          style={styles.payButton}
        >
          Bayar
        </Button>
      </Surface>

      <Portal>
        <Dialog visible={paymentVisible} onDismiss={() => setPaymentVisible(false)}>
          <Dialog.Title>Pembayaran</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nama Pelanggan (Opsional)"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.paymentInput}
              mode="outlined"
            />
            <TextInput
              label="Jumlah Pembayaran"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              style={styles.paymentInput}
              mode="outlined"
              left={<TextInput.Affix text="Rp" />}
            />
            <Text style={styles.totalText}>
              Total: Rp {calculateTotal().toLocaleString()}
            </Text>
            {paymentAmount && (
              <Text style={styles.changeText}>
                Kembalian: Rp {(parseFloat(paymentAmount || 0) - calculateTotal()).toLocaleString()}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPaymentVisible(false)}>Batal</Button>
            <Button mode="contained" onPress={handlePayment}>
              Proses
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showInvoice} onDismiss={() => setShowInvoice(false)}>
          <Dialog.Title>Cetak Struk</Dialog.Title>
          <Dialog.Content>
            <InvoiceGenerator
              transaction={lastTransaction}
              items={lastTransactionItems.map(item => ({
                ...item,
                product_name: products.find(p => p.id === item.product_id)?.name || ''
              }))}
              customer={selectedCustomer}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInvoice(false)}>Tutup</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    flex: 3,
    padding: 10,
  },
  searchbar: {
    marginBottom: 10,
    elevation: 2,
  },
  productListContainer: {
    padding: 5,
  },
  productCard: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  stockChip: {
    alignSelf: 'flex-start',
  },
  addButton: {
    marginLeft: 10,
  },
  cart: {
    flex: 2,
    padding: 10,
    margin: 10,
    borderRadius: 10,
  },
  cartTitle: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cartItems: {
    flex: 1,
  },
  cartItem: {
    marginBottom: 8,
    borderRadius: 8,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  cartItemPrice: {
    color: '#2196F3',
  },
  cartItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 4,
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
  },
  subtotalText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 10,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  totalAmount: {
    color: '#2196F3',
  },
  payButton: {
    marginTop: 10,
    borderRadius: 30,
  },
  paymentInput: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  totalText: {
    fontSize: 18,
    marginTop: 15,
    fontWeight: 'bold',
  },
  changeText: {
    fontSize: 16,
    marginTop: 5,
    color: '#4CAF50',
  },
}); 