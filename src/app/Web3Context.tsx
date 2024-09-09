import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import Web3 from 'web3';
import contractABI from './abi.json';
import { AbiItem } from 'web3-utils';

// Update contract type
import { Contract } from 'web3-eth-contract';

// Add this line to properly type the contractABI
const typedContractABI: AbiItem[] = contractABI as AbiItem[];

const CONTRACT_ADDRESS = '0x24227b3b64f7fa53869265d01863e67f91c5e5c0'; 

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  contract: Contract<AbiItem[]> | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract<AbiItem[]> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        const contractInstance = new web3Instance.eth.Contract(typedContractABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to connect to MetaMask', err);
      }
    } else {
      console.error('MetaMask not detected');
    }
  };

  const disconnect = () => {
    setWeb3(null);
    setAccount(null);
    setContract(null);
    setIsConnected(false);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          await connect();
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <Web3Context.Provider value={{ web3, account, contract, isConnected, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};