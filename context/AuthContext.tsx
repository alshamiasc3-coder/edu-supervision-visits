import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type UserRole =
  | 'admin'
  | 'supervisor_manager'
  | 'department_head'
  | 'educational_supervisor'
  | 'school_manager'
  | 'viewer';

export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'schools.view'
  | 'schools.create'
  | 'schools.update'
  | 'schools.delete'
  | 'visits.view'
  | 'visits.create'
  | 'visits.update'
  | 'visits.delete'
  | 'visits.approve'
  | 'recommendations.view'
  | 'recommendations.create'
  | 'recommendations.update'
  | 'recommendations.delete'
  | 'recommendations.follow_up'
  | 'reports.view'
  | 'reports.create'
  | 'reports.export'
  | 'settings.manage';

export type User = {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
  schoolId?: string;
  active: boolean;
  createdAt: string;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextValue = {
  currentUser: User | null;
  users: User[];
  ready: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (
    userId: string,
    data: Partial<Omit<User, 'id' | 'createdAt'>>
  ) => void;
  deleteUser: (userId: string) => void;
};

const USERS_STORAGE_KEY = 'edu-supervision-users';
const SESSION_STORAGE_KEY = 'edu-supervision-session';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'users.view', 'users.create', 'users.update', 'users.delete',
    'schools.view', 'schools.create', 'schools.update', 'schools.delete',
    'visits.view', 'visits.create', 'visits.update', 'visits.delete', 'visits.approve',
    'recommendations.view', 'recommendations.create', 'recommendations.update',
    'recommendations.delete', 'recommendations.follow_up',
    'reports.view', 'reports.create', 'reports.export', 'settings.manage',
  ],

  supervisor_manager: [
    'users.view',
    'schools.view', 'schools.create', 'schools.update',
    'visits.view', 'visits.create', 'visits.update', 'visits.approve',
    'recommendations.view', 'recommendations.create', 'recommendations.update',
    'recommendations.follow_up',
    'reports.view', 'reports.create', 'reports.export',
  ],

  department_head: [
    'users.view',
    'schools.view',
    'visits.view', 'visits.create', 'visits.update', 'visits.approve',
    'recommendations.view', 'recommendations.create', 'recommendations.update',
    'recommendations.follow_up',
    'reports.view', 'reports.create', 'reports.export',
  ],

  educational_supervisor: [
    'schools.view',
    'visits.view', 'visits.create', 'visits.update',
    'recommendations.view', 'recommendations.create',
    'recommendations.update', 'recommendations.follow_up',
    'reports.view', 'reports.create', 'reports.export',
  ],

  school_manager: [
    'schools.view',
    'visits.view',
    'recommendations.view', 'recommendations.update',
    'recommendations.follow_up',
    'reports.view',
  ],

  viewer: [
    'schools.view',
    'visits.view',
    'recommendations.view',
    'reports.view',
  ],
};

type DemoUser = User & {
  password: string;
};

/**
 * حسابات تجريبية للتطوير فقط.
 * لا تستخدم هذه الحسابات في الإنتاج.
 */
const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    fullName: 'مدير النظام',
    role: 'admin',
    active: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'user-manager',
    username: 'manager',
    password: 'manager123',
    fullName: 'مدير الإشراف',
    role: 'supervisor_manager',
    active: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'user-head',
    username: 'head',
    password: 'head123',
    fullName: 'رئيس القسم',
    role: 'department_head',
    active: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'user-supervisor',
    username: 'supervisor',
    password: 'supervisor123',
    fullName: 'المشرف التربوي',
    role: 'educational_supervisor',
    active: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'user-school',
    username: 'school',
    password: 'school123',
    fullName: 'مدير المدرسة',
    role: 'school_manager',
    active: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'user-viewer',
    username: 'viewer',
    password: 'viewer123',
    fullName: 'مستخدم للعرض',
    role: 'viewer',
    active: true,
    createdAt: '2026-08-01',
  },
];

const AuthContext = createContext<AuthContextValue | null>(null);

const createId = () =>
  Date.now().toString() + Math.random().toString(36).slice(2, 8);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [users, setUsers] = useState<User[]>(
    DEMO_USERS.map(({ password: _password, ...user }) => user)
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (storedUsers) {
          const parsedUsers = JSON.parse(storedUsers);
          if (Array.isArray(parsedUsers)) {
            setUsers(parsedUsers);
          }
        }

        if (storedSession) {
          const sessionUser = JSON.parse(storedSession);
          if (sessionUser) {
            setCurrentUser(sessionUser);
          }
        }
      } catch (error) {
        console.error('Failed to load authentication:', error);
      } finally {
        setReady(true);
      }
    };

    loadAuth();
  }, []);

  useEffect(() => {
    if (!ready) return;

    AsyncStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(users)
    ).catch((error) => {
      console.error('Failed to save users:', error);
    });
  }, [users, ready]);

  const login = async ({
    username,
    password,
  }: LoginCredentials) => {
    const demoUser = DEMO_USERS.find(
      (user) =>
        user.username === username &&
        user.password === password
    );

    const storedUser = users.find(
      (user) => user.username === username
    );

    if (!demoUser && !storedUser) return false;
    if (storedUser && !storedUser.active) return false;

    if (!demoUser) {
      // الحسابات المضافة لاحقًا تحتاج مصادقة Backend حقيقية.
      return false;
    }

    const user: User = {
      id: demoUser.id,
      username: demoUser.username,
      fullName: demoUser.fullName,
      role: demoUser.role,
      departmentId: demoUser.departmentId,
      schoolId: demoUser.schoolId,
      active: demoUser.active,
      createdAt: demoUser.createdAt,
    };

    setCurrentUser(user);

    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(user)
    );

    return true;
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!currentUser) return false;

    return Array.isArray(role)
      ? role.includes(currentUser.role)
      : currentUser.role === role;
  };

  const hasPermission = (permission: Permission) => {
    if (!currentUser) return false;

    return ROLE_PERMISSIONS[currentUser.role].includes(permission);
  };

  const addUser = (
    user: Omit<User, 'id' | 'createdAt'>
  ) => {
    const newUser: User = {
      ...user,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    setUsers((current) => [...current, newUser]);
  };

  const updateUser = (
    userId: string,
    data: Partial<Omit<User, 'id' | 'createdAt'>>
  ) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, ...data }
          : user
      )
    );
  };

  const deleteUser = (userId: string) => {
    setUsers((current) =>
      current.filter((user) => user.id !== userId)
    );
  };

  const value = useMemo(
    () => ({
      currentUser,
      users,
      ready,
      isAuthenticated: currentUser !== null,
      login,
      logout,
      hasRole,
      hasPermission,
      addUser,
      updateUser,
      deleteUser,
    }),
    [currentUser, users, ready]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'مدير النظام',
  supervisor_manager: 'مدير الإشراف',
  department_head: 'رئيس القسم',
  educational_supervisor: 'المشرف التربوي',
  school_manager: 'مدير المدرسة',
  viewer: 'مستخدم للعرض فقط',
};
