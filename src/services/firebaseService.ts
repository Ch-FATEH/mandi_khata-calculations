import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  DEFAULT_APP_CONFIG,
  FIREBASE_CONFIG,
  FIRESTORE_CONFIG,
  GOOGLE_DRIVE_SCOPES,
  isFirebaseAuthConfigured,
  isFirestoreConfigured,
} from '../config';
import { AdBanner, AuthUserSummary, GlobalAppConfig } from '../types/mandi';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let authAppInstance: FirebaseApp | null = null;
let dbAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbAuthInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

// In-memory OAuth access token only (never stored in localStorage/sessionStorage)
let cachedDriveAccessToken: string | null = null;
let isSigningInFlag = false;

function ensureAuthApp(): { app: FirebaseApp; auth: Auth } | null {
  if (!isFirebaseAuthConfigured()) return null;
  if (!authAppInstance) {
    const existing = getApps().find((a) => a.name === '[DEFAULT]');
    authAppInstance = existing || initializeApp(FIREBASE_CONFIG);
  }
  if (!authInstance) {
    authInstance = getAuth(authAppInstance);
  }
  return { app: authAppInstance, auth: authInstance };
}

function ensureFirestoreApp(): { db: Firestore; dbAuth: Auth } | null {
  if (!isFirestoreConfigured()) return null;
  if (!dbAppInstance) {
    const sameProject =
      isFirebaseAuthConfigured() &&
      FIREBASE_CONFIG.projectId === FIRESTORE_CONFIG.projectId;
    if (sameProject) {
      const primary = ensureAuthApp();
      if (primary) dbAppInstance = primary.app;
    }
    if (!dbAppInstance) {
      const existing = getApps().find((a) => a.name === 'mandiFirestore');
      dbAppInstance = existing || initializeApp(FIRESTORE_CONFIG, 'mandiFirestore');
    }
  }
  if (!firestoreInstance) {
    firestoreInstance = FIRESTORE_CONFIG.firestoreDatabaseId
      ? getFirestore(dbAppInstance, FIRESTORE_CONFIG.firestoreDatabaseId)
      : getFirestore(dbAppInstance);
  }
  if (!dbAuthInstance) {
    dbAuthInstance = getAuth(dbAppInstance);
  }
  return { db: firestoreInstance, dbAuth: dbAuthInstance };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = dbAuthInstance?.currentUser || authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  const ctx = ensureFirestoreApp();
  if (!ctx) return;
  try {
    await getDocFromServer(doc(ctx.db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

function mapUser(user: User | null): AuthUserSummary | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export function subscribeAuthState(
  onUserChange: (user: AuthUserSummary | null, hasDriveToken: boolean) => void
): () => void {
  const ctx = ensureAuthApp();
  if (!ctx) {
    onUserChange(null, false);
    return () => {};
  }
  return onAuthStateChanged(ctx.auth, (user) => {
    if (!user) {
      cachedDriveAccessToken = null;
      onUserChange(null, false);
      return;
    }
    if (!isSigningInFlag && !cachedDriveAccessToken) {
      cachedDriveAccessToken = null;
    }
    onUserChange(mapUser(user), Boolean(cachedDriveAccessToken));
  });
}

export async function signInWithGoogleAccount(): Promise<{
  user: AuthUserSummary;
  accessToken: string | null;
}> {
  const ctx = ensureAuthApp();
  if (!ctx) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const provider = new GoogleAuthProvider();
  for (const scope of GOOGLE_DRIVE_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    isSigningInFlag = true;
    const result = await signInWithPopup(ctx.auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedDriveAccessToken = credential?.accessToken || null;
    const summary = mapUser(result.user);
    if (!summary) {
      throw new Error('No user returned from Google sign-in');
    }
    return { user: summary, accessToken: cachedDriveAccessToken };
  } finally {
    isSigningInFlag = false;
  }
}

export async function reconnectDriveToken(): Promise<string | null> {
  const res = await signInWithGoogleAccount();
  return res.accessToken;
}

export function getInMemoryDriveToken(): string | null {
  return cachedDriveAccessToken;
}

export async function signOutGoogleAccount(): Promise<void> {
  cachedDriveAccessToken = null;
  if (authInstance) {
    await signOut(authInstance);
  }
  if (dbAuthInstance && dbAuthInstance !== authInstance && dbAuthInstance.currentUser) {
    await signOut(dbAuthInstance);
  }
}

export function needsSeparateFirestoreAdminAuth(): boolean {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) return false;
  if (fsCtx.dbAuth === authInstance) return false;
  return !fsCtx.dbAuth.currentUser;
}

export async function ensureFirestoreAdminSignedIn(): Promise<void> {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) throw new Error('FIRESTORE_NOT_CONFIGURED');
  if (fsCtx.dbAuth.currentUser) return;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(fsCtx.dbAuth, provider);
}

export function subscribeActiveAds(
  onAds: (ads: AdBanner[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) {
    onAds([]);
    return () => {};
  }
  const q = query(collection(fsCtx.db, 'ads'), where('active', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AdBanner[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || ''),
          description: String(data.description || ''),
          imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
          buttonText: String(data.buttonText || ''),
          buttonLink: String(data.buttonLink || ''),
          active: Boolean(data.active),
          placement: 'dashboard_top',
          startDate: String(data.startDate || ''),
          endDate: String(data.endDate || ''),
          authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
        };
      });
      onAds(list);
    },
    (error) => {
      onAds([]);
      if (onError) onError(error);
      if (fsCtx.dbAuth.currentUser || authInstance?.currentUser) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'ads');
        } catch {
          // Already logged cleanly via handleFirestoreError
        }
      }
    }
  );
}

export async function fetchAllAdsForAdmin(): Promise<AdBanner[]> {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) return [];
  try {
    const snap = await getDocs(collection(fsCtx.db, 'ads'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        description: String(data.description || ''),
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
        buttonText: String(data.buttonText || ''),
        buttonLink: String(data.buttonLink || ''),
        active: Boolean(data.active),
        placement: 'dashboard_top',
        startDate: String(data.startDate || ''),
        endDate: String(data.endDate || ''),
        authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ads');
  }
}

export async function saveAdBanner(
  ad: Omit<AdBanner, 'id' | 'authorUid'>,
  editingId?: string
): Promise<string> {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) throw new Error('FIRESTORE_NOT_CONFIGURED');
  await ensureFirestoreAdminSignedIn();
  const uid = fsCtx.dbAuth.currentUser?.uid;
  if (!uid) throw new Error('ADMIN_NOT_AUTHENTICATED');

  const id = editingId || `ad_${Date.now()}`;
  const path = `ads/${id}`;
  const ref = doc(fsCtx.db, 'ads', id);
  const payload: Record<string, unknown> = {
    title: ad.title.trim().slice(0, 120),
    description: ad.description.trim().slice(0, 500),
    buttonText: ad.buttonText.trim().slice(0, 60),
    buttonLink: ad.buttonLink.trim().slice(0, 500),
    active: Boolean(ad.active),
    placement: 'dashboard_top',
    startDate: (ad.startDate || '').slice(0, 20),
    endDate: (ad.endDate || '').slice(0, 20),
    authorUid: uid,
    updatedAt: serverTimestamp(),
  };
  if (ad.imageUrl && ad.imageUrl.trim()) {
    payload.imageUrl = ad.imageUrl.trim().slice(0, 250000);
  }

  try {
    if (editingId) {
      await updateDoc(ref, payload);
    } else {
      payload.createdAt = serverTimestamp();
      await setDoc(ref, payload);
    }
    return id;
  } catch (error) {
    handleFirestoreError(
      error,
      editingId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteAdBanner(id: string): Promise<void> {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) throw new Error('FIRESTORE_NOT_CONFIGURED');
  await ensureFirestoreAdminSignedIn();
  const path = `ads/${id}`;
  try {
    await deleteDoc(doc(fsCtx.db, 'ads', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublicAppConfig(
  onConfig: (config: GlobalAppConfig) => void
): () => void {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) {
    onConfig(DEFAULT_APP_CONFIG);
    return () => {};
  }
  const ref = doc(fsCtx.db, 'appConfig', 'public');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onConfig(DEFAULT_APP_CONFIG);
        return;
      }
      const d = snap.data();
      onConfig({
        tutorialYoutubeUrl:
          typeof d.tutorialYoutubeUrl === 'string'
            ? d.tutorialYoutubeUrl
            : DEFAULT_APP_CONFIG.tutorialYoutubeUrl,
        aiEnabled:
          typeof d.aiEnabled === 'boolean' ? d.aiEnabled : DEFAULT_APP_CONFIG.aiEnabled,
        aiDailySummaryEnabled:
          typeof d.aiDailySummaryEnabled === 'boolean'
            ? d.aiDailySummaryEnabled
            : DEFAULT_APP_CONFIG.aiDailySummaryEnabled,
        aiDraftEntryEnabled:
          typeof d.aiDraftEntryEnabled === 'boolean'
            ? d.aiDraftEntryEnabled
            : DEFAULT_APP_CONFIG.aiDraftEntryEnabled,
        aiChatEnabled:
          typeof d.aiChatEnabled === 'boolean'
            ? d.aiChatEnabled
            : DEFAULT_APP_CONFIG.aiChatEnabled,
      });
    },
    (error) => {
      onConfig(DEFAULT_APP_CONFIG);
      if (fsCtx.dbAuth.currentUser || authInstance?.currentUser) {
        try {
          handleFirestoreError(error, OperationType.GET, 'appConfig/public');
        } catch {
          // logged cleanly
        }
      }
    }
  );
}

export async function savePublicAppConfig(config: GlobalAppConfig): Promise<void> {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) throw new Error('FIRESTORE_NOT_CONFIGURED');
  await ensureFirestoreAdminSignedIn();
  const uid = fsCtx.dbAuth.currentUser?.uid;
  if (!uid) throw new Error('ADMIN_NOT_AUTHENTICATED');

  try {
    await setDoc(doc(fsCtx.db, 'appConfig', 'public'), {
      tutorialYoutubeUrl: (config.tutorialYoutubeUrl || '').trim().slice(0, 500),
      aiEnabled: Boolean(config.aiEnabled),
      aiDailySummaryEnabled: Boolean(config.aiDailySummaryEnabled),
      aiDraftEntryEnabled: Boolean(config.aiDraftEntryEnabled),
      aiChatEnabled: Boolean(config.aiChatEnabled),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'appConfig/public');
  }
}

export function subscribeAllAdsForAdmin(
  onAds: (ads: AdBanner[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const fsCtx = ensureFirestoreApp();
  if (!fsCtx) {
    onAds([]);
    return () => {};
  }
  return onSnapshot(
    collection(fsCtx.db, 'ads'),
    (snapshot) => {
      const list: AdBanner[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || ''),
          description: String(data.description || ''),
          imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
          buttonText: String(data.buttonText || ''),
          buttonLink: String(data.buttonLink || ''),
          active: Boolean(data.active),
          placement: 'dashboard_top',
          startDate: String(data.startDate || ''),
          endDate: String(data.endDate || ''),
          authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
        };
      });
      onAds(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'ads');
      } catch {
        // logged cleanly
      }
    }
  );
}

export const saveAdToFirestore = saveAdBanner;
export const deleteAdInFirestore = deleteAdBanner;
export const saveGlobalAppConfig = savePublicAppConfig;

