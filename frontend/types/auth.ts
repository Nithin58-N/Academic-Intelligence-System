export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  preferred_language: string;
  created_at: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
  updateUser: (partial: Partial<User>) => void;
}
