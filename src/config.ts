import firebaseAppletConfig from '../firebase-applet-config.json';
import { GlobalAppConfig } from './types/mandi';

export interface FirebaseAppOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

/**
 * Central developer configuration for Mandi Khata.
 * Paste your own Firebase project config here when deploying independently,
 * or keep the provisioned AI Studio config as default.
 */
export const FIREBASE_CONFIG: FirebaseAppOptions = {
  apiKey: firebaseAppletConfig.apiKey || '',
  authDomain: firebaseAppletConfig.authDomain || '',
  projectId: firebaseAppletConfig.projectId || '',
  storageBucket: firebaseAppletConfig.storageBucket || '',
  messagingSenderId: firebaseAppletConfig.messagingSenderId || '',
  appId: firebaseAppletConfig.appId || '',
  oAuthClientId: (firebaseAppletConfig as { oAuthClientId?: string }).oAuthClientId || '',
};

/**
 * Firestore database configuration.
 * If custom FIREBASE_CONFIG specifies firestoreDatabaseId, uses the same app;
 * otherwise connects to the provisioned Firestore database for ads & feature flags.
 */
export const FIRESTORE_CONFIG: FirebaseAppOptions = (
  firebaseAppletConfig as { firestoreDatabaseId?: string }
).firestoreDatabaseId
  ? {
      ...FIREBASE_CONFIG,
      firestoreDatabaseId: (firebaseAppletConfig as { firestoreDatabaseId?: string })
        .firestoreDatabaseId,
    }
  : {
      apiKey: 'AIzaSyCzMWoAhq7T96zC3MHdnIj_JH4KcBYD8uc',
      authDomain: 'tranquil-flow-dxtlg.firebaseapp.com',
      projectId: 'tranquil-flow-dxtlg',
      storageBucket: 'tranquil-flow-dxtlg.firebasestorage.app',
      messagingSenderId: '332147721794',
      appId: '1:332147721794:web:686652f20c18b3efb50fdb',
      firestoreDatabaseId:
        'ai-studio-mandikhatacommis-7a24b9e0-59ad-4e77-bfac-11e6c7c79651',
    };

/**
 * Developer / Admin Google account email.
 * Admin Panel is visible ONLY when signed in with this exact email.
 */
export const ADMIN_EMAIL = 'blackhat786hacker@gmail.com';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
] as const;

export const DEVELOPER_CREDIT = {
  teamName: 'EagleX',
  teamLabel: 'Designing Team: EagleX',
  whatsappDisplay: '0301-5730577',
  phoneDisplay: '0301-5730577',
  footerText: 'Designed & Developed by Team EagleX',
  whatsappPitchUr:
    'Agar aap ko bhi apni shop/business ke liye app ya website banwani ho, ya is app mein koi technical help chahiye, to WhatsApp par rabta karen:',
  whatsappUrl: 'https://wa.me/923015730577',
  telUrl: 'tel:03015730577',
} as const;

/**
 * Optional developer-configured YouTube tutorial URL (can also be updated live in Admin Panel).
 * Leave empty to show "Video jald aa raha hai".
 */
export const DEFAULT_TUTORIAL_YOUTUBE_URL = '';

export const DEFAULT_APP_CONFIG: GlobalAppConfig = {
  tutorialYoutubeUrl: DEFAULT_TUTORIAL_YOUTUBE_URL,
  aiEnabled: true,
  aiDailySummaryEnabled: true,
  aiDraftEntryEnabled: true,
  aiChatEnabled: true,
};

export function isFirebaseAuthConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey?.trim() &&
      FIREBASE_CONFIG.projectId?.trim() &&
      FIREBASE_CONFIG.authDomain?.trim() &&
      FIREBASE_CONFIG.appId?.trim()
  );
}

export function isFirestoreConfigured(): boolean {
  return Boolean(
    FIRESTORE_CONFIG.apiKey?.trim() && FIRESTORE_CONFIG.projectId?.trim()
  );
}

export function isAdminUser(email?: string | null): boolean {
  if (!email || !ADMIN_EMAIL.trim()) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
}
