import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, User } from '../firebase';
import { JournalEntry } from '../types';

export async function syncUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Journaler',
        photoURL: user.photoURL || '',
        lastLoginAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeUserJournals(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/journals`;
  try {
    const q = query(
      collection(db, 'users', userId, 'journals'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          entries.push({
            id: docSnap.id,
            userId: data.userId || userId,
            title: data.title || 'Untitled Session',
            messages: Array.isArray(data.messages) ? data.messages : [],
            summary: data.summary || '',
            mood: data.mood || 'Reflective',
            keyThemes: Array.isArray(data.keyThemes) ? data.keyThemes : [],
            actionableInsights: Array.isArray(data.actionableInsights)
              ? data.actionableInsights
              : [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });
        onData(entries);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, collectionPath);
        } catch (handledError) {
          if (onError && handledError instanceof Error) {
            onError(handledError);
          }
        }
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function saveJournalEntry(
  userId: string,
  entry: Partial<JournalEntry> & { id: string }
): Promise<void> {
  const docPath = `users/${userId}/journals/${entry.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'journals', entry.id);
    const nowIso = new Date().toISOString();
    const payload = {
      ...entry,
      userId,
      updatedAt: nowIso,
      createdAt: entry.createdAt || nowIso,
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const docPath = `users/${userId}/journals/${entryId}`;
  try {
    const docRef = doc(db, 'users', userId, 'journals', entryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
