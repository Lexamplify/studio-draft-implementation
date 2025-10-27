import { storage } from './firebase-admin';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Initialize Firebase for client-side storage
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const clientStorage = getStorage(app);

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: Date;
}

export const uploadFile = async (
  file: File, 
  caseId: string, 
  userId: string
): Promise<UploadedFile> => {
  try {
    const fileId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const filePath = `cases/${caseId}/documents/${fileId}`;
    const storageRef = ref(clientStorage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: downloadURL,
      path: filePath,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const uploadChatFile = async (
  file: File, 
  chatId: string, 
  userId: string
): Promise<UploadedFile> => {
  try {
    const fileId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const filePath = `users/${userId}/chats/${chatId}/documents/${fileId}`;
    const storageRef = ref(clientStorage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: downloadURL,
      path: filePath,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Error uploading chat file:', error);
    throw new Error('Failed to upload file');
  }
};

export const uploadMultipleFiles = async (
  files: File[], 
  caseId: string, 
  userId: string
): Promise<UploadedFile[]> => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, caseId, userId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw new Error('Failed to upload files');
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(clientStorage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};
