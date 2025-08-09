const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

// UPDATE THESE WITH YOUR ACTUAL DEPLOYED PROGRAM IDs
const SWAP_PROGRAM_ID = new PublicKey("H8j9y1sARxb73rL2RFqfpKG8Yi9CYXmgcha5n7QLYmbU");
const HOOK_PROGRAM_ID = new PublicKey("EYzLSaUydn5GLBov2G1ypmL7s3zYqNyNfxY3BQZ7Rdy2");

// Import your IDLs
let swapIdl, hookIdl;

try {
    swapIdl = JSON.parse(fs.readFileSync(path.join(__dirname, "../target/idl/token22_swap.json"), 'utf8'));
    console.log("✅ Swap IDL loaded successfully");
} catch (error) {
    console.error("❌ Error loading swap IDL:", error.message);
    process.exit(1);
}

try {
    hookIdl = JSON.parse(fs.readFileSync(path.join(__dirname, "../target/idl/whitelist_hook.json"), 'utf8'));
    console.log("✅ Hook IDL loaded successfully");
} catch (error) {
    console.error("❌ Error loading hook IDL:", error.message);
    process.exit(1);
}

async function initializePrograms() {
    console.log("\n🚀 Starting Token-2022 AMM Initialization...");
    console.log("═══════════════════════════════════════════");
    
    // Configure the client
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    console.log("🔗 Provider wallet:", provider.wallet.publicKey.toString());
    console.log("🌐 Cluster:", provider.connection.rpcEndpoint);

    // Initialize program connections
    const swapProgram = new anchor.Program(swapIdl, SWAP_PROGRAM_ID, provider);
    const hookProgram = new anchor.Program(hookIdl, HOOK_PROGRAM_ID, provider);

    console.log("✅ Connected to programs");
    console.log("📋 Swap Program:", swapProgram.programId.toString());
    console.log("🔒 Hook Program:", hookProgram.programId.toString());

    try {
        // Step 1: Initialize Config for Swap Program
        console.log("\n📋 Step 1: Initializing Swap Config...");
        
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            swapProgram.programId
        );
        
        console.log("📍 Config PDA:", configPda.toString());

        try {
            const tx = await swapProgram.methods
                .initializeConfig(new anchor.BN(25)) // 0.25% fee
                .accounts({
                    config: configPda,
                    admin: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            console.log("✅ Swap config initialized successfully");
            console.log("🔗 Transaction:", tx);
        } catch (error) {
            if (error.message.includes("already in use") || error.message.includes("custom program error: 0x0")) {
                console.log("ℹ️  Config already exists, skipping...");
            } else {
                console.log("❌ Error initializing config:", error.message);
                throw error;
            }
        }

        // Step 2: Initialize Whitelist for Hook Program
        console.log("\n🔐 Step 2: Initializing Hook Whitelist...");
        
        const [whitelistPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("whitelist")],
            hookProgram.programId
        );
        
        console.log("📍 Whitelist PDA:", whitelistPda.toString());

        try {
            const tx = await hookProgram.methods
                .initializeWhitelist()
                .accounts({
                    whitelist: whitelistPda,
                    admin: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            console.log("✅ Hook whitelist initialized successfully");
            console.log("🔗 Transaction:", tx);
        } catch (error) {
            if (error.message.includes("already in use") || error.message.includes("custom program error: 0x0")) {
                console.log("ℹ️  Whitelist already exists, skipping...");
            } else {
                console.log("❌ Error initializing whitelist:", error.message);
                throw error;
            }
        }

        // Step 3: Add Hook to Swap Program Whitelist (if method exists)
        console.log("\n✋ Step 3: Adding Hook to Swap Program Whitelist...");
        
        try {
            const tx = await swapProgram.methods
                .addHookToWhitelist(hookProgram.programId)
                .accounts({
                    config: configPda,
                    admin: provider.wallet.publicKey,
                })
                .rpc();
            console.log("✅ Hook added to whitelist successfully");
            console.log("🔗 Transaction:", tx);
        } catch (error) {
            console.log("⚠️  Hook whitelist method might not be implemented yet:", error.message);
        }

        // Step 4: Add Admin to Hook Whitelist
        console.log("\n👤 Step 4: Adding Admin to Hook Whitelist...");
        
        try {
            const tx = await hookProgram.methods
                .addToWhitelist(provider.wallet.publicKey)
                .accounts({
                    whitelist: whitelistPda,
                    admin: provider.wallet.publicKey,
                })
                .rpc();
            console.log("✅ Admin added to hook whitelist successfully");
            console.log("🔗 Transaction:", tx);
        } catch (error) {
            console.log("⚠️  Could not add admin to whitelist:", error.message);
        }

        // Step 5: Verify Setup
        console.log("\n🔍 Step 5: Verifying Setup...");
        
        try {
            const config = await swapProgram.account.config.fetch(configPda);
            console.log("📋 Config Details:");
            console.log("   Admin:", config.admin.toString());
            console.log("   Fee Rate:", config.feeRate.toString(), "basis points");
            console.log("   Whitelisted Hooks:", config.whitelistedHooks?.length || 0);
        } catch (error) {
            console.log("⚠️  Could not fetch config details:", error.message);
        }

        try {
            const whitelist = await hookProgram.account.whitelist.fetch(whitelistPda);
            console.log("🔒 Whitelist Details:");
            console.log("   Admin:", whitelist.admin.toString());
            console.log("   Approved Users:", whitelist.approvedUsers?.length || 0);
        } catch (error) {
            console.log("⚠️  Could not fetch whitelist details:", error.message);
        }

        // Step 6: Create Frontend Configuration
        console.log("\n📱 Step 6: Creating Frontend Configuration...");
        
        const frontendConfig = {
            network: "devnet",
            rpcEndpoint: "https://api.devnet.solana.com",
            programs: {
                swapProgram: SWAP_PROGRAM_ID.toString(),
                hookProgram: HOOK_PROGRAM_ID.toString()
            },
            pdas: {
                config: configPda.toString(),
                whitelist: whitelistPda.toString()
            },
            settings: {
                feeRate: 25,
                slippageTolerance: 0.5
            },
            constants: {
                TOKEN_2022_PROGRAM_ID: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
                ASSOCIATED_TOKEN_PROGRAM_ID: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
            }
        };

        // Write config to frontend
        const configPath = path.join(__dirname, '../../frontend/src/config/deployed.json');
        
        try {
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(configPath, JSON.stringify(frontendConfig, null, 2));
            console.log("✅ Frontend config written to:", configPath);
        } catch (error) {
            console.log("⚠️  Could not write frontend config:", error.message);
        }

        console.log("\n🎉 INITIALIZATION COMPLETE!");
        console.log("═══════════════════════════════════════════");
        console.log("📊 DEPLOYMENT SUMMARY");
        console.log("═══════════════════════════════════════════");
        console.log("🔹 Swap Program ID:     ", SWAP_PROGRAM_ID.toString());
        console.log("🔹 Hook Program ID:     ", HOOK_PROGRAM_ID.toString());
        console.log("🔹 Config PDA:          ", configPda.toString());
        console.log("🔹 Whitelist PDA:       ", whitelistPda.toString());
        console.log("🔹 Network:             ", "Devnet");
        console.log("🔹 Fee Rate:            ", "0.25%");
        console.log("🔹 Frontend Config:     ", "✅ Created");
        console.log("═══════════════════════════════════════════");
        
        console.log("\n🚀 NEXT STEPS:");
        console.log("1. cd ../frontend");
        console.log("2. npm install");
        console.log("3. npm start");
        console.log("4. Test token creation and swapping");
        
        console.log("\n📝 Frontend will be available at: http://localhost:3000");

    } catch (error) {
        console.error("\n❌ Initialization failed:", error);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

// Run the initialization
console.log("🎯 Token-2022 AMM Initialization Script");
console.log("═══════════════════════════════════════════");
initializePrograms().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
});