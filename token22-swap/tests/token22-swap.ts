import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Token22Swap } from "../target/types/token22_swap";
import { WhitelistHook } from "../target/types/whitelist_hook";
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    createInitializeTransferHookInstruction,
} from "@solana/spl-token-2022";
import { expect } from "chai";

describe("token22-swap", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const swapProgram = anchor.workspace.Token22Swap as Program<Token22Swap>;
    const hookProgram = anchor.workspace.WhitelistHook as Program<WhitelistHook>;

    let mintA: anchor.web3.PublicKey;
    let mintB: anchor.web3.PublicKey;
    let userTokenA: anchor.web3.PublicKey;
    let userTokenB: anchor.web3.PublicKey;
    let configPda: anchor.web3.PublicKey;
    let poolPda: anchor.web3.PublicKey;

    before(async () => {
        // Initialize config
        [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            swapProgram.programId
        );

        await swapProgram.methods
            .initializeConfig(new anchor.BN(25)) // 0.25% fee
            .accounts({
                config: configPda,
                admin: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        // Initialize whitelist hook
        const [whitelistPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("whitelist")],
            hookProgram.programId
        );

        await hookProgram.methods
            .initializeWhitelist()
            .accounts({
                whitelist: whitelistPda,
                admin: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        // Add hook to whitelist
        await swapProgram.methods
            .addHookToWhitelist(hookProgram.programId)
            .accounts({
                config: configPda,
                admin: provider.wallet.publicKey,
            })
            .rpc();

        // Create Token-2022 mints with transfer hooks
        mintA = await createTokenWithHook(hookProgram.programId);
        mintB = await createTokenWithHook(hookProgram.programId);

        // Create user token accounts
        userTokenA = await createAssociatedTokenAccount(
            provider.connection,
            provider.wallet.payer,
            mintA,
            provider.wallet.publicKey,
            {},
            TOKEN_2022_PROGRAM_ID
        );

        userTokenB = await createAssociatedTokenAccount(
            provider.connection,
            provider.wallet.payer,
            mintB,
            provider.wallet.publicKey,
            {},
            TOKEN_2022_PROGRAM_ID
        );

        // Mint tokens to user
        await mintTo(
            provider.connection,
            provider.wallet.payer,
            mintA,
            userTokenA,
            provider.wallet.publicKey,
            1000000000, // 1000 tokens
            [],
            {},
            TOKEN_2022_PROGRAM_ID
        );

        await mintTo(
            provider.connection,
            provider.wallet.payer,
            mintB,
            userTokenB,
            provider.wallet.publicKey,
            1000000000, // 1000 tokens
            [],
            {},
            TOKEN_2022_PROGRAM_ID
        );
    });

    it("Creates a liquidity pool", async () => {
        [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
            swapProgram.programId
        );

        await swapProgram.methods
            .initializePool(new anchor.BN(1000000))
            .accounts({
                pool: poolPda,
                mintA,
                mintB,
                config: configPda,
                payer: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
            })
            .rpc();

        const pool = await swapProgram.account.pool.fetch(poolPda);
        expect(pool.mintA.toString()).to.equal(mintA.toString());
        expect(pool.mintB.toString()).to.equal(mintB.toString());
    });

    it("Adds liquidity to pool", async () => {
        // Implementation for add liquidity test
        // ... detailed test code
    });

    it("Executes swaps with hook validation", async () => {
        // Implementation for swap test
        // ... detailed test code
    });

    async function createTokenWithHook(hookProgramId: anchor.web3.PublicKey) {
        const mint = anchor.web3.Keypair.generate();
        const extensions = [ExtensionType.TransferHook];
        const mintLen = getMintLen(extensions);
        const lamports = await provider.connection.getMinimumBalanceForRentExemption(mintLen);

        const transaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: provider.wallet.publicKey,
                newAccountPubkey: mint.publicKey,
                space: mintLen,
                lamports,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeTransferHookInstruction(
                mint.publicKey,
                provider.wallet.publicKey,
                hookProgramId,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeMintInstruction(
                mint.publicKey,
                6,
                provider.wallet.publicKey,
                null,
                TOKEN_2022_PROGRAM_ID
            )
        );

        await provider.sendAndConfirm(transaction, [mint]);
        return mint.publicKey;
    }
});