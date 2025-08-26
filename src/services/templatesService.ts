import { supabase } from './supabase';
import { GoalTemplate, TemplateSearchOptions } from '../types';

export class TemplatesService {
  // 모든 공개 템플릿 조회 (검색/필터링 포함)
  static async getPublicTemplates(options: TemplateSearchOptions = {}): Promise<GoalTemplate[]> {
    let query = supabase
      .from('goal_templates')
      .select(`
        *,
        categories(*)
      `)
      .eq('is_public', true);

    // 카테고리 필터
    if (options.category_id) {
      query = query.eq('category_id', options.category_id);
    }

    // 난이도 필터
    if (options.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }

    // 태그 검색
    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    // 텍스트 검색 (제목, 설명, 태그)
    if (options.search_query) {
      query = query.or(`
        title.ilike.%${options.search_query}%,
        description.ilike.%${options.search_query}%,
        tags.cs.{${options.search_query}}
      `);
    }

    // 정렬
    const sortBy = options.sort_by || 'usage_count';
    const sortOrder = options.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new Error(`템플릿 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 인기 템플릿 조회 (사용량 기준)
  static async getPopularTemplates(limit: number = 10): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('goal_templates')
      .select(`
        *,
        categories(*)
      `)
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`인기 템플릿 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 최신 템플릿 조회
  static async getLatestTemplates(limit: number = 10): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('goal_templates')
      .select(`
        *,
        categories(*)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`최신 템플릿 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 카테고리별 추천 템플릿 조회
  static async getTemplatesByCategory(categoryId: string, limit: number = 5): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('goal_templates')
      .select(`
        *,
        categories(*)
      `)
      .eq('is_public', true)
      .eq('category_id', categoryId)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`카테고리별 템플릿 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 사용자별 템플릿 생성 (개인 템플릿)
  static async createUserTemplate(
    userId: string, 
    templateData: Omit<GoalTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
  ): Promise<GoalTemplate> {
    const { data, error } = await supabase
      .from('goal_templates')
      .insert([{
        ...templateData,
        creator_id: userId,
        usage_count: 0,
      }])
      .select(`
        *,
        categories(*)
      `)
      .single();

    if (error) {
      throw new Error(`템플릿 생성 실패: ${error.message}`);
    }

    return data;
  }

  // 사용자의 개인 템플릿 조회
  static async getUserTemplates(userId: string): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('goal_templates')
      .select(`
        *,
        categories(*)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`개인 템플릿 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 템플릿 사용량 증가 (템플릿으로 목표 생성 시 호출)
  static async incrementTemplateUsage(templateId: string): Promise<void> {
    const { error } = await supabase
      .rpc('increment_template_usage', { template_id: templateId });

    if (error) {
      throw new Error(`템플릿 사용량 업데이트 실패: ${error.message}`);
    }
  }

  // 사용자 즐겨찾기 템플릿 추가
  static async addToFavorites(userId: string, templateId: string): Promise<void> {
    const { error } = await supabase
      .from('user_template_favorites')
      .insert([{
        user_id: userId,
        template_id: templateId,
      }]);

    if (error) {
      throw new Error(`즐겨찾기 추가 실패: ${error.message}`);
    }
  }

  // 사용자 즐겨찾기 템플릿 제거
  static async removeFromFavorites(userId: string, templateId: string): Promise<void> {
    const { error } = await supabase
      .from('user_template_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', templateId);

    if (error) {
      throw new Error(`즐겨찾기 제거 실패: ${error.message}`);
    }
  }

  // 사용자의 즐겨찾기 템플릿 조회
  static async getFavoriteTemplates(userId: string): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('user_template_favorites')
      .select(`
        goal_templates(*,
          categories(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`즐겨찾기 템플릿 조회 실패: ${error.message}`);
    }

    return data?.map(item => item.goal_templates).filter(Boolean) || [];
  }

  // 사용자가 특정 템플릿을 즐겨찾기했는지 확인
  static async isFavorite(userId: string, templateId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_template_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .maybeSingle();

    if (error) {
      throw new Error(`즐겨찾기 상태 확인 실패: ${error.message}`);
    }

    return !!data;
  }

  // 템플릿으로부터 목표 데이터 생성 도우미
  static createGoalFromTemplate(template: GoalTemplate, userId: string) {
    const targetDate = template.duration_days 
      ? new Date(Date.now() + template.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null;

    return {
      user_id: userId,
      title: template.title,
      description: template.description || null,
      category_id: template.category_id || null,
      difficulty: template.difficulty,
      target_value: template.target_value || null,
      current_value: 0,
      unit: template.unit || null,
      status: 'active' as const,
      target_date: targetDate,
      reward_points: this.calculateRewardPoints(template.difficulty),
      streak_count: 0,
    };
  }

  // 난이도별 보상 포인트 계산
  private static calculateRewardPoints(difficulty: string): number {
    const pointsMap = {
      easy: 50,
      medium: 100,
      hard: 200,
      expert: 500,
    };
    return pointsMap[difficulty as keyof typeof pointsMap] || 100;
  }

  // 태그 기반 템플릿 추천
  static async getRecommendedTemplates(tags: string[], limit: number = 5): Promise<GoalTemplate[]> {
    if (!tags.length) return [];

    const { data, error } = await supabase
      .from('goal_templates')
      .select(`
        *,
        categories(*)
      `)
      .eq('is_public', true)
      .overlaps('tags', tags)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`추천 템플릿 조회 실패: ${error.message}`);
    }

    return data || [];
  }
}