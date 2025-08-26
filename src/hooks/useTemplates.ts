import { useState, useEffect, useCallback } from 'react';
import { GoalTemplate, TemplateSearchOptions } from '../types';
import { TemplatesService } from '../services/templatesService';
import { useAuth } from '../contexts/AuthContext';

interface UseTemplatesReturn {
  // 상태
  templates: GoalTemplate[];
  popularTemplates: GoalTemplate[];
  favoriteTemplates: GoalTemplate[];
  loading: boolean;
  error: string | null;
  
  // 액션
  loadTemplates: (options?: TemplateSearchOptions) => Promise<void>;
  loadPopularTemplates: (limit?: number) => Promise<void>;
  loadFavoriteTemplates: () => Promise<void>;
  addToFavorites: (templateId: string) => Promise<void>;
  removeFromFavorites: (templateId: string) => Promise<void>;
  isFavorite: (templateId: string) => Promise<boolean>;
  createUserTemplate: (templateData: Omit<GoalTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Promise<GoalTemplate>;
  clearError: () => void;
}

export const useTemplates = (): UseTemplatesReturn => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<GoalTemplate[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 템플릿 목록 조회
  const loadTemplates = useCallback(async (options: TemplateSearchOptions = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await TemplatesService.getPublicTemplates(options);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '템플릿 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // 인기 템플릿 조회
  const loadPopularTemplates = useCallback(async (limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const data = await TemplatesService.getPopularTemplates(limit);
      setPopularTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인기 템플릿 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // 즐겨찾기 템플릿 조회
  const loadFavoriteTemplates = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await TemplatesService.getFavoriteTemplates(user.id);
      setFavoriteTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '즐겨찾기 템플릿 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 즐겨찾기 추가
  const addToFavorites = useCallback(async (templateId: string) => {
    if (!user?.id) return;

    try {
      setError(null);
      await TemplatesService.addToFavorites(user.id, templateId);
      
      // 즐겨찾기 목록 새로고침
      await loadFavoriteTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '즐겨찾기 추가 실패');
    }
  }, [user?.id, loadFavoriteTemplates]);

  // 즐겨찾기 제거
  const removeFromFavorites = useCallback(async (templateId: string) => {
    if (!user?.id) return;

    try {
      setError(null);
      await TemplatesService.removeFromFavorites(user.id, templateId);
      
      // 즐겨찾기 목록 새로고침
      await loadFavoriteTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '즐겨찾기 제거 실패');
    }
  }, [user?.id, loadFavoriteTemplates]);

  // 즐겨찾기 상태 확인
  const isFavorite = useCallback(async (templateId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      return await TemplatesService.isFavorite(user.id, templateId);
    } catch (err) {
      console.error('즐겨찾기 상태 확인 실패:', err);
      return false;
    }
  }, [user?.id]);

  // 사용자 템플릿 생성
  const createUserTemplate = useCallback(async (
    templateData: Omit<GoalTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
  ): Promise<GoalTemplate> => {
    if (!user?.id) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      setError(null);
      const newTemplate = await TemplatesService.createUserTemplate(user.id, templateData);
      
      // 템플릿 목록 새로고침
      await loadTemplates();
      
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '템플릿 생성 실패';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, loadTemplates]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 인기 템플릿 로드
  useEffect(() => {
    loadPopularTemplates();
  }, [loadPopularTemplates]);

  // 사용자 로그인 시 즐겨찾기 로드
  useEffect(() => {
    if (user?.id) {
      loadFavoriteTemplates();
    }
  }, [user?.id, loadFavoriteTemplates]);

  return {
    templates,
    popularTemplates,
    favoriteTemplates,
    loading,
    error,
    loadTemplates,
    loadPopularTemplates,
    loadFavoriteTemplates,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    createUserTemplate,
    clearError,
  };
};