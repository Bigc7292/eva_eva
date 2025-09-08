/**
 * Mock Authentication for Development
 * Use when Supabase is not accessible
 */

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    role: string;
  };
}

export interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: MockUser;
}

// Mock users for development
export const MOCK_USERS: Record<string, { password: string; user: MockUser }> = {
  'dev@eva.com': {
    password: 'dev123456',
    user: {
      id: 'mock-admin-id',
      email: 'dev@eva.com',
      user_metadata: {
        full_name: 'Development Admin',
        role: 'admin'
      }
    }
  },
  'manager@eva.com': {
    password: 'manager123',
    user: {
      id: 'mock-manager-id', 
      email: 'manager@eva.com',
      user_metadata: {
        full_name: 'Test Manager',
        role: 'manager'
      }
    }
  },
  'agent@eva.com': {
    password: 'agent123',
    user: {
      id: 'mock-agent-id',
      email: 'agent@eva.com', 
      user_metadata: {
        full_name: 'Test Agent',
        role: 'agent'
      }
    }
  }
};

export class MockAuth {
  static createMockSession(user: MockUser): MockSession {
    return {
      access_token: `mock-token-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      user
    };
  }

  static async signInWithPassword(email: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[email];
    
    if (!mockUser || mockUser.password !== password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };
    }

    const session = this.createMockSession(mockUser.user);

    // Store in localStorage for persistence
    localStorage.setItem('mock-session', JSON.stringify(session));

    return {
      data: { user: mockUser.user, session },
      error: null
    };
  }

  static async signOut() {
    localStorage.removeItem('mock-session');
    return { error: null };
  }

  static getSession() {
    try {
      const sessionData = localStorage.getItem('mock-session');
      if (!sessionData) {
        return { data: { session: null } };
      }

      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session.expires_at && session.expires_at < Date.now()) {
        localStorage.removeItem('mock-session');
        return { data: { session: null } };
      }

      return { data: { session } };
    } catch {
      return { data: { session: null } };
    }
  }

  static onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    // Initial session check
    const { data } = this.getSession();
    callback('SIGNED_IN', data.session);

    // Return mock subscription
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
}