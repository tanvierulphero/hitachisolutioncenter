import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, getDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Customer, Document, StaffUser, BusinessSettings } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data synchronization helper functions
export const saveProductToCloud = async (product: Product) => {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
};

export const deleteProductFromCloud = async (productId: string) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
};

export const saveCustomerToCloud = async (customer: Customer) => {
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `customers/${customer.id}`);
  }
};

export const deleteCustomerFromCloud = async (customerId: string) => {
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `customers/${customerId}`);
  }
};

export const saveDocumentToCloud = async (document: Document) => {
  try {
    await setDoc(doc(db, 'documents', document.id), document);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `documents/${document.id}`);
  }
};

export const deleteDocumentFromCloud = async (documentId: string) => {
  try {
    await deleteDoc(doc(db, 'documents', documentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${documentId}`);
  }
};

export const saveStaffUserToCloud = async (staff: StaffUser) => {
  try {
    await setDoc(doc(db, 'staffUsers', staff.id), staff);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `staffUsers/${staff.id}`);
  }
};

export const deleteStaffUserFromCloud = async (staffId: string) => {
  try {
    await deleteDoc(doc(db, 'staffUsers', staffId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staffUsers/${staffId}`);
  }
};

export const saveSettingsToCloud = async (settings: BusinessSettings) => {
  try {
    await setDoc(doc(db, 'settings', 'global_settings'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/global_settings');
  }
};
