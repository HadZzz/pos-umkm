import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Alert } from 'react-native';
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
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import { getUsers, addUser, updateUser, deleteUser } from '../utils/database';
import AccessControl from '../components/AccessControl';

const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'cashier', label: 'Kasir' },
];

const TABS = [
  { value: 'users', label: 'Pengguna' },
  { value: 'customers', label: 'Pelanggan' },
];

export default function UsersScreen() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const showDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setNewUser({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setNewUser({
        username: '',
        password: '',
        name: '',
        role: 'cashier',
      });
    }
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
    setEditingUser(null);
    setNewUser({
      username: '',
      password: '',
      name: '',
      role: 'cashier',
    });
  };

  const handleSaveUser = async () => {
    try {
      if (!newUser.name || (!editingUser && !newUser.password)) {
        Alert.alert('Error', 'Mohon lengkapi semua field yang diperlukan');
        return;
      }

      const userData = {
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
      };

      if (editingUser) {
        if (newUser.password) {
          userData.password = newUser.password;
        }
        userData.id = editingUser.id;
        await updateUser(userData);
      } else {
        if (!newUser.username) {
          Alert.alert('Error', 'Username harus diisi');
          return;
        }
        userData.password = newUser.password;
        await addUser(userData);
      }

      hideDialog();
      loadUsers();
      Alert.alert('Sukses', editingUser ? 'Pengguna berhasil diupdate' : 'Pengguna berhasil ditambahkan');
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Gagal menyimpan pengguna');
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menghapus pengguna ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          onPress: async () => {
            try {
              await deleteUser(userId);
              loadUsers();
              Alert.alert('Sukses', 'Pengguna berhasil dihapus');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Gagal menghapus pengguna');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <List.Item
      title={item.name}
      description={`Username: ${item.username} | Role: ${item.role}`}
      right={props => (
        <View style={styles.rightContent}>
          <IconButton icon="pencil" onPress={() => showDialog(item)} />
          {item.username !== 'admin' && (
            <IconButton icon="delete" onPress={() => handleDeleteUser(item.id)} />
          )}
        </View>
      )}
    />
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
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={TABS}
          style={styles.tabs}
        />

        {activeTab === 'users' ? (
          <>
            <Searchbar
              placeholder="Cari pengguna..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />

            <FlatList
              data={users.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
            />

            <Portal>
              <Dialog visible={visible} onDismiss={hideDialog}>
                <Dialog.Title>
                  {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </Dialog.Title>
                <Dialog.Content>
                  {!editingUser && (
                    <TextInput
                      label="Username"
                      value={newUser.username}
                      onChangeText={text => setNewUser({ ...newUser, username: text })}
                      style={styles.input}
                    />
                  )}
                  <TextInput
                    label="Nama"
                    value={newUser.name}
                    onChangeText={text => setNewUser({ ...newUser, name: text })}
                    style={styles.input}
                  />
                  <TextInput
                    label={editingUser ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
                    value={newUser.password}
                    onChangeText={text => setNewUser({ ...newUser, password: text })}
                    secureTextEntry
                    style={styles.input}
                  />
                  <SegmentedButtons
                    value={newUser.role}
                    onValueChange={value => setNewUser({ ...newUser, role: value })}
                    buttons={USER_ROLES}
                    style={styles.roleButtons}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={hideDialog}>Batal</Button>
                  <Button onPress={handleSaveUser}>Simpan</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            <FAB
              style={styles.fab}
              icon="plus"
              onPress={() => showDialog()}
            />
          </>
        ) : (
          <View style={styles.comingSoon}>
            <Text>Fitur manajemen pelanggan akan segera hadir</Text>
          </View>
        )}
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
  tabs: {
    margin: 10,
  },
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 10,
  },
  roleButtons: {
    marginTop: 10,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 