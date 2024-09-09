'use client';

import { useState, useEffect, useCallback } from 'react'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { AbiItem } from 'web3-utils';

import contractABI from "./abi.json";


const contractAddress = "0x24227b3b64f7fa53869265d01863e67f91c5e5c0";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; // Change `any` in `params` to `unknown` if the params vary.
  on?: (event: string, handler: (...args: unknown[]) => void) => void; // Change `any` to `unknown`
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void; // Change `any` to `unknown`
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
  }
}

const MetaMaskConnect: React.FC<{ showFullContent?: boolean }> = ({ showFullContent }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [contract, setContract] = useState<Contract<AbiItem[]> | null>(null); // Change to AbiItem[]
  const [winner, setWinner] = useState<string | null>(null)
  const [player1, setPlayer1] = useState<string>('No deposit yet')
  const [player2, setPlayer2] = useState<string>('No deposit yet')
  const [isConnected, setIsConnected] = useState(false)
  const [contractBalance, setContractBalance] = useState<string>('0');
  

  useEffect(() => {
    // Check if already connected when component mounts
    checkConnection();
  }, []);

  async function checkConnection() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          setAccount(accounts[0]);
          setIsConnected(true);
          setError('');
        }
      } catch (ex) {
        console.error(ex);
      }
    }
  }

  async function connect() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        const contractInstance = new web3Instance.eth.Contract(contractABI as AbiItem[], contractAddress); // Change to AbiItem[]
        setContract(contractInstance);
        updateContractBalance();
        setIsConnected(true);
        setError('');
      } catch (ex) {
        console.error(ex);
        setError('Failed to connect to MetaMask');
      }
    } else {
      setError('Please install MetaMask!');
    }
  }

  async function disconnect() {
    setWeb3(null)
    setAccount(null)
    setBalance('')
    setContract(null)
    setWinner(null)
    setIsConnected(false)
  }

  async function deposit() {
    if (!web3 || !account || !contract) {
      setError('Please connect to MetaMask first');
      return;
    }
    try {
      const depositAmount = web3.utils.toWei('0.001', 'ether');
      console.log("Attempting deposit of", depositAmount, "wei");
      const result = await contract.methods.deposit().send({ from: account, value: depositAmount });
      console.log("Deposit result:", result);
      checkWinner();
      updatePlayerStatus();
      await updateContractBalance();
    } catch (ex: unknown) { // Change `any` to `unknown`
      const error = ex as Error; // Type assertion
      console.error("Deposit error:", error);
      setError('Failed to deposit: ' + (error.message || 'Unknown error'));
    }
  }

  useEffect(() => {
    if (web3) {
      const contractInstance = new web3.eth.Contract(contractABI as AbiItem[], contractAddress); // Change to AbiItem[]
      setContract(contractInstance);
    }
  }, [web3]);

  async function withdrawWinnings() {
    if (!web3 || !account || !contract) {
      setError('Please connect to MetaMask first');
      return;
    }
    try {
      const gasEstimate = await contract.methods.withdraw().estimateGas({ from: account });
      const result = await contract.methods.withdraw().send({ from: account, gas: gasEstimate.toString() });
      console.log("Withdrawal result:", result);
      await updateLotteryStatus(); // Ensure this is called only once
    } catch (ex: unknown) { // Change `any` to `unknown`
      const error = ex as Error; // Type assertion
      console.error("Withdrawal error:", error);
      setError('Failed to withdraw: ' + (error.message || 'Unknown error'));
    }
  }

  const updateLotteryStatus = async () => {
    if (!contract) return;
    try {
      const [firstDepositor, secondDepositor, winnerAddress, balance] = await Promise.all([
        contract.methods.firstDepositor().call() as Promise<string>,
        contract.methods.secondDepositor().call() as Promise<string>,
        contract.methods.winnerName().call() as Promise<string>,
        contract.methods.getBalance().call() as Promise<string>,
      ]);

      setPlayer1(firstDepositor !== '0x0000000000000000000000000000000000000000' ? 'Deposited' : 'No deposit yet');
      setPlayer2(secondDepositor !== '0x0000000000000000000000000000000000000000' ? 'Deposited' : 'No deposit yet');
      setWinner(winnerAddress !== '0x0000000000000000000000000000000000000000' ? `${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}` : 'Not determined yet');
      setContractBalance(web3?.utils.fromWei(balance, 'ether') || '0');
    } catch (err) {
      console.error('Error updating lottery status:', err);
      setError('Failed to update lottery status');
    }
  };

  useEffect(() => {
    if (web3 && account) {
      web3.eth.getBalance(account).then((balance) => {
        setBalance(Web3.utils.fromWei(balance, 'ether'))
      })
    }
  }, [web3, account])

  const checkWinner = useCallback(async () => {
    if (!contract) return;
    try {
      const winnerAddress = await contract.methods.winnerName().call() as string;
      setWinner(winnerAddress !== '0x0000000000000000000000000000000000000000' ? `${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}` : 'Not determined yet');
    } catch (err) {
      console.error('Error checking winner:', err);
      setError('Failed to check winner');
    }
  }, [contract]);

  const updatePlayerStatus = useCallback(async () => {
    if (!contract) return;
    try {
      const firstDepositor = await contract.methods.firstDepositor().call() as string;
      const secondDepositor = await contract.methods.secondDepositor().call() as string;
      setPlayer1(firstDepositor !== '0x0000000000000000000000000000000000000000' ? 'Deposited' : 'No deposit yet');
      setPlayer2(secondDepositor !== '0x0000000000000000000000000000000000000000' ? 'Deposited' : 'No deposit yet');
    } catch (ex: unknown) { // Change `any` to `unknown`
      const error = ex as Error; // Type assertion
      console.error(error);
    }
  }, [contract]);

  const updateContractBalance = useCallback(async () => {
    if (contract) {
      try {
        const balance = await contract.methods.getBalance().call() as string;
        setContractBalance(web3?.utils.fromWei(balance, 'ether') || '0');
      } catch (ex: unknown) { // Change `any` to `unknown`
        const error = ex as Error; // Type assertion
        console.error("Error fetching contract balance:", error);
      }
    }
  }, [contract, web3]);
  

  useEffect(() => {
    if (contract) {
      checkWinner();
      updatePlayerStatus();
      updateContractBalance();
    }
  }, [contract, checkWinner, updateContractBalance, updatePlayerStatus]);



  return (
    <div className="max-w-4xl mx-auto px-4">
      {showFullContent ? (
        <>
          <h1 className="text-4xl font-bold mb-4">Sam's Sepolia Lottery</h1>
          <p className="text-xl mb-6">Deposit to win!</p>
          
          <div className="flex gap-4 mb-8">
            <button onClick={deposit} className="bg-gray-200 text-black px-4 py-2 rounded">Deposit</button>
            <button onClick={withdrawWinnings} className="bg-gray-800 text-white px-4 py-2 rounded">Withdraw</button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Lottery Updates</h2>
            <p className="text-gray-600 mb-4">Lottery News</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Player 1</h3>
                <p>{player1}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Player 2</h3>
                <p>{player2}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Winner is...</h3>
                <p>{winner || 'Not determined yet'}</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Lottery Pool</h3>
              <p>{contractBalance} ETH</p>
            </div>
          </div>
        </>
      ) : null}

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {isConnected ? (
        <div>
          <p>Connected with {account?.slice(0, 6)}...{account?.slice(-4)}</p>
          <p>Balance: {balance} ETH</p>
          <button onClick={disconnect} className="bg-red-500 text-white px-4 py-2 rounded mt-2">Disconnect</button>
        </div>
      ) : (
        <button onClick={connect} className="bg-blue-500 text-white px-4 py-2 rounded">Connect to MetaMask</button>
      )}
    </div>
  )
}

export default MetaMaskConnect