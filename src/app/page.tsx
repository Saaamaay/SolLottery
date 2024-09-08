'use client';

import { Web3Provider } from './Web3Context';
import MetaMaskConnect from './MetaMaskConnect';
import LotteryContent from './LotteryContent';

export default function Home() {
  return (
    <Web3Provider>
      <main className="min-h-screen bg-white text-black">
        <header className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold">ꓭꓭ</span>
            <nav>
              <ul className="flex space-x-4">
                <li>Other</li>
                <li>Solutions</li>
                <li>and</li>
                <li>things</li>
                <li>eventually</li>
                <li>Contact</li>
              </ul>
            </nav>
          </div>
          <MetaMaskConnect />
        </header>
        <div className="p-4">
          <LotteryContent />
        </div>
      </main>
    </Web3Provider>
  );
}