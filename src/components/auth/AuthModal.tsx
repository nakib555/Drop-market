import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AccountDirectoryEntry } from '../../types/commerce';
import { t } from '../../utils/i18n';
import { Modal } from '../ui/Primitives';
import { AuthPanel } from './AuthPanel';

export const AuthModal: React.FC = () => {
  const { language, authModalOpen, setAuthModalOpen, authModalTab, navigate } = useStore();

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
      title={t(language, 'authModalTitle')}
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
