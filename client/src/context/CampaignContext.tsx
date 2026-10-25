import React, { createContext, useContext, useState, useEffect } from 'react';
import { Campaign } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CampaignContextType {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  setCurrentCampaign: (campaign: Campaign) => void;
  refreshCampaigns: () => Promise<void>;
  isLoading: boolean;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaignState] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCampaigns = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await api.get<Campaign[]>('/campaigns');
      setCampaigns(data);

      const savedCampaignId = localStorage.getItem('activeCampaignId');
      if (savedCampaignId) {
        const found = data.find((c) => c.id === savedCampaignId);
        if (found) {
          setCurrentCampaignState(found);
          setIsLoading(false);
          return;
        }
      }

      if (data.length > 0) {
        const active = data.find((c) => c.status === 'ACTIVE') || data[0];
        setCurrentCampaignState(active);
        localStorage.setItem('activeCampaignId', active.id);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCampaigns();
    } else {
      setCampaigns([]);
      setCurrentCampaignState(null);
      setIsLoading(false);
    }
  }, [user]);

  const setCurrentCampaign = (campaign: Campaign) => {
    setCurrentCampaignState(campaign);
    localStorage.setItem('activeCampaignId', campaign.id);
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        currentCampaign,
        setCurrentCampaign,
        refreshCampaigns,
        isLoading,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
