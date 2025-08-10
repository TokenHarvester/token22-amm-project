import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, HOOK_PROGRAM_ID } from '../utils/constants';
import {
    getMintLen,
    createInitializeTransferHookInstruction,
} from '../utils/token22Utils';

const TokenCreator: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [isCreating, setIsCreating] = useState(false);
    const [tokenMint, setTokenMint] = useState<string>('');
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');

    const createTokenWithHook = async () => {
        if (!publicKey) {
            alert('Please connect your wallet');
            return;
        }

        setIsCreating(true);
        try {
            const mint = Keypair.generate();
            const mintLen = getMintLen(); // Token-2022 base size
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mint.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeTransferHookInstruction(
                    mint.publicKey,
                    publicKey,
                    HOOK_PROGRAM_ID,
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeMintInstruction(
                    mint.publicKey,
                    6, // decimals
                    publicKey,
                    null,
                    TOKEN_2022_PROGRAM_ID
                )
            );

            const signature = await sendTransaction(transaction, connection, {
                signers: [mint],
            });

            await connection.confirmTransaction(signature, 'confirmed');
            setTokenMint(mint.publicKey.toString());
            
            console.log('Token created successfully:', mint.publicKey.toString());
            console.log('Transaction signature:', signature);
        } catch (error) {
            console.error('Error creating token:', error);
            alert(`Error creating token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="token-creator" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px' }}>
            <h2>Create Token-2022 with Transfer Hook</h2>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Token Name"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    style={{ marginRight: '10px', padding: '8px' }}
                />
                <input
                    type="text"
                    placeholder="Token Symbol"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    style={{ marginRight: '10px', padding: '8px' }}
                />
            </div>
            <button
                onClick={createTokenWithHook}
                disabled={!publicKey || isCreating}
                style={{
                    padding: '10px 20px',
                    backgroundColor: publicKey ? '#4CAF50' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: publicKey ? 'pointer' : 'not-allowed'
                }}
            >
                {isCreating ? 'Creating Token...' : 'Create Token-2022'}
            </button>
            {tokenMint && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                    <p><strong>✅ Token Created Successfully!</strong></p>
                    <p><strong>Mint Address:</strong> {tokenMint}</p>
                    <p><strong>Name:</strong> {tokenName || 'N/A'}</p>
                    <p><strong>Symbol:</strong> {tokenSymbol || 'N/A'}</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                        Copy the mint address to use in pool creation
                    </p>
                </div>
            )}
        </div>
    );
};

export default TokenCreator;