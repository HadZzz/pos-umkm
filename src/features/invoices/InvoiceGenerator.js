import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const generateInvoiceHTML = (transaction, items, customer = null) => {
  const date = new Date(transaction.date).toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${transaction.id}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .store-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .invoice-details {
            margin-bottom: 20px;
          }
          .customer-details {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .total {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">POS UMKM</div>
          <div>Point of Sale</div>
        </div>

        <div class="invoice-details">
          <div>No. Invoice: #${transaction.id}</div>
          <div>Tanggal: ${date}</div>
          <div>Kasir: ${transaction.cashier_name || '-'}</div>
        </div>

        ${customer ? `
          <div class="customer-details">
            <div>Pelanggan: ${customer.name}</div>
            ${customer.member_code ? `<div>Kode Member: ${customer.member_code}</div>` : ''}
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Qty</th>
              <th>Harga</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>Rp ${item.price_per_item.toLocaleString()}</td>
                <td>Rp ${(item.quantity * item.price_per_item).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Total: Rp ${transaction.total.toLocaleString()}
        </div>

        ${customer && customer.points_earned ? `
          <div style="margin-top: 10px; text-align: right;">
            Poin yang didapat: +${customer.points_earned}
          </div>
        ` : ''}

        <div class="footer">
          <p>Terima kasih telah berbelanja di toko kami!</p>
          <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
        </div>
      </body>
    </html>
  `;
};

export default function InvoiceGenerator({ transaction, items, customer }) {
  const printToFile = async () => {
    try {
      const html = generateInvoiceHTML(transaction, items, customer);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf'
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Gagal membuat invoice');
    }
  };

  const printToPrinter = async () => {
    try {
      const html = generateInvoiceHTML(transaction, items, customer);
      await Print.printAsync({
        html
      });
    } catch (error) {
      console.error('Error printing invoice:', error);
      Alert.alert('Error', 'Gagal mencetak invoice');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="file-pdf-box"
        onPress={printToFile}
        style={styles.button}
      >
        Simpan PDF
      </Button>
      <Button
        mode="contained"
        icon="printer"
        onPress={printToPrinter}
        style={styles.button}
      >
        Cetak
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
}); 