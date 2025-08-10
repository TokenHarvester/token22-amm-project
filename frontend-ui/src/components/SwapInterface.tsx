import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { getProgram, getPoolPDA, getConfigPDA } from '../utils/program';
import { TOKEN_2022_PROGRAM_ID, SWAP_PROGRAM_ID } from '../utils/constants';

const SwapInterface: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signTransaction } = useWallet();
    const [tokenA, setTokenA] = useState('');
    const [tokenB, setTokenB] = useState('');
    const [amountIn, setAmountIn] = useState('');
    const [minAmountOut, setMinAmountOut] = useState('');
    const [isSwapping, setIsSwapping] = useState(false);
    const [swapResult, setSwapResult] = useState('');

    const executeSwap = async () => {
        if (!publicKey || !tokenA || !tokenB || !amountIn) {
            alert('Please fill in all required fields and connect your wallet');
            return;
        }

        setIsSwapping(true);
        setSwapResult('');
        
        try {
            // Create wallet object for AnchorProvider
            const wallet = {
                publicKey,
                signTransaction,
                signAllTransactions: async (txs: any[]) => {
                    if (signTransaction) {
                        return Promise.all(txs.map(tx => signTransaction(tx)));
                    }
                    throw new Error('Wallet not connected');
                }
            };

            // Get program instance using our utility function
            const program = getProgram(connection, wallet);

            const mintA = new PublicKey(tokenA);
            const mintB = new PublicKey(tokenB);

            // Get pool PDA
            const [poolPda] = getPoolPDA(mintA, mintB);
            const [configPda] = getConfigPDA();

            console.log('Executing swap with:');
            console.log('Pool PDA:', poolPda.toString());
            console.log('Token A:', mintA.toString());
            console.log('Token B:', mintB.toString());
            console.log('Amount In:', amountIn);
            console.log('Min Amount Out:', minAmountOut || '0');

            // For now, we'll simulate the swap since the full program might not be deployed yet
            // Replace this with actual program call once your programs are deployed
            
            /* 
            // Actual program call (uncomment when programs are deployed):
            const signature = await program.methods
                .swap(
                    new BN(parseFloat(amountIn) * 1e6), // Convert to smallest unit (6 decimals)
                    new BN(parseFloat(minAmountOut || '0') * 1e6),
                    true // a_to_b - you might want to make this configurable
                )
                .accounts({
                    pool: poolPda,
                    mintA,
                    mintB,
                    poolTokenA: poolTokenAPda, // You'll need to calculate this
                    poolTokenB: poolTokenBPda, // You'll need to calculate this
                    userTokenA: userTokenAPda, // You'll need to calculate this
                    userTokenB: userTokenBPda, // You'll need to calculate this
                    config: configPda,
                    user: publicKey,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .rpc();

            console.log('Swap executed successfully:', signature);
            setSwapResult(`Swap successful! Transaction: ${signature}`);
            */

            // Simulation for testing frontend functionality
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
            const mockSignature = 'MockTransaction' + Math.random().toString(36).substring(7);
            console.log('Swap simulation completed:', mockSignature);
            setSwapResult(`Swap simulation successful! Mock TX: ${mockSignature}`);

        } catch (error) {
            console.error('Error executing swap:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error executing swap: ${errorMessage}`);
            setSwapResult(`Swap failed: ${errorMessage}`);
        } finally {
            setIsSwapping(false);
        }
    };

    const validateAddress = (address: string): boolean => {
        try {
            new PublicKey(address);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div 
            className="swap-interface" 
            style={{ 
                padding: '20px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                margin: '20px',
                maxWidth: '500px'
            }}
        >
            <h2>Swap Tokens</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Token A (From):
                    </label>
                    <input
                        type="text"
                        placeholder="Token A Mint Address"
                        value={tokenA}
                        onChange={(e) => setTokenA(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: `1px solid ${tokenA && !validateAddress(tokenA) ? 'red' : '#ccc'}`
                        }}
                    />
                    {tokenA && !validateAddress(tokenA) && (
                        <small style={{ color: 'red' }}>Invalid address format</small>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Token B (To):
                    </label>
                    <input
                        type="text"
                        placeholder="Token B Mint Address"
                        value={tokenB}
                        onChange={(e) => setTokenB(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: `1px solid ${tokenB && !validateAddress(tokenB) ? 'red' : '#ccc'}`
                        }}
                    />
                    {tokenB && !validateAddress(tokenB) && (
                        <small style={{ color: 'red' }}>Invalid address format</small>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Amount In:
                    </label>
                    <input
                        type="number"
                        placeholder="Amount to swap"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                        min="0"
                        step="0.000001"
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Minimum Amount Out (Optional):
                    </label>
                    <input
                        type="number"
                        placeholder="Minimum amount to receive"
                        value={minAmountOut}
                        onChange={(e) => setMinAmountOut(e.target.value)}
                        min="0"
                        step="0.000001"
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                    <small style={{ color: '#666' }}>
                        Leave empty for no slippage protection
                    </small>
                </div>

                <button
                    onClick={executeSwap}
                    disabled={
                        !publicKey || 
                        !tokenA || 
                        !tokenB || 
                        !amountIn || 
                        isSwapping ||
                        !validateAddress(tokenA) ||
                        !validateAddress(tokenB) ||
                        parseFloat(amountIn) <= 0
                    }
                    style={{
                        padding: '12px 20px',
                        backgroundColor: (
                            publicKey && 
                            tokenA && 
                            tokenB && 
                            amountIn && 
                            validateAddress(tokenA) &&
                            validateAddress(tokenB) &&
                            parseFloat(amountIn) > 0 &&
                            !isSwapping
                        ) ? '#4CAF50' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (
                            publicKey && 
                            tokenA && 
                            tokenB && 
                            amountIn && 
                            !isSwapping
                        ) ? 'pointer' : 'not-allowed',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    {isSwapping ? 'Swapping...' : 'Execute Swap'}
                </button>

                {!publicKey && (
                    <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffeaa7', 
                        borderRadius: '4px',
                        color: '#856404'
                    }}>
                        ⚠️ Please connect your wallet to execute swaps
                    </div>
                )}

                {swapResult && (
                    <div style={{ 
                        padding: '10px', 
                        backgroundColor: swapResult.includes('successful') ? '#d4edda' : '#f8d7da', 
                        border: `1px solid ${swapResult.includes('successful') ? '#c3e6cb' : '#f1b2b5'}`, 
                        borderRadius: '4px',
                        color: swapResult.includes('successful') ? '#155724' : '#721c24',
                        fontSize: '14px'
                    }}>
                        {swapResult}
                    </div>
                )}

                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    color: '#1565c0' 
                }}>
                    <strong>Note:</strong> This is currently running in simulation mode. 
                    Once your programs are deployed, uncomment the actual program call in the code.
                </div>
            </div>
        </div>
    );
};

export default SwapInterface;