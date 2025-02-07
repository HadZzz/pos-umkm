import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Alert, ScrollView } from 'react-native';
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
  SegmentedButtons,
  Surface,
  Text,
  Card,
  Title,
  Paragraph,
  Divider,
  DataTable,
} from 'react-native-paper';
import { getUsers, addUser, updateUser, deleteUser } from '../utils/database';
import AccessControl from '../components/AccessControl';

const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'kasir', label: 'Kasir' },
];

const USER_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_products',
    'manage_customers',
    'view_reports',
    'manage_settings',
    'process_transactions',
  ],
  kasir: [
    'process_transactions',
    'view_customers',
    'view_products',
  ],
};

export default function UsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUserLogs, setShowUserLogs] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'kasir',
    permissions: [],
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
        permissions: user.permissions || USER_PERMISSIONS[user.role],
      });
    } else {
      setEditingUser(null);
      setNewUser({
        username: '',
        password: '',
        name: '',
        role: 'kasir',
        permissions: USER_PERMISSIONS['kasir'],
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
      role: 'kasir',
      permissions: [],
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
        permissions: newUser.permissions,
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

  const handleResetPassword = async () => {
    try {
      if (!newPassword) {
        Alert.alert('Error', 'Password baru harus diisi');
        return;
      }

      await updateUser({
        id: selectedUser.id,
        password: newPassword,
      });

      setShowResetPassword(false);
      setNewPassword('');
      Alert.alert('Sukses', 'Password berhasil direset');
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'Gagal mereset password');
    }
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserLogs(true);
  };

  const renderUserItem = ({ item }) => (
    <Surface style={styles.userCard} elevation={2}>
      <Card>
        <Card.Content>
          <View style={styles.userHeader}>
            <View>
              <Title>{item.name}</Title>
              <Paragraph style={styles.userInfo}>
                Username: {item.username}
              </Paragraph>
              <Paragraph style={styles.userInfo}>
                Role: {item.role}
              </Paragraph>
            </View>
            <View style={styles.userActions}>
              <IconButton
                icon="key"
                mode="contained"
                containerColor="#4CAF50"
                iconColor="white"
                size={20}
                onPress={() => {
                  setSelectedUser(item);
                  setShowResetPassword(true);
                }}
              />
              <IconButton
                icon="history"
                mode="contained"
                containerColor="#2196F3"
                iconColor="white"
                size={20}
                onPress={() => showUserDetails(item)}
              />
              <IconButton
                icon="pencil"
                mode="contained"
                containerColor="#FF9800"
                iconColor="white"
                size={20}
                onPress={() => showDialog(item)}
              />
              {item.username !== 'admin' && (
                <IconButton
                  icon="delete"
                  mode="contained"
                  containerColor="#F44336"
                  iconColor="white"
                  size={20}
                  onPress={() => handleDeleteUser(item.id)}
                />
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>Hak Akses:</Text>
            <View style={styles.permissionsList}>
              {(item.permissions || USER_PERMISSIONS[item.role]).map((permission, index) => (
                <Text key={index} style={styles.permission}>
                  • {permission.replace(/_/g, ' ').toUpperCase()}
                </Text>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>
    </Surface>
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
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
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
                  mode="outlined"
                />
              )}
              <TextInput
                label="Nama"
                value={newUser.name}
                onChangeText={text => setNewUser({ ...newUser, name: text })}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label={editingUser ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
                value={newUser.password}
                onChangeText={text => setNewUser({ ...newUser, password: text })}
                secureTextEntry
                style={styles.input}
                mode="outlined"
              />
              <SegmentedButtons
                value={newUser.role}
                onValueChange={value => {
                  setNewUser({
                    ...newUser,
                    role: value,
                    permissions: USER_PERMISSIONS[value],
                  });
                }}
                buttons={USER_ROLES}
                style={styles.roleButtons}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Batal</Button>
              <Button mode="contained" onPress={handleSaveUser}>
                Simpan
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={showResetPassword} onDismiss={() => setShowResetPassword(false)}>
            <Dialog.Title>Reset Password</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Password Baru"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={styles.input}
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowResetPassword(false)}>Batal</Button>
              <Button mode="contained" onPress={handleResetPassword}>
                Reset
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={showUserLogs} onDismiss={() => setShowUserLogs(false)}>
            <Dialog.Title>Aktivitas Pengguna</Dialog.Title>
            <Dialog.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Waktu</DataTable.Title>
                  <DataTable.Title>Aktivitas</DataTable.Title>
                </DataTable.Header>

                <DataTable.Row>
                  <DataTable.Cell>Coming soon...</DataTable.Cell>
                  <DataTable.Cell>Fitur log aktivitas akan segera hadir</DataTable.Cell>
                </DataTable.Row>
              </DataTable>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowUserLogs(false)}>Tutup</Button>
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
  userCard: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  divider: {
    marginVertical: 10,
  },
  permissionsContainer: {
    marginTop: 10,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permission: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  roleButtons: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 