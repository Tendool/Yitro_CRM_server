import React from 'react';
import { useCRM } from '../contexts/CRMContext';
import { AccountCard } from './AccountCard';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface AccountsGridProps {
  onAccountClick: (id: number) => void;
  onNewAccount?: () => void;
}

export function AccountsGrid({ onAccountClick, onNewAccount }: AccountsGridProps) {
  const { accounts } = useCRM();

  if (accounts.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accounts Yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first account.</p>
            {onNewAccount && (
              <Button onClick={onNewAccount} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Account
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
            <p className="text-gray-600">{accounts.length} total accounts</p>
          </div>
          {onNewAccount && (
            <Button onClick={onNewAccount} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              id={account.id}
              name={account.name || account.accountName || 'Unnamed Account'}
              industry={account.industry}
              type={account.type}
              revenue={account.revenue}
              rating={account.rating}
              onClick={onAccountClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage Example Component
export function AccountsPage() {
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [showNewAccountDialog, setShowNewAccountDialog] = React.useState(false);

  const handleAccountClick = (id: number) => {
    setSelectedAccountId(id);
    // Navigate to account detail or open modal
    console.log('Selected account:', id);
  };

  const handleNewAccount = () => {
    setShowNewAccountDialog(true);
    // Open new account dialog
    console.log('Create new account');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountsGrid 
        onAccountClick={handleAccountClick}
        onNewAccount={handleNewAccount}
      />
    </div>
  );
}