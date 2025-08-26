import React, { createContext, useContext, useState, useCallback } from 'react';
import AchievementNotification from '../components/achievements/AchievementNotification';
import LevelUpNotification from '../components/achievements/LevelUpNotification';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward_points: number;
}

interface NotificationContextType {
  showAchievementNotification: (achievement: Achievement) => void;
  showLevelUpNotification: (newLevel: number, totalPoints: number) => void;
  showSuccessNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification은 NotificationProvider 내에서 사용되어야 합니다');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [achievementNotification, setAchievementNotification] = useState<{
    achievement: Achievement | null;
    open: boolean;
  }>({
    achievement: null,
    open: false,
  });

  const [levelUpNotification, setLevelUpNotification] = useState<{
    newLevel: number;
    totalPoints: number;
    open: boolean;
  }>({
    newLevel: 0,
    totalPoints: 0,
    open: false,
  });

  const [successMessage, setSuccessMessage] = useState<{
    message: string;
    open: boolean;
  }>({
    message: '',
    open: false,
  });

  // 업적 달성 알림 표시
  const showAchievementNotification = useCallback((achievement: Achievement) => {
    setAchievementNotification({
      achievement,
      open: true,
    });
  }, []);

  // 레벨업 알림 표시
  const showLevelUpNotification = useCallback((newLevel: number, totalPoints: number) => {
    setLevelUpNotification({
      newLevel,
      totalPoints,
      open: true,
    });
  }, []);

  // 성공 메시지 표시
  const showSuccessNotification = useCallback((message: string) => {
    setSuccessMessage({
      message,
      open: true,
    });
  }, []);

  // 업적 알림 닫기
  const handleAchievementClose = useCallback(() => {
    setAchievementNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 레벨업 알림 닫기
  const handleLevelUpClose = useCallback(() => {
    setLevelUpNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 성공 메시지 닫기
  const handleSuccessClose = useCallback(() => {
    setSuccessMessage(prev => ({ ...prev, open: false }));
  }, []);

  const value: NotificationContextType = {
    showAchievementNotification,
    showLevelUpNotification,
    showSuccessNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* 업적 달성 알림 */}
      <AchievementNotification
        achievement={achievementNotification.achievement}
        open={achievementNotification.open}
        onClose={handleAchievementClose}
      />
      
      {/* 레벨업 알림 */}
      <LevelUpNotification
        newLevel={levelUpNotification.newLevel}
        totalPoints={levelUpNotification.totalPoints}
        open={levelUpNotification.open}
        onClose={handleLevelUpClose}
      />
    </NotificationContext.Provider>
  );
};