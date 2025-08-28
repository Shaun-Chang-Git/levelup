import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { User, Profile } from '../types';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    const getSession = async (): Promise<void> => {
      try {
        console.log('Getting initial session...');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        console.log('Initial session:', session?.user?.email || 'No session');
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
      }
      setLoading(false);
    };

    getSession();

    // 인증 상태 변경 리스너 설정
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setProfile(null);
        // 세션이 없어진 이유를 더 자세히 로깅
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refresh failed, user logged out');
        } else {
          console.log('Session lost, reason:', event);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<void> => {
    try {
      console.log('Fetching user profile for:', authUser.email);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        if (error.code === 'PGRST116') {
          // 사용자 프로필이 없는 경우 (수동으로 생성하지 않음 - 트리거에서 자동 생성)
          console.log('프로필이 아직 생성되지 않았습니다. 트리거가 처리 중입니다.');
        } else if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          // 401 Unauthorized 또는 JWT 관련 에러
          console.error('인증 토큰 문제 감지:', error);
          // 세션 갱신 시도
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('세션 갱신 실패:', refreshError);
          } else {
            console.log('세션 갱신 성공, 프로필 재시도');
            // 재시도
            setTimeout(() => fetchUserProfile(authUser), 1000);
            return;
          }
        }
      } else if (data) {
        console.log('Profile loaded successfully:', data.display_name || data.email);
        setProfile({
          id: data.id,
          email: data.email,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          total_points: data.total_points,
          level: data.level,
          experience_points: data.experience_points,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('사용자 프로필 조회 예외:', error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error?: any }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string): Promise<{ error?: any }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user || !profile) {
      throw new Error('사용자가 로그인하지 않았습니다');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.display_name,
        avatar_url: updates.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};