import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
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
} from 'react-native-paper';
import { getProducts, addTransaction } from '../utils/database';

export default function TransactionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Gagal memuat data produk');
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
      };

      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price,
      }));

      await addTransaction(transaction, items);

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
              loadProducts(); // Reload products to update stock
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Gagal memproses pembayaran');
    }
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
      <View style={styles.productList}>
        <Searchbar
          placeholder="Cari produk..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <ScrollView>
          {products
            .filter(product =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(product => (
              <List.Item
                key={product.id}
                title={product.name}
                description={`Rp ${product.price.toLocaleString()} | Stok: ${product.stock}`}
                right={props => (
                  <Button
                    mode="contained"
                    onPress={() => addToCart(product)}
                    style={styles.addButton}
                    disabled={product.stock < 1}
                  >
                    Tambah
                  </Button>
                )}
              />
            ))}
        </ScrollView>
      </View>

      <Surface style={styles.cart} elevation={4}>
        <Title style={styles.cartTitle}>Keranjang</Title>
        <ScrollView style={styles.cartItems}>
          {cart.map(item => (
            <Card key={item.id} style={styles.cartItem}>
              <Card.Content style={styles.cartItemContent}>
                <View style={styles.cartItemInfo}>
                  <Paragraph>{item.name}</Paragraph>
                  <Paragraph>Rp {item.price.toLocaleString()}</Paragraph>
                </View>
                <View style={styles.cartItemActions}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  />
                  <Paragraph>{item.quantity}</Paragraph>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeFromCart(item.id)}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        <Divider style={styles.divider} />
        
        <View style={styles.total}>
          <Title>Total</Title>
          <Title>Rp {calculateTotal().toLocaleString()}</Title>
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
            />
            <TextInput
              label="Jumlah Pembayaran"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              style={styles.paymentInput}
            />
            <Paragraph style={styles.totalText}>
              Total: Rp {calculateTotal().toLocaleString()}
            </Paragraph>
            {paymentAmount && (
              <Paragraph style={styles.changeText}>
                Kembalian: Rp {(parseFloat(paymentAmount || 0) - calculateTotal()).toLocaleString()}
              </Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPaymentVisible(false)}>Batal</Button>
            <Button onPress={handlePayment}>Proses</Button>
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
  },
  addButton: {
    marginVertical: 5,
  },
  cart: {
    flex: 2,
    padding: 10,
    margin: 10,
    backgroundColor: 'white',
  },
  cartTitle: {
    marginBottom: 10,
  },
  cartItems: {
    flex: 1,
  },
  cartItem: {
    marginBottom: 5,
  },
  cartItemContent: {
    flexDirection: 'column',
  },
  cartItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
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
  payButton: {
    marginTop: 10,
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
  paymentInput: {
    marginBottom: 10,
  },
}); 