import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 환경 변수에 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'levelup-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'levelup',
    },
  },
});

// 데이터베이스 타입 정의를 위한 헬퍼 타입
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          level: number;
          experience: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          experience?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          experience?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // 추후 추가될 테이블들
      categories: any;
      goals: any;
      goal_progress: any;
      achievements: any;
      user_achievements: any;
    };
  };
};

export default supabase;