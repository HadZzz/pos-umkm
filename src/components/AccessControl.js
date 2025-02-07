import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { getUserData } from '../utils/storage';

export default function AccessControl({ children, allowedRoles = ['admin'] }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const userData = await getUserData();
      setHasAccess(userData && allowedRoles.includes(userData.role));
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Maaf, Anda tidak memiliki akses ke halaman ini.</Text>
      </View>
    );
  }

  return children;
} 