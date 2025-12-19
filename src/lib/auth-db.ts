// Authentication Database for offline-first auth
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type UserRole = 'admin' | 'staff';
export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  email?: string;
  displayName: string;
  authProvider: AuthProvider;
  role: UserRole;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovedGoogleUser {
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

interface AuthDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string; 'by-email': string };
  };
  approved_google_users: {
    key: string;
    value: ApprovedGoogleUser;
  };
  sessions: {
    key: string;
    value: AuthSession;
    indexes: { 'by-user': string; 'by-token': string };
  };
}

let authDbInstance: IDBPDatabase<AuthDB> | null = null;

export async function getAuthDB(): Promise<IDBPDatabase<AuthDB>> {
  if (authDbInstance) return authDbInstance;

  authDbInstance = await openDB<AuthDB>('gst-billing-auth-db', 1, {
    upgrade(db) {
      // Users store
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('by-username', 'username', { unique: true });
      userStore.createIndex('by-email', 'email');

      // Approved Google users store
      db.createObjectStore('approved_google_users', { keyPath: 'email' });

      // Sessions store
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('by-user', 'userId');
      sessionStore.createIndex('by-token', 'token', { unique: true });
    },
  });

  return authDbInstance;
}

// Simple hash function for passwords (in production, use a proper library)
// This is a basic implementation for offline-first functionality
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'gst-billing-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate secure random token
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// User operations
export async function getUsers(): Promise<User[]> {
  const db = await getAuthDB();
  return db.getAll('users');
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getAuthDB();
  return db.get('users', id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getAuthDB();
  return db.getFromIndex('users', 'by-username', username);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getAuthDB();
  const users = await db.getAllFromIndex('users', 'by-email', email);
  return users[0];
}

export async function createUser(userData: {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  role: UserRole;
  authProvider?: AuthProvider;
}): Promise<User> {
  const db = await getAuthDB();
  
  // Check if username exists
  const existingUser = await getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const passwordHash = await hashPassword(userData.password);
  
  const newUser: User = {
    id: generateId(),
    username: userData.username,
    passwordHash,
    displayName: userData.displayName,
    email: userData.email,
    authProvider: userData.authProvider || 'local',
    role: userData.role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.add('users', newUser);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getAuthDB();
  const user = await db.get('users', id);
  if (user) {
    await db.put('users', { ...user, ...updates, updatedAt: new Date() });
  }
}

export async function updateUserPassword(id: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await updateUser(id, { passwordHash });
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getAuthDB();
  await db.delete('users', id);
  
  // Delete all sessions for this user
  const sessions = await db.getAllFromIndex('sessions', 'by-user', id);
  for (const session of sessions) {
    await db.delete('sessions', session.id);
  }
}

// Approved Google users operations
export async function getApprovedGoogleUsers(): Promise<ApprovedGoogleUser[]> {
  const db = await getAuthDB();
  return db.getAll('approved_google_users');
}

export async function isGoogleUserApproved(email: string): Promise<ApprovedGoogleUser | undefined> {
  const db = await getAuthDB();
  return db.get('approved_google_users', email.toLowerCase());
}

export async function addApprovedGoogleUser(email: string, role: UserRole = 'staff'): Promise<ApprovedGoogleUser> {
  const db = await getAuthDB();
  const approvedUser: ApprovedGoogleUser = {
    email: email.toLowerCase(),
    role,
    createdAt: new Date(),
  };
  await db.put('approved_google_users', approvedUser);
  return approvedUser;
}

export async function removeApprovedGoogleUser(email: string): Promise<void> {
  const db = await getAuthDB();
  await db.delete('approved_google_users', email.toLowerCase());
}

// Session operations
export async function createSession(userId: string): Promise<AuthSession> {
  const db = await getAuthDB();
  
  // Clean up old sessions for this user
  const existingSessions = await db.getAllFromIndex('sessions', 'by-user', userId);
  for (const session of existingSessions) {
    await db.delete('sessions', session.id);
  }

  const session: AuthSession = {
    id: generateId(),
    userId,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    lastActivityAt: new Date(),
  };

  await db.add('sessions', session);
  
  // Update user's last login
  await updateUser(userId, { lastLogin: new Date() });
  
  return session;
}

export async function getSessionByToken(token: string): Promise<AuthSession | undefined> {
  const db = await getAuthDB();
  return db.getFromIndex('sessions', 'by-token', token);
}

export async function validateSession(token: string): Promise<{ session: AuthSession; user: User } | null> {
  const session = await getSessionByToken(token);
  
  if (!session) return null;
  
  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(session.id);
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user || !user.isActive) {
    await deleteSession(session.id);
    return null;
  }

  // Update last activity
  const db = await getAuthDB();
  await db.put('sessions', { ...session, lastActivityAt: new Date() });

  return { session, user };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getAuthDB();
  await db.delete('sessions', sessionId);
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const session = await getSessionByToken(token);
  if (session) {
    await deleteSession(session.id);
  }
}

// Initialize default admin user if no users exist
export async function initializeAuthDB(): Promise<void> {
  const db = await getAuthDB();
  const users = await db.getAll('users');
  
  if (users.length === 0) {
    // Create default admin user
    await createUser({
      username: 'admin',
      password: 'admin123', // Default password - should be changed
      displayName: 'Administrator',
      role: 'admin',
    });
    
    console.log('Default admin user created. Username: admin, Password: admin123');
  }
}

// Authentication helper
export async function authenticateUser(username: string, password: string): Promise<{ user: User; session: AuthSession } | null> {
  const user = await getUserByUsername(username);
  
  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const session = await createSession(user.id);
  return { user, session };
}

// Google Authentication helper
export async function authenticateGoogleUser(email: string, name: string): Promise<{ user: User; session: AuthSession } | null> {
  // Check if user already exists with this email
  let user = await getUserByEmail(email);
  
  if (user) {
    // Existing user - verify they're active
    if (!user.isActive) {
      return null;
    }
  } else {
    // New user - check if they're in the approved list
    const approvedUser = await isGoogleUserApproved(email);
    if (!approvedUser) {
      return null;
    }
    
    // Create the user
    user = await createUser({
      username: email,
      password: generateToken(), // Random password since Google handles auth
      displayName: name,
      email: email,
      role: approvedUser.role,
      authProvider: 'google',
    });
  }

  const session = await createSession(user.id);
  return { user, session };
}
