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
  updateAccount: (id: number, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;

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
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  updateLead: (id: number, lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: number) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  // Initialize all arrays as empty - no sample data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Load initial data from API/localStorage on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load leads
        const leadsResponse = await api.leads.getAll();
        if (leadsResponse.success && leadsResponse.data) {
          const apiLeads = leadsResponse.data.map(lead => ({
            ...lead,
            id: typeof lead.id === 'string' ? parseInt(lead.id) : lead.id
          }));
          setLeads(apiLeads);
        }

        // Load accounts
        const accountsResponse = await api.accounts.getAll();
        if (accountsResponse.success && accountsResponse.data) {
          const apiAccounts = accountsResponse.data.map(account => ({
            ...account,
            id: typeof account.id === 'string' ? parseInt(account.id) : account.id,
            name: account.accountName || account.name || '',
            accountName: account.accountName || account.name || ''
          }));
          setAccounts(apiAccounts);
        }

        // Load contacts
        const contactsResponse = await api.contacts.getAll();
        if (contactsResponse.success && contactsResponse.data) {
          const apiContacts = contactsResponse.data.map(contact => ({
            ...contact,
            id: typeof contact.id === 'string' ? parseInt(contact.id) : contact.id,
            fullName: `${contact.firstName} ${contact.lastName}`,
            email: contact.emailAddress || '',
            phone: contact.mobilePhone || contact.deskPhone || '',
            company: contact.associatedAccount || '',
            jobTitle: contact.title || '',
            status: contact.status || '',
            rating: 'Cold', // Default rating
            leadSource: contact.source || '',
            assignedTo: contact.owner || '',
            lastContact: contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : '',
            nextFollowUp: '',
            tags: [],
            notes: ''
          }));
          setContacts(apiContacts);
        }

        // Load deals
        const dealsResponse = await api.deals.getAll();
        if (dealsResponse.success && dealsResponse.data) {
          const apiDeals = dealsResponse.data.map(deal => ({
            ...deal,
            id: typeof deal.id === 'string' ? parseInt(deal.id) : deal.id,
            name: deal.dealName || '',
            company: deal.associatedAccount || '',
            value: deal.dealValue || '$0',
            stage: deal.stage || '',
            probability: deal.probability ? parseInt(deal.probability) : 0,
            closeDate: deal.closingDate ? new Date(deal.closingDate).toISOString().split('T')[0] : '',
            owner: deal.dealOwner || '',
            lastActivity: deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString() : ''
          }));
          setDeals(apiDeals);
        }

        // Load activities
        const activitiesResponse = await api.activities.getAll();
        if (activitiesResponse.success && activitiesResponse.data) {
          const apiActivities = activitiesResponse.data.map(activity => ({
            ...activity,
            id: typeof activity.id === 'string' ? parseInt(activity.id) : activity.id,
            type: activity.activityType || '',
            contact: activity.associatedContact || '',
            account: activity.associatedAccount || '',
            date: activity.dateTime ? new Date(activity.dateTime).toISOString().split('T')[0] : '',
            time: activity.dateTime ? new Date(activity.dateTime).toLocaleTimeString() : '',
            description: activity.summary || '',
            outcome: activity.outcomeDisposition || '',
            followUp: activity.followUpSchedule || '',
            priority: 'Medium'
          }));
          setActivities(apiActivities);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

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

  const updateAccount = async (id: number, accountData: Partial<Account>) => {
    try {
      // Try to use the API if available
      try {
        const response = await api.accounts.update(String(id), accountData);
        if (response.success) {
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
          return;
        }
      } catch (apiError) {
        console.warn('API not available for update, using fallback:', apiError);
      }

      // Fallback to local state update
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
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      // Try to use the API if available
      try {
        const response = await api.accounts.delete(String(id));
        if (response.success) {
          setAccounts(prev => prev.filter(account => account.id !== id));
          return;
        }
      } catch (apiError) {
        console.warn('API not available for delete, using fallback:', apiError);
      }

      // Fallback to local state update
      setAccounts(prev => prev.filter(account => account.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
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
  const addLead = async (leadData: Omit<Lead, 'id'>) => {
    try {
      // Prepare data for API with proper mapping
      const apiLeadData = {
        firstName: leadData.firstName || (leadData.name ? leadData.name.split(' ')[0] : ''),
        lastName: leadData.lastName || (leadData.name ? leadData.name.split(' ').slice(1).join(' ') : ''),
        company: leadData.company || '',
        title: leadData.title || '',
        phone: leadData.phone || '',
        email: leadData.email || '',
        leadSource: leadData.source || leadData.leadSource || 'Website',
        status: leadData.status || 'New',
        rating: leadData.rating || 'Cold',
        owner: leadData.owner || 'Current User',
        createdBy: 'current-user',
        updatedBy: 'current-user'
      };

      // Try to use the API if available
      try {
        const response = await api.leads.create(apiLeadData);
        if (response.success && response.data) {
          const newLead = {
            ...leadData,
            id: typeof response.data.id === 'string' ? parseInt(response.data.id) : (response.data.id || Date.now()),
            firstName: apiLeadData.firstName,
            lastName: apiLeadData.lastName,
            source: apiLeadData.leadSource,
            leadSource: apiLeadData.leadSource,
            status: apiLeadData.status,
            rating: apiLeadData.rating,
            owner: apiLeadData.owner,
            lastActivity: 'Just now'
          };
          setLeads(prev => [...prev, newLead]);
          return;
        }
      } catch (apiError) {
        console.warn('API not available, using fallback:', apiError);
      }

      // Fallback to local storage if API fails
      const newLead: Lead = {
        ...leadData,
        id: Date.now(),
        firstName: apiLeadData.firstName,
        lastName: apiLeadData.lastName,
        source: apiLeadData.leadSource,
        leadSource: apiLeadData.leadSource,
        status: apiLeadData.status,
        rating: apiLeadData.rating,
        owner: apiLeadData.owner,
        lastActivity: 'Just now'
      };
      setLeads(prev => [...prev, newLead]);

    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  };

  const updateLead = async (id: number, leadData: Partial<Lead>) => {
    try {
      // Try to use the API if available
      try {
        const response = await api.leads.update(String(id), leadData);
        if (response.success) {
          setLeads(prev => prev.map(lead => 
            lead.id === id ? { ...lead, ...leadData } : lead
          ));
          return;
        }
      } catch (apiError) {
        console.warn('API not available for update, using fallback:', apiError);
      }

      // Fallback to local state update
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...leadData } : lead
      ));
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  };

  const deleteLead = async (id: number) => {
    try {
      // Try to use the API if available
      try {
        const response = await api.leads.delete(String(id));
        if (response.success) {
          setLeads(prev => prev.filter(lead => lead.id !== id));
          return;
        }
      } catch (apiError) {
        console.warn('API not available for delete, using fallback:', apiError);
      }

      // Fallback to local state update
      setLeads(prev => prev.filter(lead => lead.id !== id));
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
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