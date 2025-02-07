import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Alert, Animated } from 'react-native';
import { 
  List, 
  FAB, 
  Searchbar, 
  IconButton, 
  Portal, 
  Dialog, 
  Button, 
  TextInput,
  ActivityIndicator,
  Menu,
  Surface,
  Text,
  Chip,
} from 'react-native-paper';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../utils/database';
import AccessControl from '../components/AccessControl';

const PRODUCT_CATEGORIES = [
  'Makanan',
  'Minuman',
  'Snack',
  'Alat Tulis',
  'Kebutuhan Pokok',
  'Lainnya',
];

const getCategoryColor = (category) => {
  const colors = {
    'Makanan': '#4CAF50',
    'Minuman': '#2196F3',
    'Snack': '#FF9800',
    'Alat Tulis': '#9C27B0',
    'Kebutuhan Pokok': '#F44336',
    'Lainnya': '#607D8B',
  };
  return colors[category] || colors['Lainnya'];
};

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
  });
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadProducts();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  const showDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
      });
    } else {
      setEditingProduct(null);
      setNewProduct({
        name: '',
        price: '',
        stock: '',
        category: '',
      });
    }
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      price: '',
      stock: '',
      category: '',
    });
    setCategoryMenuVisible(false);
  };

  const handleSaveProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.price || !newProduct.stock) {
        Alert.alert('Error', 'Mohon lengkapi semua field');
        return;
      }

      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category || 'Lainnya',
      };

      if (editingProduct) {
        await updateProduct({
          ...productData,
          id: editingProduct.id,
        });
      } else {
        await addProduct(productData);
      }

      hideDialog();
      loadProducts();
      Alert.alert('Sukses', editingProduct ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menghapus produk ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              loadProducts();
              Alert.alert('Sukses', 'Produk berhasil dihapus');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Gagal menghapus produk');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => (
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
            <View style={styles.productDetails}>
              <Chip 
                style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
                textStyle={{ color: 'white' }}
              >
                {item.category || 'Lainnya'}
              </Chip>
              <Text style={styles.stockText}>Stok Tersedia: {item.stock}</Text>
            </View>
          </View>
          <View style={styles.productActions}>
            <Text style={styles.priceText}>
              Rp {item.price.toLocaleString()}
            </Text>
            <View style={styles.actionButtons}>
              <IconButton 
                icon="pencil" 
                mode="contained" 
                containerColor="#2196F3"
                iconColor="white"
                size={16}
                onPress={() => showDialog(item)}
              />
              <IconButton 
                icon="delete" 
                mode="contained"
                containerColor="#FF5252"
                iconColor="white"
                size={16}
                onPress={() => handleDeleteProduct(item.id)}
              />
            </View>
          </View>
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
    <AccessControl allowedRoles={['admin']}>
      <View style={styles.container}>
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
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />

        <Portal>
          <Dialog visible={visible} onDismiss={hideDialog}>
            <Dialog.Title>
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nama Produk"
                value={newProduct.name}
                onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Harga"
                value={newProduct.price}
                onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                left={<TextInput.Affix text="Rp" />}
              />
              <TextInput
                label="Stok"
                value={newProduct.stock}
                onChangeText={text => setNewProduct({ ...newProduct, stock: text })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
              />
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <TextInput
                    label="Kategori"
                    value={newProduct.category}
                    onFocus={() => setCategoryMenuVisible(true)}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="menu-down" />}
                  />
                }
              >
                {PRODUCT_CATEGORIES.map((category) => (
                  <Menu.Item
                    key={category}
                    onPress={() => {
                      setNewProduct({ ...newProduct, category });
                      setCategoryMenuVisible(false);
                    }}
                    title={category}
                  />
                ))}
              </Menu>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Batal</Button>
              <Button mode="contained" onPress={handleSaveProduct}>
                Simpan
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => showDialog()}
        />
      </View>
    </AccessControl>
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
  productCard: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productContent: {
    padding: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginRight: 0,
  },
  stockText: {
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 13,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
}); 