import {
    PublicKey,
    SystemProgram,
    Transaction,
    Connection,
    Keypair,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction,
    getMint,
    getAccount,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from './constants';
import { Buffer } from 'buffer';

// Helper to get minimum balance for rent exemption
export const getMintLen = (extensions: any[] = []): number => {
    return 82; // Base mint size for Token-2022
};

// Create associated token account
export const createAssociatedTokenAccount = async (
    connection: Connection,
    payer: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    programId: PublicKey = TOKEN_2022_PROGRAM_ID
): Promise<PublicKey> => {
    const associatedTokenAddress = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return associatedTokenAddress;
};

// Get associated token address
export const getAssociatedTokenAddressSync = (
    mint: PublicKey,
    owner: PublicKey,
    programId: PublicKey = TOKEN_2022_PROGRAM_ID
): PublicKey => {
    return PublicKey.findProgramAddressSync(
        [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
};

// Create transfer hook instruction (simplified)
export const createInitializeTransferHookInstruction = (
    mint: PublicKey,
    authority: PublicKey,
    hookProgramId: PublicKey,
    programId: PublicKey = TOKEN_2022_PROGRAM_ID
): TransactionInstruction => {
    // This is a simplified version - you might need to implement the actual instruction data
    const keys = [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: false },
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data: Buffer.alloc(0), // You'll need to implement proper instruction data
    });
};