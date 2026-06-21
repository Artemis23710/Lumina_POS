import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc, 
  where, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockProducts } from '../data/mockData';
import { toast } from 'sonner';
import type { Customer } from '../pages/Customers';
import type { StoreConfig, DrawerSession } from '../pages/Settings';

// Global flag to track if we should bypass Firestore due to permission error
let useLocalFallback = localStorage.getItem('lumina_use_local_db') === 'true';

const setFallbackMode = (fallback: boolean) => {
  useLocalFallback = fallback;
  localStorage.setItem('lumina_use_local_db', fallback ? 'true' : 'false');
  if (fallback) {
    toast.warning('Database Fallback Active', {
      description: 'Switched to local database mode due to Firebase permissions. Changes will save in your browser.',
      duration: 6000
    });
  }
};

// Check if error is related to Firebase permissions
const isPermissionError = (error: any): boolean => {
  const errMsg = String(error).toLowerCase();
  return (
    error?.code === 'permission-denied' ||
    errMsg.includes('permission') ||
    errMsg.includes('insufficient permissions') ||
    errMsg.includes('missing permissions')
  );
};

// ----------------------------------------------------
// LOCAL STORAGE KEYS & INITIALIZERS
// ----------------------------------------------------
const KEY_PRODUCTS = 'lumina_local_products';
const KEY_CUSTOMERS = 'lumina_local_customers';
const KEY_ORDERS = 'lumina_local_orders';
const KEY_SESSIONS = 'lumina_local_sessions';
const KEY_CONFIG = 'lumina_local_store_config';

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize Local Products if empty
if (!localStorage.getItem(KEY_PRODUCTS)) {
  setLocalStorage(KEY_PRODUCTS, mockProducts);
}

// Initialize Local Customers if empty
if (!localStorage.getItem(KEY_CUSTOMERS)) {
  const defaultCustomers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Sarah Connor',
      phone: '555-0100',
      email: 'sarah@cyberdyne.com',
      loyaltyPoints: 120,
      totalSpent: 450.50,
      ordersCount: 15
    },
    {
      id: 'cust-2',
      name: 'John Connor',
      phone: '555-0199',
      email: 'john.c@resistance.net',
      loyaltyPoints: 85,
      totalSpent: 280.00,
      ordersCount: 8
    }
  ];
  setLocalStorage(KEY_CUSTOMERS, defaultCustomers);
}

// ----------------------------------------------------
// DB SERVICE PORTAL
// ----------------------------------------------------
export const dbService = {
  // PRODUCTS CRUD
  getProducts: async (): Promise<any[]> => {
    if (!useLocalFallback) {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }
    return getLocalStorage<any[]>(KEY_PRODUCTS, mockProducts);
  },

  saveProduct: async (productData: any, editingId: string | null): Promise<void> => {
    if (!useLocalFallback) {
      try {
        if (editingId) {
          const productRef = doc(db, 'products', editingId);
          await updateDoc(productRef, {
            ...productData,
            updatedAt: Timestamp.now()
          });
        } else {
          await addDoc(collection(db, 'products'), {
            ...productData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }
        return;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }
    
    // Local fallback logic
    const localProds = getLocalStorage<any[]>(KEY_PRODUCTS, mockProducts);
    if (editingId) {
      const updated = localProds.map(p => p.id === editingId ? { ...p, ...productData } : p);
      setLocalStorage(KEY_PRODUCTS, updated);
    } else {
      const newProd = {
        id: `prod-${Date.now()}`,
        ...productData
      };
      setLocalStorage(KEY_PRODUCTS, [newProd, ...localProds]);
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    if (!useLocalFallback) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        return;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const localProds = getLocalStorage<any[]>(KEY_PRODUCTS, mockProducts);
    const filtered = localProds.filter(p => p.id !== productId);
    setLocalStorage(KEY_PRODUCTS, filtered);
  },

  // CUSTOMERS CRM CRUD
  getCustomers: async (): Promise<Customer[]> => {
    if (!useLocalFallback) {
      try {
        const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const list: Customer[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            loyaltyPoints: data.loyaltyPoints || 0,
            totalSpent: data.totalSpent || 0,
            ordersCount: data.ordersCount || 0
          });
        });
        return list;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }
    return getLocalStorage<Customer[]>(KEY_CUSTOMERS, []);
  },

  saveCustomer: async (customerData: any, editingId: string | null): Promise<void> => {
    if (!useLocalFallback) {
      try {
        if (editingId) {
          const customerRef = doc(db, 'customers', editingId);
          await updateDoc(customerRef, customerData);
        } else {
          await addDoc(collection(db, 'customers'), {
            ...customerData,
            totalSpent: 0,
            ordersCount: 0,
            createdAt: Timestamp.now()
          });
        }
        return;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const localCusts = getLocalStorage<Customer[]>(KEY_CUSTOMERS, []);
    if (editingId) {
      const updated = localCusts.map(c => c.id === editingId ? { ...c, ...customerData } : c);
      setLocalStorage(KEY_CUSTOMERS, updated);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        loyaltyPoints: customerData.loyaltyPoints || 0,
        totalSpent: 0,
        ordersCount: 0
      };
      setLocalStorage(KEY_CUSTOMERS, [...localCusts, newCust]);
    }
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    if (!useLocalFallback) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
        return;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const localCusts = getLocalStorage<Customer[]>(KEY_CUSTOMERS, []);
    const filtered = localCusts.filter(c => c.id !== customerId);
    setLocalStorage(KEY_CUSTOMERS, filtered);
  },

  // STORE CONFIG
  getStoreConfig: async (): Promise<StoreConfig> => {
    const defaultConfig: StoreConfig = {
      storeName: 'Lumina POS Store',
      taxRate: 8,
      currency: '$',
      address: '123 Business Rd, Suite 100',
      phone: '(555) 123-4567',
      receiptFooter: 'Thank you for shopping with us!'
    };

    if (!useLocalFallback) {
      try {
        const configDocRef = doc(db, 'settings', 'store_config');
        const configSnap = await getDoc(configDocRef);
        if (configSnap.exists()) {
          return configSnap.data() as StoreConfig;
        } else {
          await setDoc(configDocRef, defaultConfig);
          return defaultConfig;
        }
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          return defaultConfig;
        }
      }
    }
    return getLocalStorage<StoreConfig>(KEY_CONFIG, defaultConfig);
  },

  saveStoreConfig: async (config: StoreConfig): Promise<void> => {
    if (!useLocalFallback) {
      try {
        const configDocRef = doc(db, 'settings', 'store_config');
        await setDoc(configDocRef, config);
        return;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }
    setLocalStorage(KEY_CONFIG, config);
  },

  // DRAWER SESSIONS
  getActiveDrawerSession: async (): Promise<DrawerSession | null> => {
    if (!useLocalFallback) {
      try {
        const sessionsRef = collection(db, 'cashSessions');
        const q = query(sessionsRef, where('status', '==', 'open'), limit(1));
        const sessionSnap = await getDocs(q);
        if (!sessionSnap.empty) {
          const docId = sessionSnap.docs[0].id;
          const data = sessionSnap.docs[0].data();
          return { id: docId, ...data } as DrawerSession;
        }
        return null;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const sessions = getLocalStorage<DrawerSession[]>(KEY_SESSIONS, []);
    const active = sessions.find(s => s.status === 'open');
    return active || null;
  },

  getClosedDrawerSessions: async (): Promise<DrawerSession[]> => {
    if (!useLocalFallback) {
      try {
        const sessionsRef = collection(db, 'cashSessions');
        const q = query(sessionsRef, where('status', '==', 'closed'), orderBy('closedAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const list: DrawerSession[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as DrawerSession);
        });
        return list;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const sessions = getLocalStorage<DrawerSession[]>(KEY_SESSIONS, []);
    return sessions.filter(s => s.status === 'closed').sort((a, b) => 
      new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime()
    ).slice(0, 10);
  },

  openDrawerSession: async (session: DrawerSession): Promise<DrawerSession> => {
    if (!useLocalFallback) {
      try {
        const docRef = await addDoc(collection(db, 'cashSessions'), session);
        return { id: docRef.id, ...session };
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const sessions = getLocalStorage<DrawerSession[]>(KEY_SESSIONS, []);
    const newSession: DrawerSession = {
      id: `sess-${Date.now()}`,
      ...session
    };
    setLocalStorage(KEY_SESSIONS, [...sessions, newSession]);
    return newSession;
  },

  updateDrawerSession: async (sessionId: string, sessionData: Partial<DrawerSession>): Promise<void> => {
    if (!useLocalFallback) {
      try {
        const docRef = doc(db, 'cashSessions', sessionId);
        await updateDoc(docRef, sessionData);
        return;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const sessions = getLocalStorage<DrawerSession[]>(KEY_SESSIONS, []);
    const updated = sessions.map(s => s.id === sessionId ? { ...s, ...sessionData } : s);
    setLocalStorage(KEY_SESSIONS, updated);
  },

  // ORDERS / TRANSACTIONS
  getOrders: async (): Promise<any[]> => {
    if (!useLocalFallback) {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }
    return getLocalStorage<any[]>(KEY_ORDERS, []);
  },

  saveOrder: async (orderData: any): Promise<string> => {
    if (!useLocalFallback) {
      try {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      } catch (err) {
        if (isPermissionError(err)) {
          setFallbackMode(true);
        } else {
          console.error(err);
          throw err;
        }
      }
    }

    const localOrders = getLocalStorage<any[]>(KEY_ORDERS, []);
    const orderId = `ord-${Date.now()}`;
    const newOrder = {
      id: orderId,
      ...orderData,
      createdAt: new Date().toISOString()
    };
    setLocalStorage(KEY_ORDERS, [newOrder, ...localOrders]);
    return orderId;
  },

  // Reset database options for testing switch back
  resetToFirebase: () => {
    localStorage.removeItem('lumina_use_local_db');
    useLocalFallback = false;
    toast.success('Firebase Synchronizer Active', {
      description: 'App will attempt Firestore sync. Refresh the page to take effect.'
    });
  }
};
