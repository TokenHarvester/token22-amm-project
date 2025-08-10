import React from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import TokenCreator from './components/TokenCreator';
import PoolManager from './components/PoolManager';
import SwapInterface from './components/SwapInterface';
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];

function App() {
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="App">
                        <header className="App-header">
                            <h1>Token-2022 AMM</h1>
                            <WalletMultiButton />
                        </header>
                        <main>
                            <div className="container">
                                <TokenCreator />
                                <PoolManager />
                                <SwapInterface />
                            </div>
                        </main>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;