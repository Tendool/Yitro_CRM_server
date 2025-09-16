import { useEffect } from 'react';

/**
 * Hook to clear CRM-related localStorage data to ensure clean migration to API-based storage
 * Note: This only clears old localStorage keys, not the new persistent mock API storage
 */
export function useClearLocalStorage() {
  useEffect(() => {
    // Clear CRM localStorage data on app initialization
    const keysToRemove = [
      'crm-leads',
      'crm-accounts', 
      'crm-contacts',
      'crm-deals'
    ];

    let hasOldData = false;
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        hasOldData = true;
        localStorage.removeItem(key);
        console.log(`🧹 Cleared old localStorage data: ${key}`);
      }
    });

    if (hasOldData) {
      console.log('🔄 Migrated from localStorage to database storage');
    }
  }, []);
}

