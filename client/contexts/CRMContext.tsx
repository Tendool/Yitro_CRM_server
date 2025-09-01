import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/demoApi'; // Add this import

export interface Account {
  id: number;
  name?: string;
  accountName?: string; // Support both field names
  industry?: string;
  type?: string;
  revenue?: string;
  employees?: string;
  location?: string;
  phone?: string;
  website?: string;
  owner?: string;
  rating?: string;
  lastActivity?: string;
  activeDeals?: number;
  contacts?: number;
  createdBy?: string;
  updatedBy?: string;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  status: string;
  rating: string;
  leadSource: string;
  assignedTo: string;
  lastContact: string;
  nextFollowUp: string;
  tags: string[];
  notes: string;
}

export interface Deal {
  id: number;
  name: string;
  company: string;
  value: string;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  type: string;
  source: string;
  description: string;
}

export interface Activity {
  id: number;
  type: string;
  subject: string;
  relatedTo: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  priority: string;
  description: string;
}

export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  rating: string;
  source: string;
  assignedTo: string;
  createdDate: string;
  lastContact: string;
  nextFollowUp: string;
  estimatedValue: string;
}

interface CRMContextType {
  // Accounts
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: number, account: Partial<Account>) => void;
  deleteAccount: (id: number) => void;

  // Contacts
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: number, contact: Partial<Contact>) => void;
  deleteContact: (id: number) => void;

  // Deals
  deals: Deal[];
  addDeal: (deal: Omit<Deal, 'id'>) => void;
  updateDeal: (id: number, deal: Partial<Deal>) => void;
  deleteDeal: (id: number) => void;

  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: number, activity: Partial<Activity>) => void;
  deleteActivity: (id: number) => void;

  // Leads
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: number, lead: Partial<Lead>) => void;
  deleteLead: (id: number) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  // Initialize all arrays as empty - no sample data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Account functions
  const addAccount = async (accountData: Omit<Account, 'id'>) => {
    try {
      // Validate that accountName is provided
      if (!accountData.accountName && !accountData.name) {
        throw new Error('Account name is required');
      }

      // Ensure all required fields have default values
      const normalizedAccountData = {
        accountName: accountData.accountName || accountData.name || '',
        name: accountData.name || accountData.accountName || '',
        industry: accountData.industry || 'Technology',
        type: accountData.type || 'Customer',
        revenue: accountData.revenue || '$0',
        employees: accountData.employees || '1-10',
        location: accountData.location || '',
        phone: accountData.phone || '',
        website: accountData.website || '',
        owner: accountData.owner || 'Current User',
        rating: accountData.rating || 'Cold',
        lastActivity: accountData.lastActivity || 'Just now',
        activeDeals: accountData.activeDeals || 0,
        contacts: accountData.contacts || 0,
        createdBy: accountData.createdBy || 'current-user',
        updatedBy: accountData.updatedBy || 'current-user'
      };

      // Try to use the API if available
      try {
        const response = await api.accounts.create(normalizedAccountData);
        if (response.success && response.data) {
          const newAccount = {
            ...normalizedAccountData,
            id: typeof response.data.id === 'string' ? parseInt(response.data.id) : (response.data.id || Date.now()),
          };
          setAccounts(prev => [...prev, newAccount]);
          return;
        }
      } catch (apiError) {
        console.warn('API not available, using local storage:', apiError);
      }

      // Fallback to local storage if API fails
      const newAccount = {
        ...normalizedAccountData,
        id: Date.now(),
      };
      setAccounts(prev => [...prev, newAccount]);

    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  };

  const updateAccount = (id: number, accountData: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === id 
        ? { 
            ...account, 
            ...accountData,
            // Ensure both name fields are updated and have fallbacks
            name: accountData.name || accountData.accountName || account.name || account.accountName || '',
            accountName: accountData.accountName || accountData.name || account.accountName || account.name || '',
            // Ensure type has a fallback
            type: accountData.type || account.type || 'Customer',
            // Ensure rating has a fallback
            rating: accountData.rating || account.rating || 'Cold',
            // Ensure other fields have fallbacks
            industry: accountData.industry || account.industry || 'Technology',
            revenue: accountData.revenue || account.revenue || '$0',
            employees: accountData.employees || account.employees || '1-10',
            owner: accountData.owner || account.owner || 'Current User',
            lastActivity: accountData.lastActivity || account.lastActivity || 'Just now',
            activeDeals: accountData.activeDeals ?? account.activeDeals ?? 0,
            contacts: accountData.contacts ?? account.contacts ?? 0,
          } 
        : account
    ));
  };

  const deleteAccount = (id: number) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  // Contact functions
  const addContact = (contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contactData,
      id: Date.now(),
    };
    setContacts(prev => [...prev, newContact]);
  };

  const updateContact = (id: number, contactData: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...contactData } : contact
    ));
  };

  const deleteContact = (id: number) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
  };

  // Deal functions
  const addDeal = (dealData: Omit<Deal, 'id'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: Date.now(),
    };
    setDeals(prev => [...prev, newDeal]);
  };

  const updateDeal = (id: number, dealData: Partial<Deal>) => {
    setDeals(prev => prev.map(deal => 
      deal.id === id ? { ...deal, ...dealData } : deal
    ));
  };

  const deleteDeal = (id: number) => {
    setDeals(prev => prev.filter(deal => deal.id !== id));
  };

  // Activity functions
  const addActivity = (activityData: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activityData,
      id: Date.now(),
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (id: number, activityData: Partial<Activity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, ...activityData } : activity
    ));
  };

  const deleteActivity = (id: number) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  // Lead functions
  const addLead = (leadData: Omit<Lead, 'id'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now(),
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (id: number, leadData: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...leadData } : lead
    ));
  };

  const deleteLead = (id: number) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  return (
    <CRMContext.Provider
      value={{
        // Accounts
        accounts,
        addAccount,
        updateAccount,
        deleteAccount,
        // Contacts
        contacts,
        addContact,
        updateContact,
        deleteContact,
        // Deals
        deals,
        addDeal,
        updateDeal,
        deleteDeal,
        // Activities
        activities,
        addActivity,
        updateActivity,
        deleteActivity,
        // Leads
        leads,
        addLead,
        updateLead,
        deleteLead,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}