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
