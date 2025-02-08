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
        cashier_name: userData?.name || 'Unknown',
      };

      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price,
      }));

      const transactionId = await addTransaction(transaction, items);

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
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.priceText}>Rp {item.price.toLocaleString()}</Text>
            <Chip 
              icon="package-variant" 
              style={[
                styles.stockChip, 
                {backgroundColor: item.stock < 5 ? '#FEE2E2' : '#ECFDF5'}
              ]}
              textStyle={{
                color: item.stock < 5 ? '#DC2626' : '#059669',
                fontSize: 13,
                lineHeight: 24,
                fontWeight: '500'
              }}
            >
              Stok: {item.stock}
            </Chip>
          </View>
          <Button
            mode="contained"
            onPress={() => addToCart(item)}
            style={styles.addButton}
            labelStyle={styles.addButtonLabel}
            disabled={item.stock < 1}
            icon="cart-plus"
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
      <View style={styles.content}>
        {/* Area Produk */}
        <View style={styles.productSection}>
          <Searchbar
            placeholder="Cari produk..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <View style={styles.productGrid}>
            <FlatList
              data={products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              renderItem={renderProductItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.productListContainer}
              numColumns={1}
            />
          </View>
        </View>

        {/* Keranjang */}
        <Surface style={styles.cart} elevation={4}>
          <View style={styles.cartHeader}>
            <Title style={styles.cartTitle}>Keranjang Belanja</Title>
            <Text style={styles.cartSubtitle}>{cart.length} item</Text>
          </View>

          <ScrollView style={styles.cartItems}>
            {cart.map(item => (
              <Card key={item.id} style={styles.cartItem}>
                <Card.Content>
                  <View style={styles.cartItemHeader}>
                    <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      Rp {item.price.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <View style={styles.quantityControl}>
                      <IconButton
                        icon="minus"
                        size={20}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      />
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <IconButton
                        icon="plus"
                        size={20}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      />
                    </View>
                    <IconButton
                      icon="delete"
                      size={20}
                      mode="contained"
                      containerColor="#FF5252"
                      iconColor="white"
                      onPress={() => removeFromCart(item.id)}
                    />
                  </View>
                  <Text style={styles.subtotalText}>
                    Subtotal: Rp {(item.price * item.quantity).toLocaleString()}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>

          <Divider style={styles.divider} />
          
          <View style={styles.cartFooter}>
            <View style={styles.total}>
              <Title>Total Pembayaran</Title>
              <Title style={styles.totalAmount}>
                Rp {calculateTotal().toLocaleString()}
              </Title>
            </View>
            <Button
              mode="contained"
              onPress={() => setPaymentVisible(true)}
              style={styles.payButton}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
              disabled={cart.length === 0}
              icon="cash-register"
            >
              Bayar Sekarang
            </Button>
          </View>
        </Surface>
      </View>

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
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  productSection: {
    flex: 1,
    maxHeight: '50%', // Membatasi tinggi area produk
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 10,
  },
  productGrid: {
    flex: 1,
  },
  productListContainer: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    width: '100%', // Gunakan lebar penuh
  },
  productContent: {
    padding: 12,
    flexDirection: 'row', // Ubah layout menjadi horizontal
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 4,
  },
  stockChip: {
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  addButton: {
    borderRadius: 8,
    width: 100, // Tetapkan lebar tombol
    height: 36,
  },
  addButtonLabel: {
    fontSize: 14,
  },
  cart: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    maxHeight: '48%', // Membatasi tinggi keranjang
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cartSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  cartItems: {
    paddingHorizontal: 16,
  },
  cartItem: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  cartItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    minWidth: 20,
    textAlign: 'center',
  },
  subtotalText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    marginHorizontal: 16,
    backgroundColor: '#E2E8F0',
    height: 1,
  },
  cartFooter: {
    padding: 16,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalAmount: {
    color: '#2196F3',
    fontSize: 20,
    fontWeight: 'bold',
  },
  payButton: {
    borderRadius: 12,
    height: 48,
  },
  paymentInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  totalText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  changeText: {
    fontSize: 15,
    marginTop: 6,
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 