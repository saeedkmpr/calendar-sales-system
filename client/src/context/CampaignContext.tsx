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

  // Load from local cache for instant zero-delay rendering
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('cached_campaigns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentCampaign, setCurrentCampaignState] = useState<Campaign | null>(() => {
    try {
      const saved = localStorage.getItem('cached_current_campaign');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCampaigns = async () => {
    if (!user) return;
    try {
      const data = await api.get<Campaign[]>('/campaigns');
      setCampaigns(data);
      localStorage.setItem('cached_campaigns', JSON.stringify(data));

      const savedCampaignId = localStorage.getItem('activeCampaignId');
      if (savedCampaignId) {
        const found = data.find((c) => c.id === savedCampaignId);
        if (found) {
          setCurrentCampaignState(found);
          localStorage.setItem('cached_current_campaign', JSON.stringify(found));
          return;
        }
      }

      if (data.length > 0) {
        const active = data.find((c) => c.status === 'ACTIVE') || data[0];
        setCurrentCampaignState(active);
        localStorage.setItem('activeCampaignId', active.id);
        localStorage.setItem('cached_current_campaign', JSON.stringify(active));
      }
    } catch (error) {
      console.warn('Campaign fetch notice (using cached data):', error);
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
    localStorage.setItem('cached_current_campaign', JSON.stringify(campaign));
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
