import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('pos_umkm.db');

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Tabel Produk
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          stock INTEGER NOT NULL,
          category TEXT
        )`,
        [],
        () => {
          console.log('Products table created successfully');
        },
        (_, error) => {
          console.error('Error creating products table:', error);
          reject(error);
        }
      );

      // Tabel Transaksi
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          total REAL NOT NULL,
          payment_amount REAL NOT NULL,
          payment_method TEXT,
          customer_name TEXT
        )`,
        [],
        () => {
          console.log('Transactions table created successfully');
        },
        (_, error) => {
          console.error('Error creating transactions table:', error);
          reject(error);
        }
      );

      // Tabel Detail Transaksi
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transaction_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id INTEGER,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          price_per_item REAL NOT NULL,
          FOREIGN KEY (transaction_id) REFERENCES transactions (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )`,
        [],
        () => {
          console.log('Transaction items table created successfully');
          resolve();
        },
        (_, error) => {
          console.error('Error creating transaction items table:', error);
          reject(error);
        }
      );
    });
  });
};

// Fungsi-fungsi untuk produk
export const getProducts = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM products',
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const addProduct = (product) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)',
        [product.name, product.price, product.stock, product.category],
        (_, { insertId }) => resolve(insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateProduct = (product) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE products SET name = ?, price = ?, stock = ?, category = ? WHERE id = ?',
        [product.name, product.price, product.stock, product.category, product.id],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const deleteProduct = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM products WHERE id = ?',
        [id],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

// Fungsi-fungsi untuk transaksi
export const addTransaction = (transaction, items) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO transactions (date, total, payment_amount, payment_method, customer_name)
         VALUES (?, ?, ?, ?, ?)`,
        [
          transaction.date,
          transaction.total,
          transaction.payment_amount,
          transaction.payment_method,
          transaction.customer_name
        ],
        (_, { insertId }) => {
          const itemPromises = items.map(item => {
            return new Promise((resolve, reject) => {
              tx.executeSql(
                `INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item)
                 VALUES (?, ?, ?, ?)`,
                [insertId, item.product_id, item.quantity, item.price_per_item],
                () => resolve(),
                (_, error) => reject(error)
              );
            });
          });

          Promise.all(itemPromises)
            .then(() => resolve(insertId))
            .catch(error => reject(error));
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getTransactions = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT t.*, GROUP_CONCAT(p.name) as products
         FROM transactions t
         LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
         LEFT JOIN products p ON ti.product_id = p.id
         GROUP BY t.id
         ORDER BY t.date DESC`,
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getTransactionDetails = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT ti.*, p.name as product_name
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = ?`,
        [transactionId],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
}; 