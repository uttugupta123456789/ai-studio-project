import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Customer, Product, Enquiry, Communication, DashboardStats, SyncedEmail } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from './seedData';

const CUSTOMERS_COL = 'customers';
const PRODUCTS_COL = 'products';
const ENQUIRIES_COL = 'enquiries';
const COMMUNICATIONS_COL = 'communications';
const SYNCED_EMAILS_COL = 'synced_emails';

// --- CUSTOMERS ---
export async function getCustomers(): Promise<Customer[]> {
  try {
    const snap = await getDocs(collection(db, CUSTOMERS_COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, CUSTOMERS_COL);
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const snap = await getDoc(doc(db, CUSTOMERS_COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Customer;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${CUSTOMERS_COL}/${id}`);
    return null;
  }
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  const newId = `CUST-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const customer: Customer = {
    id: newId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await setDoc(doc(db, CUSTOMERS_COL, newId), customer);
    return customer;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${CUSTOMERS_COL}/${newId}`);
    throw err;
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COL, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${CUSTOMERS_COL}/${id}`);
    throw err;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CUSTOMERS_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${CUSTOMERS_COL}/${id}`);
    throw err;
  }
}

// --- PRODUCTS ---
export async function getProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, PRODUCTS_COL);
    return [];
  }
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newId = `PROD-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const product: Product = {
    id: newId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await setDoc(doc(db, PRODUCTS_COL, newId), product);
    return product;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${PRODUCTS_COL}/${newId}`);
    throw err;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COL, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${PRODUCTS_COL}/${id}`);
    throw err;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COL}/${id}`);
    throw err;
  }
}

// --- ENQUIRIES ---
export async function getEnquiries(): Promise<Enquiry[]> {
  try {
    const snap = await getDocs(collection(db, ENQUIRIES_COL));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry));
    return items.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ENQUIRIES_COL);
    return [];
  }
}

export async function createEnquiry(data: Omit<Enquiry, 'id'>): Promise<Enquiry> {
  const newId = `ENQ-${Date.now().toString(36).toUpperCase()}`;
  const enquiry: Enquiry = {
    id: newId,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, ENQUIRIES_COL, newId), enquiry);
    return enquiry;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${ENQUIRIES_COL}/${newId}`);
    throw err;
  }
}

export async function updateEnquiry(id: string, updates: Partial<Enquiry>): Promise<void> {
  try {
    const docRef = doc(db, ENQUIRIES_COL, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ENQUIRIES_COL}/${id}`);
    throw err;
  }
}

export async function deleteEnquiry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ENQUIRIES_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${ENQUIRIES_COL}/${id}`);
    throw err;
  }
}

// --- COMMUNICATIONS ---
export async function getCommunications(): Promise<Communication[]> {
  try {
    const snap = await getDocs(collection(db, COMMUNICATIONS_COL));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Communication));
    return items.sort((a, b) => new Date(b.sentOrReceivedAt).getTime() - new Date(a.sentOrReceivedAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COMMUNICATIONS_COL);
    return [];
  }
}

export async function createCommunication(data: Omit<Communication, 'id' | 'createdAt'>): Promise<Communication> {
  const newId = `COMM-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const comm: Communication = {
    id: newId,
    ...data,
    createdAt: now,
  };
  try {
    await setDoc(doc(db, COMMUNICATIONS_COL, newId), comm);
    return comm;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COMMUNICATIONS_COL}/${newId}`);
    throw err;
  }
}

export async function updateCommunication(id: string, updates: Partial<Communication>): Promise<void> {
  try {
    const docRef = doc(db, COMMUNICATIONS_COL, id);
    await updateDoc(docRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COMMUNICATIONS_COL}/${id}`);
    throw err;
  }
}

// --- SYNCED EMAILS ---
export async function getSyncedEmails(): Promise<SyncedEmail[]> {
  try {
    const snap = await getDocs(collection(db, SYNCED_EMAILS_COL));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SyncedEmail));
    return items.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, SYNCED_EMAILS_COL);
    return [];
  }
}

export async function getSyncedEmailById(id: string): Promise<SyncedEmail | null> {
  try {
    const snap = await getDoc(doc(db, SYNCED_EMAILS_COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SyncedEmail;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SYNCED_EMAILS_COL}/${id}`);
    return null;
  }
}

export async function createSyncedEmail(data: Omit<SyncedEmail, 'id' | 'syncedAt'> & { id?: string }): Promise<SyncedEmail> {
  const newId = data.id || `EMAIL-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const emailItem: SyncedEmail = {
    ...data,
    id: newId,
    syncedAt: now,
  };
  try {
    await setDoc(doc(db, SYNCED_EMAILS_COL, newId), emailItem);
    return emailItem;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${SYNCED_EMAILS_COL}/${newId}`);
    throw err;
  }
}

export async function updateSyncedEmail(id: string, updates: Partial<SyncedEmail>): Promise<void> {
  try {
    const docRef = doc(db, SYNCED_EMAILS_COL, id);
    await updateDoc(docRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${SYNCED_EMAILS_COL}/${id}`);
    throw err;
  }
}

export async function deleteSyncedEmail(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SYNCED_EMAILS_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${SYNCED_EMAILS_COL}/${id}`);
    throw err;
  }
}

// --- STATS CALCULATION ---
export function calculateStats(
  customers: Customer[],
  products: Product[],
  enquiries: Enquiry[]
): DashboardStats {
  const totalCustomers = customers.length;
  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.availability === 'Available').length;
  const totalEnquiries = enquiries.length;
  const pendingEnquiries = enquiries.filter(e => e.status === 'Pending').length;
  const inProgressEnquiries = enquiries.filter(e => e.status === 'In Progress').length;
  const respondedEnquiries = enquiries.filter(e => e.status === 'Responded').length;
  const closedEnquiries = enquiries.filter(e => e.status === 'Closed').length;
  const awaitingResponseCount = enquiries.filter(e => e.status === 'Pending' || e.status === 'In Progress').length;

  return {
    totalCustomers,
    totalProducts,
    availableProducts,
    totalEnquiries,
    pendingEnquiries,
    inProgressEnquiries,
    respondedEnquiries,
    closedEnquiries,
    awaitingResponseCount,
  };
}

// --- SEED DATABASE IF EMPTY ---
export async function seedInitialDataIfEmpty(): Promise<{ seeded: boolean; counts: any }> {
  try {
    const productsSnap = await getDocs(collection(db, PRODUCTS_COL));
    if (!productsSnap.empty) {
      return { seeded: false, counts: { products: productsSnap.size } };
    }

    console.log('Seeding initial electronics database...');
    const now = new Date();

    // 1. Seed Products
    const createdProducts: Product[] = [];
    for (let i = 0; i < INITIAL_PRODUCTS.length; i++) {
      const p = INITIAL_PRODUCTS[i];
      const prodId = `PROD-${100 + i}`;
      const product: Product = {
        id: prodId,
        ...p,
        createdAt: new Date(now.getTime() - (15 - i) * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - (15 - i) * 86400000).toISOString(),
      };
      await setDoc(doc(db, PRODUCTS_COL, prodId), product);
      createdProducts.push(product);
    }

    // 2. Seed Customers
    const createdCustomers: Customer[] = [];
    for (let i = 0; i < INITIAL_CUSTOMERS.length; i++) {
      const c = INITIAL_CUSTOMERS[i];
      const custId = `CUST-${200 + i}`;
      const customer: Customer = {
        id: custId,
        ...c,
        createdAt: new Date(now.getTime() - (10 - i) * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - (10 - i) * 86400000).toISOString(),
      };
      await setDoc(doc(db, CUSTOMERS_COL, custId), customer);
      createdCustomers.push(customer);
    }

    // 3. Seed Realistic Enquiries
    const sampleEnquiries: Omit<Enquiry, 'id'>[] = [
      {
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        enquiryText: 'Hi, I am looking for a reliable coding laptop with 16GB RAM. Can the Asus Vivobook 15 handle Docker and IDEs? What is your best price including warranty?',
        productId: createdProducts[1].id,
        productName: createdProducts[1].name,
        source: 'Gmail',
        status: 'Pending',
        urgency: 'High',
        urgencyScore: 82,
        urgencyReason: 'Active software engineer prospect with ready purchasing intent, asking for final price and warranty terms.',
        receivedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        gmailMessageId: 'gm_init_101',
      },
      {
        customerId: createdCustomers[1].id,
        customerName: createdCustomers[1].name,
        customerEmail: createdCustomers[1].email,
        enquiryText: 'Hello! Does the Dell UltraSharp 27 4K monitor provide 90W power delivery over USB-C for charging an M3 MacBook Air while outputting display?',
        productId: createdProducts[10].id,
        productName: createdProducts[10].name,
        source: 'Manual',
        status: 'In Progress',
        assignedStaff: 'Vikram (Manager)',
        urgency: 'Medium',
        urgencyScore: 60,
        urgencyReason: 'Compatibility query for MacBook Air charging over USB-C.',
        receivedAt: new Date(now.getTime() - 26 * 3600000).toISOString(),
      },
      {
        customerId: createdCustomers[2].id,
        customerName: createdCustomers[2].name,
        customerEmail: createdCustomers[2].email,
        enquiryText: 'Wanted to check if the OnePlus 12R is in stock right now and if you have the Cool Blue 256GB variant available for same-day store pickup?',
        productId: createdProducts[5].id,
        productName: createdProducts[5].name,
        source: 'Gmail',
        status: 'Responded',
        urgency: 'High',
        urgencyScore: 78,
        urgencyReason: 'Same-day store pickup inquiry for smartphone stock availability.',
        receivedAt: new Date(now.getTime() - 52 * 3600000).toISOString(),
        gmailMessageId: 'gm_init_102',
      },
      {
        customerId: createdCustomers[3].id,
        customerName: createdCustomers[3].name,
        customerEmail: createdCustomers[3].email,
        enquiryText: 'We need 5 units of the Keychron Q1 Pro keyboards and 5 Sony WH-1000XM5 headphones for our engineering leads. Can we get GST invoice and volume quotation before 4 PM today?',
        productId: createdProducts[8].id,
        productName: createdProducts[8].name,
        source: 'Gmail',
        status: 'Pending',
        urgency: 'Critical',
        urgencyScore: 94,
        urgencyReason: 'High-value corporate bulk deal with imminent 4 PM deadline today for GST invoice approval.',
        receivedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
        gmailMessageId: 'gm_init_103',
      },
      {
        customerId: createdCustomers[4].id,
        customerName: createdCustomers[4].name,
        customerEmail: createdCustomers[4].email,
        enquiryText: 'Is the Samsung Galaxy S24 Ultra available in Titanium Black or Gray? Need it before this weekend.',
        productId: createdProducts[6].id,
        productName: createdProducts[6].name,
        source: 'Manual',
        status: 'Closed',
        urgency: 'Low',
        urgencyScore: 35,
        urgencyReason: 'Weekend availability check, inquiry successfully closed.',
        receivedAt: new Date(now.getTime() - 96 * 3600000).toISOString(),
      }
    ];

    const createdEnquiries: Enquiry[] = [];
    for (let i = 0; i < sampleEnquiries.length; i++) {
      const enqId = `ENQ-${300 + i}`;
      const enq: Enquiry = {
        id: enqId,
        ...sampleEnquiries[i],
        updatedAt: sampleEnquiries[i].receivedAt,
      };
      await setDoc(doc(db, ENQUIRIES_COL, enqId), enq);
      createdEnquiries.push(enq);
    }

    // 4. Seed Communications
    const sampleCommunications: Omit<Communication, 'id' | 'createdAt'>[] = [
      {
        customerId: createdCustomers[0].id,
        enquiryId: createdEnquiries[0].id,
        channel: 'Gmail',
        direction: 'Incoming',
        subject: 'Inquiry: Laptop for programming (Asus Vivobook 15)',
        messageBody: 'Hi, I am looking for a reliable coding laptop with 16GB RAM. Can the Asus Vivobook 15 handle Docker and IDEs? What is your best price including warranty?',
        status: 'Received',
        gmailMessageId: 'gm_init_101',
        sentOrReceivedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      },
      {
        customerId: createdCustomers[2].id,
        enquiryId: createdEnquiries[2].id,
        channel: 'Gmail',
        direction: 'Incoming',
        subject: 'OnePlus 12R Stock check',
        messageBody: 'Wanted to check if the OnePlus 12R is in stock right now and if you have the Cool Blue 256GB variant available for same-day store pickup?',
        status: 'Received',
        gmailMessageId: 'gm_init_102',
        sentOrReceivedAt: new Date(now.getTime() - 52 * 3600000).toISOString(),
      },
      {
        customerId: createdCustomers[2].id,
        enquiryId: createdEnquiries[2].id,
        channel: 'Gmail',
        direction: 'Outgoing',
        subject: 'Re: OnePlus 12R Stock check - ElectroSales Store',
        messageBody: 'Dear Amit,\n\nYes, the OnePlus 12R (16GB RAM, 256GB Storage, Cool Blue) is currently in stock at ₹39,999. We have 15 units available and can arrange for immediate store pickup today.\n\nAll purchases come with a 1-Year Official OnePlus India Warranty and complimentary screen guard application in-store.\n\nLooking forward to seeing you!\n\nBest regards,\nElectroSales Team',
        status: 'Sent',
        gmailMessageId: 'gm_init_sent_102',
        sentOrReceivedAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      },
      {
        customerId: createdCustomers[3].id,
        enquiryId: createdEnquiries[3].id,
        channel: 'Gmail',
        direction: 'Incoming',
        subject: 'Corporate Order: Keychron & Sony XM5 Headsets',
        messageBody: 'We need 5 units of the Keychron Q1 Pro keyboards and 5 Sony WH-1000XM5 headphones for our engineering leads. Can we get GST invoice and volume quotation?',
        status: 'Received',
        gmailMessageId: 'gm_init_103',
        sentOrReceivedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      }
    ];

    for (let i = 0; i < sampleCommunications.length; i++) {
      const commId = `COMM-${400 + i}`;
      const comm: Communication = {
        id: commId,
        ...sampleCommunications[i],
        createdAt: sampleCommunications[i].sentOrReceivedAt,
      };
      await setDoc(doc(db, COMMUNICATIONS_COL, commId), comm);
    }

    // 5. Seed Synced Emails
    await seedSyncedEmailsIfEmpty(createdCustomers, createdProducts, createdEnquiries);

    return {
      seeded: true,
      counts: {
        products: createdProducts.length,
        customers: createdCustomers.length,
        enquiries: createdEnquiries.length,
      }
    };
  } catch (err) {
    console.error('Failed to seed initial data:', err);
    return { seeded: false, counts: null };
  }
}

export async function seedSyncedEmailsIfEmpty(
  customersList?: Customer[],
  productsList?: Product[],
  enquiriesList?: Enquiry[]
): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, SYNCED_EMAILS_COL));
    if (!snap.empty) {
      return false;
    }

    const now = new Date();
    const custs = customersList && customersList.length ? customersList : await getCustomers();
    const prods = productsList && productsList.length ? productsList : await getProducts();
    const enqs = enquiriesList && enquiriesList.length ? enquiriesList : await getEnquiries();

    const sampleSyncedEmails: Omit<SyncedEmail, 'id' | 'syncedAt'>[] = [
      {
        gmailMessageId: 'gm_init_103',
        threadId: 'th_103',
        senderName: custs[3]?.name || 'Pooja Hegde',
        senderEmail: custs[3]?.email || 'pooja.h@fintechcorp.in',
        subject: 'Corporate Order: Keychron & Sony XM5 Headsets',
        bodyText: 'We need 5 units of the Keychron Q1 Pro keyboards and 5 Sony WH-1000XM5 headphones for our engineering leads. Can we get GST invoice and volume quotation before 4 PM today? Immediate procurement approval pending.',
        snippet: 'We need 5 units of Keychron Q1 Pro and 5 Sony WH-1000XM5 headphones for engineering leads...',
        urgency: 'Critical',
        urgencyScore: 94,
        urgencyReason: 'High-value corporate bulk deal with imminent 4 PM deadline today for GST invoice approval.',
        recommendedAction: 'Send formal GST quotation with corporate discount immediately and call representative.',
        aiCategory: 'Bulk / Corporate Order',
        isSalesEnquiry: true,
        matchedProductId: prods[8]?.id || 'PROD-108',
        matchedProductName: prods[8]?.name || 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
        customerId: custs[3]?.id || 'CUST-203',
        enquiryId: enqs.find(e => e.gmailMessageId === 'gm_init_103')?.id,
        receivedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
        status: 'New',
      },
      {
        gmailMessageId: 'gm_init_101',
        threadId: 'th_101',
        senderName: custs[0]?.name || 'Rahul Sharma',
        senderEmail: custs[0]?.email || 'rahul.sharma88@gmail.com',
        subject: 'Inquiry: Laptop for programming (Asus Vivobook 15)',
        bodyText: 'Hi, I am looking for a reliable coding laptop with 16GB RAM. Can the Asus Vivobook 15 handle Docker and IDEs? What is your best price including warranty?',
        snippet: 'Looking for a reliable coding laptop with 16GB RAM. Can Asus Vivobook handle Docker...',
        urgency: 'High',
        urgencyScore: 82,
        urgencyReason: 'Active developer with ready purchasing intent, inquiring about pricing discount and warranty.',
        recommendedAction: 'Provide product specs confirmation and offer bundle pricing with laptop bag.',
        aiCategory: 'Price / Discount Quote',
        isSalesEnquiry: true,
        matchedProductId: prods[1]?.id || 'PROD-101',
        matchedProductName: prods[1]?.name || 'Asus Vivobook 15 OLED (16GB RAM, 512GB SSD)',
        customerId: custs[0]?.id || 'CUST-200',
        enquiryId: enqs.find(e => e.gmailMessageId === 'gm_init_101')?.id,
        receivedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        status: 'New',
      },
      {
        gmailMessageId: 'gm_init_102',
        threadId: 'th_102',
        senderName: custs[2]?.name || 'Amit Patel',
        senderEmail: custs[2]?.email || 'amit.patel@techsolutions.com',
        subject: 'OnePlus 12R Stock check',
        bodyText: 'Wanted to check if the OnePlus 12R is in stock right now and if you have the Cool Blue 256GB variant available for same-day store pickup?',
        snippet: 'Wanted to check if OnePlus 12R is in stock right now and available for store pickup...',
        urgency: 'High',
        urgencyScore: 78,
        urgencyReason: 'Same-day store pickup query for high-demand smartphone model in specific colorway.',
        recommendedAction: 'Confirm stock reservation for same-day store pickup.',
        aiCategory: 'Stock Availability',
        isSalesEnquiry: true,
        matchedProductId: prods[5]?.id || 'PROD-105',
        matchedProductName: prods[5]?.name || 'OnePlus 12R 5G (Cool Blue, 16GB RAM, 256GB Storage)',
        customerId: custs[2]?.id || 'CUST-202',
        enquiryId: enqs.find(e => e.gmailMessageId === 'gm_init_102')?.id,
        receivedAt: new Date(now.getTime() - 52 * 3600000).toISOString(),
        status: 'Replied',
      },
      {
        gmailMessageId: 'gm_init_104',
        threadId: 'th_104',
        senderName: 'Rohit Verma',
        senderEmail: 'rohit.verma@outlook.com',
        subject: 'Query regarding monitor refresh rate compatibility',
        bodyText: 'Hello, does the Dell UltraSharp monitor support 120Hz refresh rate over HDMI 2.1 or only 60Hz? Also do you provide wall mounting bracket in the box?',
        snippet: 'Does the Dell UltraSharp monitor support 120Hz refresh rate over HDMI 2.1...',
        urgency: 'Medium',
        urgencyScore: 58,
        urgencyReason: 'Technical specification and packaging query. Customer evaluating monitor specifications before decision.',
        recommendedAction: 'Send monitor specification sheet detailing 60Hz IPS panel and VESA mount dimensions.',
        aiCategory: 'Product Technical Spec',
        isSalesEnquiry: true,
        matchedProductId: prods[10]?.id || 'PROD-110',
        matchedProductName: prods[10]?.name || 'Dell UltraSharp 27 4K USB-C Hub Monitor',
        receivedAt: new Date(now.getTime() - 14 * 3600000).toISOString(),
        status: 'New',
      },
      {
        gmailMessageId: 'gm_init_105',
        threadId: 'th_105',
        senderName: 'Meera Nambiar',
        senderEmail: 'meera.nambiar@gmail.com',
        subject: 'Store timings during festival weekend & festive catalog',
        bodyText: 'Hi team, could you please share your store operating hours for the upcoming long weekend? Also do you have any festive catalog brochure for Diwali electronics deals?',
        snippet: 'Could you please share your store operating hours for the upcoming long weekend...',
        urgency: 'Low',
        urgencyScore: 32,
        urgencyReason: 'General inquiry regarding store timings and seasonal catalog; no immediate purchase or complaint.',
        recommendedAction: 'Send store hours schedule and link to upcoming seasonal promotion catalog.',
        aiCategory: 'General Inquiry',
        isSalesEnquiry: false,
        receivedAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
        status: 'New',
      }
    ];

    for (let i = 0; i < sampleSyncedEmails.length; i++) {
      const emailId = `EMAIL-SEED-${101 + i}`;
      await setDoc(doc(db, SYNCED_EMAILS_COL, emailId), {
        ...sampleSyncedEmails[i],
        id: emailId,
        syncedAt: new Date().toISOString(),
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to seed synced emails:', err);
    return false;
  }
}
