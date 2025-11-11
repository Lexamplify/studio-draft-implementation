import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from './firebaseClient';

export interface FirebaseTemplate {
  id: string;
  name: string;
  description: string;
  content?: string;
  initialContent?: string;
  imageUrl?: string;
  label?: string;
}

/**
 * Fetches a template document from Firebase Firestore
 * @param templateId - The ID of the template document
 * @returns Promise<FirebaseTemplate | null>
 */
export const fetchTemplateFromFirebase = async (templateId: string): Promise<FirebaseTemplate | null> => {
    try {
        const templatesCollection = collection(db, 'docTemplates');
        console.log("🔍 Templates Collection:", templateId);
        const templateRef = doc(templatesCollection, templateId);
        
        console.log("🔍 Collection Reference:", templatesCollection);
        console.log("🔍 Template Reference:", templateRef);
        
        const templateSnap = await getDoc(templateRef);
        console.log("🔍 Template Snapshot:", templateSnap);
        
        if (templateSnap.exists()) {
          const data = templateSnap.data();
          console.log("🔍 Template Data:", data);
          return {
            id: templateSnap.id,
            name: data.name || '',
            description: data.description || '',
            content: data.content,
            initialContent: data.initialContent,
            imageUrl: data.imageUrl,
            label: data.label,
          };
        } else {
          console.warn(`Template with ID ${templateId} not found in Firebase`);
          return null;
        }
      } catch (error) {
        console.error('Error fetching template from Firebase:', error);
        
        // If it's a permission error, try the API route fallback
        if (error instanceof Error && error.message.includes('permissions')) {
          console.warn('Firebase permission denied. Trying API route fallback...');
          return await fetchTemplateFromAPI(templateId);
        }
        
        throw new Error(`Failed to fetch template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
};

/**
 * Fallback method to fetch template via API route (server-side)
 */
const fetchTemplateFromAPI = async (templateId: string): Promise<FirebaseTemplate | null> => {
  try {
    const response = await fetch('/api/fetch-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.template || null;
  } catch (error) {
    console.error('Error fetching template from API:', error);
    return null;
  }
};

/**
 * Alternative approach using collection reference (v9 modular SDK)
 * @param templateId - The ID of the template document
 * @returns Promise<FirebaseTemplate | null>
 */
export const fetchTemplateFromFirebaseCollection = async (templateId: string): Promise<FirebaseTemplate | null> => {
  try {
    const templatesCollection = collection(db, 'docTemplates');
    const templateRef = doc(templatesCollection, templateId);
    
    console.log("🔍 Collection Reference:", templatesCollection);
    console.log("🔍 Template Reference:", templateRef);
    
    const templateSnap = await getDoc(templateRef);
    console.log("🔍 Template Snapshot:", templateSnap);
    
    if (templateSnap.exists()) {
      const data = templateSnap.data();
      console.log("🔍 Template Data:", data);
      return {
        id: templateSnap.id,
        name: data.name || '',
        description: data.description || '',
        content: data.content,
        initialContent: data.initialContent,
        imageUrl: data.imageUrl,
        label: data.label,
      };
    } else {
      console.warn(`Template with ID ${templateId} not found in Firebase`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching template from Firebase:', error);
    
    // If it's a permission error, return null instead of throwing
    if (error instanceof Error && error.message.includes('permissions')) {
      console.warn('Firebase permission denied. Please check Firestore security rules.');
      return null;
    }
    
    throw new Error(`Failed to fetch template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetches multiple templates from Firebase Firestore
 * @param templateIds - Array of template IDs
 * @returns Promise<FirebaseTemplate[]>
 */
export const fetchTemplatesFromFirebase = async (templateIds: string[]): Promise<FirebaseTemplate[]> => {
  try {
    const templates = await Promise.all(
      templateIds.map(id => fetchTemplateFromFirebase(id))
    );
    
    return templates.filter((template): template is FirebaseTemplate => template !== null);
  } catch (error) {
    console.error('Error fetching templates from Firebase:', error);
    throw new Error(`Failed to fetch templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

