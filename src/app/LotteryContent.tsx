import { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Context';

const LotteryContent: React.FC = () => {
  const { web3, account, contract } = useWeb3();
  const [player1, setPlayer1] = useState<string>('No deposit yet');
  const [player2, setPlayer2] = useState<string>('No deposit yet');
  const [winner, setWinner] = useState<string>('Not determined yet');
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (contract) {
      updateLotteryStatus();
    }
  }, [contract]);

  const updateLotteryStatus = async () => {
    try {
      const [firstDepositor, secondDepositor, winnerAddress, balance] = await Promise.all([
        contract.methods.firstDepositor().call(),
        contract.methods.secondDepositor().call(),
        contract.methods.winnerName().call(),
        contract.methods.getBalance().call(),
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

  const deposit = async () => {
    if (!contract || !account) {
      setError('Please connect to MetaMask first');
      return;
    }
    try {
      const depositAmount = await contract.methods.DEPOSIT_AMOUNT().call();
      await contract.methods.deposit().send({ from: account, value: depositAmount });
      await updateLotteryStatus(); // Ensure this is called only once
    } catch (err) {
      console.error('Error depositing:', err);
      setError('Failed to deposit');
    }
  };

  const withdrawWinnings = async () => {
    if (!contract || !account) {
      setError('Please connect to MetaMask first');
      return;
    }
    try {
      const gasEstimate = await contract.methods.withdraw().estimateGas({ from: account });
      await contract.methods.withdraw().send({ from: account, gas: gasEstimate });
      await updateLotteryStatus(); // Ensure this is called only once
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError('Failed to withdraw');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Sepolia Lottery</h1>
      <p className="text-xl mb-6">Deposit to win!</p>
      
      <div className="flex gap-4 mb-8">
        <button onClick={deposit} className="bg-gray-200 text-black px-4 py-2 rounded">Deposit</button>
        <button onClick={withdrawWinnings} className="bg-gray-800 text-white px-4 py-2 rounded">Withdraw</button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

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
            <p>{winner}</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Lottery Pool</h3>
          <p>{contractBalance} ETH</p>
        </div>
      </div>
    </div>
  );
};

export default LotteryContent;
