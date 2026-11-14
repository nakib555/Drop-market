import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AccountDirectoryEntry } from '../../types/commerce';
import { Modal } from '../ui/Primitives';
import { AuthPanel } from './AuthPanel';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, authModalTab, navigate } = useStore();

  const handleSuccess = (user: AccountDirectoryEntry) => {
    setAuthModalOpen(false);
    if (user.role === 'admin') {
      navigate({ name: 'admin' });
    } else if (user.role === 'seller') {
      navigate({ name: 'seller' });
    } else {
      navigate({ name: 'account', accountTab: 'overview' });
    }
  };

  return (
    <Modal
      open={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      title="Marketplace Account & Role Access"
      maxWidthClass="max-w-4xl"
    >
      <AuthPanel
        key={`${authModalTab}-${authModalOpen}`}
        initialTab={authModalTab}
        compact
        onSuccess={handleSuccess}
        onOpenFullPage={() => {
          setAuthModalOpen(false);
          navigate({ name: 'login' });
        }}
      />
    </Modal>
  );
};
