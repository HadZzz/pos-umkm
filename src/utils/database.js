import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('pos_umkm.db');

export const resetDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Drop existing tables
      tx.executeSql('DROP TABLE IF EXISTS transaction_items');
      tx.executeSql('DROP TABLE IF EXISTS transactions');
      tx.executeSql('DROP TABLE IF EXISTS customer_transactions');
      tx.executeSql('DROP TABLE IF EXISTS customers');
      tx.executeSql('DROP TABLE IF EXISTS products');
      tx.executeSql('DROP TABLE IF EXISTS users');
    }, (error) => {
      console.error('Error dropping tables:', error);
      reject(error);
    }, () => {
      console.log('All tables dropped successfully');
      initDatabase()
        .then(resolve)
        .catch(reject);
    });
  });
};

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Tabel Users
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        [],
        () => {
          console.log('Users table created successfully');
          // Insert default admin user if not exists
          tx.executeSql(
            `INSERT OR IGNORE INTO users (username, password, name, role) 
             VALUES (?, ?, ?, ?)`,
            ['admin', 'admin123', 'Administrator', 'admin'],
            () => {
              console.log('Default admin user created');
              // Insert default kasir user if not exists
              tx.executeSql(
                `INSERT OR IGNORE INTO users (username, password, name, role) 
                 VALUES (?, ?, ?, ?)`,
                ['kasir', 'kasir123', 'Kasir', 'kasir'],
                () => console.log('Default kasir user created')
              );
            }
          );
        },
        (_, error) => {
          console.error('Error creating users table:', error);
          reject(error);
        }
      );

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
          customer_name TEXT,
          cashier_id INTEGER,
          cashier_name TEXT,
          FOREIGN KEY (cashier_id) REFERENCES users (id)
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
        },
        (_, error) => {
          console.error('Error creating transaction items table:', error);
          reject(error);
        }
      );

      // Tabel Customers
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT,
          member_code TEXT UNIQUE,
          points INTEGER DEFAULT 0,
          level TEXT DEFAULT 'regular',
          total_spent REAL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        [],
        () => {
          console.log('Customers table created successfully');
        },
        (_, error) => {
          console.error('Error creating customers table:', error);
          reject(error);
        }
      );

      // Tabel Customer Transactions
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS customer_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          transaction_id INTEGER,
          points_earned INTEGER DEFAULT 0,
          points_used INTEGER DEFAULT 0,
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (transaction_id) REFERENCES transactions (id)
        )`,
        [],
        () => {
          console.log('Customer transactions table created successfully');
          resolve();
        },
        (_, error) => {
          console.error('Error creating customer transactions table:', error);
          reject(error);
        }
      );
    });
  });
};

// User management functions
export const getUsers = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id, username, name, role, created_at FROM users',
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const addUser = (user) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        [user.username, user.password, user.name, user.role],
        (_, { insertId }) => resolve(insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateUser = (user) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      if (user.password) {
        tx.executeSql(
          'UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?',
          [user.name, user.role, user.password, user.id],
          () => resolve(),
          (_, error) => reject(error)
        );
      } else {
        tx.executeSql(
          'UPDATE users SET name = ?, role = ? WHERE id = ?',
          [user.name, user.role, user.id],
          () => resolve(),
          (_, error) => reject(error)
        );
      }
    });
  });
};

export const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM users WHERE id = ? AND username != ?',
        [id, 'admin'],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const authenticateUser = (username, password) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id, username, name, role FROM users WHERE username = ? AND password = ?',
        [username, password],
        (_, { rows: { _array } }) => {
          if (_array.length > 0) {
            resolve(_array[0]);
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
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
        `INSERT INTO transactions (date, total, payment_amount, payment_method, customer_name, cashier_id, cashier_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.date,
          transaction.total,
          transaction.payment_amount,
          transaction.payment_method,
          transaction.customer_name,
          transaction.cashier_id,
          transaction.cashier_name
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

// Customer management functions
export const getCustomers = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT c.*, 
         (SELECT COUNT(*) FROM customer_transactions ct WHERE ct.customer_id = c.id) as transaction_count,
         (SELECT SUM(t.total) FROM transactions t 
          JOIN customer_transactions ct ON t.id = ct.transaction_id 
          WHERE ct.customer_id = c.id) as total_spent
         FROM customers c
         ORDER BY c.created_at DESC`,
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getCustomerById = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM customers WHERE id = ?`,
        [id],
        (_, { rows: { _array } }) => resolve(_array[0]),
        (_, error) => reject(error)
      );
    });
  });
};

export const addCustomer = (customer) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO customers (name, phone, email, address, member_code) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.member_code || `MEM${Date.now()}`
        ],
        (_, { insertId }) => resolve(insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateCustomer = (customer) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE customers 
         SET name = ?, phone = ?, email = ?, address = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.id
        ],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const deleteCustomer = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM customers WHERE id = ?',
        [id],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateCustomerAfterTransaction = (customerId, transactionTotal, pointsEarned) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE customers 
         SET points = points + ?,
             total_spent = total_spent + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [pointsEarned, transactionTotal, customerId],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const useCustomerPoints = (customerId, pointsToUse) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE customers 
         SET points = points - ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND points >= ?`,
        [pointsToUse, customerId, pointsToUse],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getCustomerTransactions = (customerId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT t.*, ct.points_earned, ct.points_used
         FROM transactions t
         JOIN customer_transactions ct ON t.id = ct.transaction_id
         WHERE ct.customer_id = ?
         ORDER BY t.date DESC`,
        [customerId],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};