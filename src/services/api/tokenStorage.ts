import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ebobo.auth.access_token';
const USER_ID_KEY = 'ebobo.auth.user_id';
const STATUS_KEY = 'ebobo.auth.status';

type StoredSession = {
  accessToken: string;
  userId: string;
  status: 'anonymous' | 'authenticated';
};

/**
 * Native: SecureStore (gdy dostępny).
 * Web: sessionStorage — krótszy żywot niż localStorage; nadal nie jest magazynem „bezpiecznym”.
 */
async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-secure-store');
  } catch {
    return null;
  }
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  try {
    const secure = await getSecureStore();
    let token: string | null = null;
    let userId: string | null = null;
    let status: string | null = null;

    if (secure) {
      token = await secure.getItemAsync(TOKEN_KEY);
      userId = await secure.getItemAsync(USER_ID_KEY);
      status = await secure.getItemAsync(STATUS_KEY);
    } else if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem(TOKEN_KEY);
      userId = sessionStorage.getItem(USER_ID_KEY);
      status = sessionStorage.getItem(STATUS_KEY);
    } else {
      token = await AsyncStorage.getItem(TOKEN_KEY);
      userId = await AsyncStorage.getItem(USER_ID_KEY);
      status = await AsyncStorage.getItem(STATUS_KEY);
    }

    if (!token || !userId) return null;
    const authStatus: StoredSession['status'] =
      status === 'authenticated' ? 'authenticated' : 'anonymous';

    return {
      accessToken: token,
      userId,
      status: authStatus,
    };
  } catch {
    return null;
  }
}

export async function saveStoredSession(session: StoredSession): Promise<void> {
  const secure = await getSecureStore();
  if (secure) {
    await secure.setItemAsync(TOKEN_KEY, session.accessToken);
    await secure.setItemAsync(USER_ID_KEY, session.userId);
    await secure.setItemAsync(STATUS_KEY, session.status);
    return;
  }
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, session.accessToken);
    sessionStorage.setItem(USER_ID_KEY, session.userId);
    sessionStorage.setItem(STATUS_KEY, session.status);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, session.accessToken);
  await AsyncStorage.setItem(USER_ID_KEY, session.userId);
  await AsyncStorage.setItem(STATUS_KEY, session.status);
}

export async function clearStoredSession(): Promise<void> {
  const secure = await getSecureStore();
  if (secure) {
    await secure.deleteItemAsync(TOKEN_KEY);
    await secure.deleteItemAsync(USER_ID_KEY);
    await secure.deleteItemAsync(STATUS_KEY);
    return;
  }
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(STATUS_KEY);
    return;
  }
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY, STATUS_KEY]);
}
