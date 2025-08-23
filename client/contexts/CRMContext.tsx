import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { api } from "../services/api";

// Types
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title?: string;
  phone?: string;
  email?: string;
  leadSource?: string;
  status?: string;
  rating?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface Account {
  id: string;
  accountName: string;
  accountRating?: string;
  accountOwner?: string;
  status?: string;
  industry?: string;
  revenue?: string;
  numberOfEmployees?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipPostCode?: string;
  timeZone?: string;
  boardNumber?: string;
  website?: string;
  geo?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  associatedAccount?: string;
  emailAddress?: string;
  deskPhone?: string;
  mobilePhone?: string;
  city?: string;
  state?: string;
  country?: string;
  timeZone?: string;
  source?: "Data Research" | "Referral" | "Event";
  owner?: string;
  ownerId?: string;
  status?: "Suspect" | "Prospect" | "Active Deal" | "Do Not Call";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface ActiveDeal {
  id: string;
  dealName: string;
  dealOwner?: string;
  businessLine?: string;
  associatedAccount?: string;
  associatedContact?: string;
  closingDate?: string;
  probability?: string;
  dealValue?: string;
  approvedBy?: string;
  description?: string;
  nextStep?: string;
  geo?: string;
  entity?: string;
  stage?: string;
  owner?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface CRMContextType {
  // Data
  leads: Lead[];
  accounts: Account[];
  contacts: Contact[];
  deals: ActiveDeal[];
  loading: boolean;
  error: string | null;

  // Lead operations
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;

  // Account operations
  addAccount: (account: Omit<Account, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Contact operations
  addContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Deal operations
  addDeal: (deal: Omit<ActiveDeal, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => Promise<void>;
  updateDeal: (id: string, updates: Partial<ActiveDeal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;

  // Refresh operations
  refreshData: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const initTime = new Date().toISOString();
  console.log("🏗️ CRMProvider initializing at:", initTime);

  // Track provider recreations
  (window as any).crmProviderInitTime = initTime;

  // Initialize state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<ActiveDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Fetching data from backend...");
      
      const [leadsRes, accountsRes, contactsRes, dealsRes] = await Promise.all([
        api.leads.getAll({ limit: 100 }),
        api.accounts.getAll({ limit: 100 }),
        api.contacts.getAll({ limit: 100 }),
        api.deals.getAll({ limit: 100 })
      ]);

      console.log("✅ Data fetched successfully:", {
        leads: leadsRes.data?.length || 0,
        accounts: accountsRes.data?.length || 0,
        contacts: contactsRes.data?.length || 0,
        deals: dealsRes.data?.length || 0
      });

      setLeads(leadsRes.data || []);
      setAccounts(accountsRes.data || []);
      setContacts(contactsRes.data || []);
      setDeals(dealsRes.data || []);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Lead operations
  const addLead = async (leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => {
    try {
      setError(null);
      const response = await api.leads.create(leadData);
      if (response.success && response.data) {
        setLeads(prev => [...prev, response.data]);
        console.log("Lead added:", response.data);
      }
    } catch (err) {
      console.error("Error adding lead:", err);
      setError(err instanceof Error ? err.message : "Failed to add lead");
      throw err;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      setError(null);
      const response = await api.leads.update(id, updates);
      if (response.success && response.data) {
        setLeads(prev => prev.map(lead => lead.id === id ? response.data : lead));
        console.log("Lead updated:", id, updates);
      }
    } catch (err) {
      console.error("Error updating lead:", err);
      setError(err instanceof Error ? err.message : "Failed to update lead");
      throw err;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      setError(null);
      await api.leads.delete(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      console.log("Lead deleted:", id);
    } catch (err) {
      console.error("Error deleting lead:", err);
      setError(err instanceof Error ? err.message : "Failed to delete lead");
      throw err;
    }
  };

  // Account operations
  const addAccount = async (accountData: Omit<Account, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => {
    try {
      setError(null);
      const response = await api.accounts.create(accountData);
      if (response.success && response.data) {
        setAccounts(prev => [...prev, response.data]);
        console.log("Account added:", response.data);
      }
    } catch (err) {
      console.error("Error adding account:", err);
      setError(err instanceof Error ? err.message : "Failed to add account");
      throw err;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      setError(null);
      const response = await api.accounts.update(id, updates);
      if (response.success && response.data) {
        setAccounts(prev => prev.map(account => account.id === id ? response.data : account));
        console.log("Account updated:", id, updates);
      }
    } catch (err) {
      console.error("Error updating account:", err);
      setError(err instanceof Error ? err.message : "Failed to update account");
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      setError(null);
      await api.accounts.delete(id);
      setAccounts(prev => prev.filter(account => account.id !== id));
      console.log("Account deleted:", id);
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err instanceof Error ? err.message : "Failed to delete account");
      throw err;
    }
  };

  // Contact operations
  const addContact = async (contactData: Omit<Contact, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => {
    try {
      setError(null);
      const response = await api.contacts.create(contactData);
      if (response.success && response.data) {
        setContacts(prev => [...prev, response.data]);
        console.log("Contact added:", response.data);
      }
    } catch (err) {
      console.error("Error adding contact:", err);
      setError(err instanceof Error ? err.message : "Failed to add contact");
      throw err;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      setError(null);
      const response = await api.contacts.update(id, updates);
      if (response.success && response.data) {
        setContacts(prev => prev.map(contact => contact.id === id ? response.data : contact));
        console.log("Contact updated:", id, updates);
      }
    } catch (err) {
      console.error("Error updating contact:", err);
      setError(err instanceof Error ? err.message : "Failed to update contact");
      throw err;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setError(null);
      await api.contacts.delete(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      console.log("Contact deleted:", id);
    } catch (err) {
      console.error("Error deleting contact:", err);
      setError(err instanceof Error ? err.message : "Failed to delete contact");
      throw err;
    }
  };

  // Deal operations
  const addDeal = async (dealData: Omit<ActiveDeal, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => {
    try {
      setError(null);
      const response = await api.deals.create(dealData);
      if (response.success && response.data) {
        setDeals(prev => [...prev, response.data]);
        console.log("Deal added:", response.data);
      }
    } catch (err) {
      console.error("Error adding deal:", err);
      setError(err instanceof Error ? err.message : "Failed to add deal");
      throw err;
    }
  };

  const updateDeal = async (id: string, updates: Partial<ActiveDeal>) => {
    try {
      setError(null);
      const response = await api.deals.update(id, updates);
      if (response.success && response.data) {
        setDeals(prev => prev.map(deal => deal.id === id ? response.data : deal));
        console.log("Deal updated:", id, updates);
      }
    } catch (err) {
      console.error("Error updating deal:", err);
      setError(err instanceof Error ? err.message : "Failed to update deal");
      throw err;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      setError(null);
      await api.deals.delete(id);
      setDeals(prev => prev.filter(deal => deal.id !== id));
      console.log("Deal deleted:", id);
    } catch (err) {
      console.error("Error deleting deal:", err);
      setError(err instanceof Error ? err.message : "Failed to delete deal");
      throw err;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchData();
  };

  // Debug function to check current state (useful for debugging)
  useEffect(() => {
    (window as any).debugCRM = () => {
      console.log("🔍 Current CRM state:");
      console.log("Leads:", leads.length);
      console.log("Accounts:", accounts.length);
      console.log("Contacts:", contacts.length);
      console.log("Deals:", deals.length);
      console.log("Loading:", loading);
      console.log("Error:", error);

      // Show detailed contacts data
      console.log(
        "📋 Current contacts details:",
        contacts.map((c) => `${c.firstName} ${c.lastName} (${c.id})`),
      );
    };

    // Add a function to refresh data manually
    (window as any).refreshCRMData = () => {
      console.log("🔄 Manually refreshing CRM data...");
      fetchData();
    };
  }, [leads, accounts, contacts, deals, loading, error]);

  const value: CRMContextType = {
    leads,
    accounts,
    contacts,
    deals,
    loading,
    error,
    addLead,
    updateLead,
    deleteLead,
    addAccount,
    updateAccount,
    deleteAccount,
    addContact,
    updateContact,
    deleteContact,
    addDeal,
    updateDeal,
    deleteDeal,
    refreshData,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
}

// Export types for use in components
export type { Lead, Account, Contact, ActiveDeal };

