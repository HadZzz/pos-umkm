import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import {
  Surface,
  Text,
  Title,
  Card,
  ActivityIndicator,
  Button,
  DataTable,
  Chip,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { getTransactions, getProducts } from '../../utils/database';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
  style: {
    borderRadius: 16,
  },
};

export const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [topProducts, setTopProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  });
  const [timeRange, setTimeRange] = useState('daily'); // daily, weekly, monthly

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      const [transactions, products] = await Promise.all([
        getTransactions(),
        getProducts(),
      ]);

      // Process transactions data
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const recentTransactions = transactions.filter(
        t => new Date(t.date) >= thirtyDaysAgo
      );

      // Calculate summary
      const totalSales = recentTransactions.reduce((sum, t) => sum + t.total, 0);
      const totalTransactions = recentTransactions.length;

      setSummary({
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      });

      // Process sales data based on time range
      const processedData = processSalesData(recentTransactions, timeRange);
      setSalesData(processedData);

      // Calculate top products
      const productSales = new Map();
      recentTransactions.forEach(transaction => {
        transaction.items?.forEach(item => {
          const currentTotal = productSales.get(item.product_id) || 0;
          productSales.set(item.product_id, currentTotal + (item.quantity * item.price_per_item));
        });
      });

      const topProductsList = Array.from(productSales.entries())
        .map(([productId, total]) => ({
          product: products.find(p => p.id === productId) || { name: 'Unknown' },
          total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopProducts(topProductsList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSalesData = (transactions, range) => {
    const data = {
      daily: new Array(7).fill(0),
      weekly: new Array(4).fill(0),
      monthly: new Array(12).fill(0),
    };

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dayIndex = date.getDay();
      const weekIndex = Math.floor(date.getDate() / 7);
      const monthIndex = date.getMonth();

      data.daily[dayIndex] += transaction.total;
      data.weekly[weekIndex] += transaction.total;
      data.monthly[monthIndex] += transaction.total;
    });

    return data;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const chartData = {
    daily: {
      labels: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
      datasets: [{ data: salesData.daily }],
    },
    weekly: {
      labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
      datasets: [{ data: salesData.weekly }],
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
      datasets: [{ data: salesData.monthly }],
    },
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Dashboard</Title>
        <View style={styles.timeRangeButtons}>
          <Button
            mode={timeRange === 'daily' ? 'contained' : 'outlined'}
            onPress={() => setTimeRange('daily')}
            style={styles.timeButton}
          >
            Harian
          </Button>
          <Button
            mode={timeRange === 'weekly' ? 'contained' : 'outlined'}
            onPress={() => setTimeRange('weekly')}
            style={styles.timeButton}
          >
            Mingguan
          </Button>
          <Button
            mode={timeRange === 'monthly' ? 'contained' : 'outlined'}
            onPress={() => setTimeRange('monthly')}
            style={styles.timeButton}
          >
            Bulanan
          </Button>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Surface style={styles.summaryCard} elevation={2}>
          <Text style={styles.summaryLabel}>Total Penjualan</Text>
          <Text style={styles.summaryValue}>
            Rp {summary.totalSales.toLocaleString()}
          </Text>
        </Surface>

        <Surface style={styles.summaryCard} elevation={2}>
          <Text style={styles.summaryLabel}>Jumlah Transaksi</Text>
          <Text style={styles.summaryValue}>
            {summary.totalTransactions}
          </Text>
        </Surface>

        <Surface style={styles.summaryCard} elevation={2}>
          <Text style={styles.summaryLabel}>Rata-rata Transaksi</Text>
          <Text style={styles.summaryValue}>
            Rp {summary.averageTransaction.toLocaleString()}
          </Text>
        </Surface>
      </View>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>Grafik Penjualan</Title>
          <LineChart
            data={chartData[timeRange]}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.topProductsCard}>
        <Card.Content>
          <Title>Produk Terlaris</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Produk</DataTable.Title>
              <DataTable.Title numeric>Total Penjualan</DataTable.Title>
            </DataTable.Header>

            {topProducts.map((item, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{item.product.name}</DataTable.Cell>
                <DataTable.Cell numeric>
                  Rp {item.total.toLocaleString()}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

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
  header: {
    padding: 15,
  },
  title: {
    fontSize: 24,
    marginBottom: 15,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  chartCard: {
    margin: 15,
    borderRadius: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  topProductsCard: {
    margin: 15,
    borderRadius: 10,
  },
}); 