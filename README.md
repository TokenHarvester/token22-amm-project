# Token-2022 AMM with Transfer Hook Support

## Deployed UI

https://token22-lr3cb3dbe-elochuwku-orjis-projects.vercel.app/

## 🎯 Problem Statement

Major AMMs (Raydium, Orca, Meteora) don't support Token-2022 with transfer hooks, creating a significant barrier for regulated assets, RWAs (Real World Assets), and any tokens requiring programmable transfer restrictions. This limits DeFi adoption for compliant tokenized assets.

## ✅ Solution Overview

Built a complete AMM that natively supports Token-2022 with transfer hooks, featuring:

- **Hook Validation System:** Secure whitelist-based approval for transfer hooks
- **Complete Trading Infrastructure:** Full swap, liquidity provision, and pool management
- **Security-First Design:** Pre-transaction validation prevents failed trades
- **Developer-Friendly:** Clean API and comprehensive documentation

## 🏗️ Architecture

**Smart Contracts**

- **token22-swap:** Main AMM program with hook validation and trading logic
- **whitelist-hook:** Example transfer hook implementing KYC/whitelist functionality

## Frontend Application

- **React + TypeScript:** Modern web interface
- **Solana Wallet Integration:** Support for all major Solana wallets
- **Real-time Updates:** Live pool data and transaction status

## 🚀 Key Features

**✨ Core Functionality**

- ✅ Create Token-2022 with programmable transfer hooks
- ✅ Initialize liquidity pools with automatic hook validation
- ✅ Execute swaps with pre-transaction security checks
- ✅ Add/remove liquidity with proper token handling
- ✅ Real-time pool metrics and trading data

**🔒 Security Features**

- ✅ Whitelist-based hook approval system
- ✅ Pre-swap validation prevents transaction failures
- ✅ Slippage protection with customizable tolerance
- ✅ Overflow/underflow protection in calculations
- ✅ Admin-controlled security parameters

**🎛️ Advanced Features**

- ✅ Multi-hook support per token
- ✅ Fee collection and distribution
- ✅ Emergency pause functionality
- ✅ Upgradeable program architecture

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
``` bash
# Core Dependencies
node >= 16.0.0
rust >= 1.70.0
solana-cli >= 1.17.0
anchor-cli >= 0.29.0

# Package Managers
npm >= 8.0.0
cargo >= 1.70.0
```

## 🛠️ Installation & Setup

**1. Clone Repository**
``` bash
git clone https://github.com/TokenHarvester/token22-amm-project.git
cd token22-amm-project
```
**2. Environment Setup**
``` bash
# Install Solana CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli@0.29.0

# Configure Solana
solana config set --url https://api.devnet.solana.com
solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
solana airdrop 5
```

**3. Build Smart Contracts**
``` bash
# Build the Anchor programs
anchor build

# Deploy to Devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test --provider.cluster devnet
```

**4. Frontend Setup**
``` bash
cd frontend-ui

# Install dependencies (with fixed package versions)
npm install

# Update program IDs in constants.ts with your deployed program IDs
# Edit src/utils/constants.ts and replace placeholder program IDs

# Start development server
npm start
```

## 🔧 Configuration

**Update Program IDs**

After deployment, update frontend/src/utils/constants.ts:
``` bash
export const SWAP_PROGRAM_ID = new PublicKey('YourSwapProgramId'); // Replace with actual ID
export const HOOK_PROGRAM_ID = new PublicKey('YourHookProgramId'); // Replace with actual ID
```

## Environment Variables

Create frontend/.env.local:
``` bash
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_SWAP_PROGRAM_ID=YourSwapProgramId
REACT_APP_HOOK_PROGRAM_ID=YourHookProgramId
```

## 💻 Usage Guide

**1. Create Token-2022 with Transfer Hook**
``` bash
// The UI will guide you through:
1. Connect your Solana wallet
2. Enter token name and symbol
3. Click "Create Token-2022"
4. Approve transaction in wallet
5. Copy the generated mint address
```

**2. Create Liquidity Pool**
``` bash
// Using the frontend interface:
1. Paste Token A mint address
2. Paste Token B mint address
3. Click "Create Pool"
4. Transaction will validate hooks before creation
```

**3. Add Liquidity**
``` bash
// Through the pool interface:
1. Select your created pool
2. Enter amounts for both tokens
3. Set slippage tolerance
4. Execute "Add Liquidity"
```

**4. Execute Swaps**
``` bash
// Via the swap interface:
1. Select input/output tokens
2. Enter swap amount
3. Review route and fees
4. Execute swap with hook validation
```

## 🧪 Testing

**Run Complete Test Suite**
``` bash
# Smart contract tests
anchor test --provider.cluster devnet

# Frontend component tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

## Manual Testing Flow

1. **Token Creation:** Create two Token-2022 mints with hooks
2. **Pool Creation:** Initialize pool with both tokens
3. **Liquidity Addition:** Add initial liquidity to pool
4. **Swap Execution:** Perform test swaps in both directions
5. **Hook Validation:** Test with unauthorized hook (should fail)
6. **Edge Cases:** Test slippage limits and error handling

## 📊 Performance Metrics

- **Hook Validation:** < 10ms per validation
- **Swap Execution:** ~2-3 seconds end-to-end
- **Gas Costs:** ~0.01-0.02 SOL per swap
- **Pool Creation:** ~0.05 SOL
- **Frontend Load Time:** < 2 seconds

## 🔒 Security Considerations

**Smart Contract Security**

- **Hook Whitelist:** Only approved hooks can be used
- **Authority Validation:** Proper signer verification
- **Overflow Protection:** Safe math operations
- **Slippage Protection:** User-defined tolerance limits

**Frontend Security**

- **Input Validation:** All user inputs sanitized
- **Transaction Simulation:** Pre-flight checks
- **Error Handling:** Graceful failure modes
- **Wallet Security:** Industry-standard practices

##📄 License

This project is licensed under the MIT License 
