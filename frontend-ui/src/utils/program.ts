import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
// Remove incorrect import
import { PublicKey } from '@solana/web3.js';
import { SWAP_PROGRAM_ID } from './constants';

// Simplified IDL - you'll need to replace this with your actual IDL
const IDL = {
    version: "0.1.0",
    name: "token22_swap",
    instructions: [
        {
            name: "initializePool",
            accounts: [
                { name: "pool", isMut: true, isSigner: false },
                { name: "mintA", isMut: false, isSigner: false },
                { name: "mintB", isMut: false, isSigner: false },
                { name: "payer", isMut: true, isSigner: true },
            ],
            args: [
                { name: "initialPrice", type: "u64" }
            ]
        },
        {
            name: "swap",
            accounts: [
                { name: "pool", isMut: true, isSigner: false },
                { name: "user", isMut: true, isSigner: true },
            ],
            args: [
                { name: "amountIn", type: "u64" },
                { name: "minimumAmountOut", type: "u64" },
                { name: "aToB", type: "bool" }
            ]
        }
    ],
    accounts: [
        {
            name: "Pool",
            type: {
                kind: "struct",
                fields: [
                    { name: "mintA", type: "publicKey" },
                    { name: "mintB", type: "publicKey" },
                    { name: "reserveA", type: "u64" },
                    { name: "reserveB", type: "u64" },
                ]
            }
        }
    ]
} as Idl;

export const getProgram = (connection: web3.Connection, wallet: any): Program => {
    const provider = new AnchorProvider(connection, wallet, {});
    return new Program(IDL, SWAP_PROGRAM_ID, provider);
};

export const getPoolPDA = (mintA: PublicKey, mintB: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
        SWAP_PROGRAM_ID
    );
};

export const getConfigPDA = (): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        SWAP_PROGRAM_ID
    );
};