import React, { useState } from 'react';
import { useContractOperations } from '@/hooks/useContractOperations';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

const DeveloperRegistration = () => {
  const { address, isConnected } = useAccount();
  const { registerDeveloper } = useContractOperations();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    console.log('🏗️ Starting developer registration with:', {
      isConnected,
      address
    });
    
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsRegistering(true);

    try {
      console.log('📝 Calling registerDeveloper function...');
      const tx = await registerDeveloper();
      console.log('✅ Registration successful:', tx);
      toast.success('Developer registration transaction sent!');
    } catch (err) {
      console.error('❌ Developer registration failed:', err);
      toast.error(`Failed to register: ${err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div>
      <h3>Register as a Developer</h3>
      <button onClick={handleRegister} disabled={isRegistering}>
        {isRegistering ? 'Registering...' : 'Register Developer'}
      </button>
    </div>
  );
};

export default DeveloperRegistration;

