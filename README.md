# Aave TriggerX Automation System

An automated collateral top-up system for Aave V3 positions using TriggerX SDK. This system monitors your Aave health factor and automatically supplies additional collateral when it falls below a specified threshold, protecting your position from liquidation.

## Overview

This application:
- Monitors your Aave V3 position health factor in real-time
- Automatically triggers collateral top-up when health factor drops below threshold
- Uses Safe wallet for secure automated transactions
- Leverages TriggerX for decentralized automation
- Exposes a health monitoring API that TriggerX polls

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A wallet with:
  - ETH for gas fees
  - WETH for collateral top-up
- An active Aave V3 position with collateral and debt
- [TriggerX API Key](https://triggerx.network/)
- [ngrok](https://ngrok.com/) for exposing local API to the internet

## Quick Start

### 1. Installation

```bash
git clone https://github.com/trigg3rX/aave-triggerX.git
cd aave-triggerX
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
# Your wallet private key (must have ETH for gas)
PRIVATE_KEY=your_private_key_here

# TriggerX API Key (get from https://triggerx.network/)
TRIGGERX_API_KEY=your_triggerx_api_key_here

# Blockchain Configuration
SEPOLIA_RPC_URL=https://sepolia.optimism.io
CHAIN_ID=11155420

# Your wallet address (the one with Aave position)
USER_ADDRESS=0xYourWalletAddress

# Safe wallet address (will be created if not provided)
SAFE_WALLET_ADDRESS=0xYourSafeWalletAddress

# Aave V3 Contract Addresses (Optimism Sepolia)
AAVE_POOL_ADDRESS=0xb50201558B00496A145fE76f7424749556E326D8
AAVE_POOL_DATA_PROVIDER=0x9991e51345F8E60Ec76d5AF29D910B93dcC05620

# Public URL for health monitoring API (set after running ngrok)
PUBLIC_URL=https://your-ngrok-url.ngrok-free.dev
```

### 3. Start the Health Monitoring API

```bash
npm start
```

This will start a local API server on port 3000.

### 4. Expose API with ngrok

In a new terminal:

```bash
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok-free.dev`) and update your `.env` file:

```env
PUBLIC_URL=https://abc123.ngrok-free.dev
```

### 5. Create Safe Wallet

```bash
npm run create-safe
```

Copy the Safe wallet address to your `.env` file as `SAFE_WALLET_ADDRESS`.

### 6. Fund Your Safe Wallet

Transfer WETH and ETH to your Safe wallet:
- WETH: For collateral top-up (e.g., 0.1 WETH)
- ETH: For gas fees (e.g., 0.01 ETH)

### 7. Approve WETH for Aave

```bash
npm run approve-weth
```

### 8. Deploy Automation Job

```bash
npm run deploy-ngrok
```

Your automation is now active!

## Project Structure

```
aave-triggerX/
├── src/
│   ├── contracts/
│   │   └── abis.ts              # Smart contract ABIs and addresses
│   ├── services/
│   │   ├── aave.service.ts       # Aave interaction logic
│   │   ├── health-monitor.service.ts  # Health monitoring API
│   │   └── triggerx.service.ts   # TriggerX SDK integration
│   ├── utils/
│   │   └── config.ts             # Configuration management
│   └── main.ts                   # Application entry point
├── scripts/
│   ├── create-safe-wallet.ts     # Create Safe wallet
│   ├── prepare-safe-wallet.ts    # Check Safe wallet status
│   ├── approve-weth-for-aave.ts  # Approve WETH spending
│   └── deploy-ngrok-job.ts       # Deploy job with ngrok URL
├── .env                          # Environment configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## How It Works

1. **Health Monitoring API**: Your local server exposes an endpoint that returns your current Aave health factor
2. **ngrok Tunnel**: Exposes your local API to the internet so TriggerX can access it
3. **TriggerX Job**: Polls your health factor API every ~90 seconds
4. **Condition Check**: When health factor ≤ threshold, TriggerX triggers the job
5. **Safe Wallet Execution**: The job executes via your Safe wallet, which:
   - Approves WETH for Aave Pool
   - Supplies collateral to Aave on your behalf
6. **Position Protected**: Your health factor increases, protecting from liquidation

## Customization Guide

### Using Different Blockchains

To use this system on different chains (e.g., Ethereum Mainnet, Arbitrum):

#### 1. Update `.env` Configuration

```env
# Example: Ethereum Mainnet
SEPOLIA_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
CHAIN_ID=1


# Example: Arbitrum
SEPOLIA_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-api-key
CHAIN_ID=42161
```

#### 2. Update Aave Contract Addresses

Find Aave V3 addresses for your target chain from [Aave Docs](https://docs.aave.com/developers/deployed-contracts/v3-mainnet):

```env
# Example: Ethereum Mainnet
AAVE_POOL_ADDRESS=0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
AAVE_POOL_DATA_PROVIDER=0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3
```

#### 3. Update WETH Address

Edit `src/contracts/abis.ts`:

```typescript
// Update WETH address for your chain
export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // ETH Mainnet

// Common WETH addresses:
// Ethereum: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
// : 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619
// Arbitrum: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1
// Optimism: 0x4200000000000000000000000000000000000006
```

### Using Different Wallet Addresses

To monitor a different wallet address:

#### 1. Update `.env`

```env
# Change to the wallet you want to monitor
USER_ADDRESS=0xNewWalletAddress
```

#### 2. Create a New Safe Wallet (Optional)

If you want a new Safe wallet for this address:

```bash
npm run create-safe
```

Update the new Safe address in `.env`:

```env
SAFE_WALLET_ADDRESS=0xNewSafeWalletAddress
```

#### 3. Fund and Redeploy

1. Fund the new Safe wallet with WETH and ETH
2. Approve WETH: `npm run approve-weth`
3. Deploy automation: `npm run deploy-ngrok`

### Customizing Health Factor Threshold

Edit `src/utils/config.ts`:

```typescript
export const config = {
  // ... other config
  
  // Change threshold (1.2 = position triggers when HF drops below 1.2)
  healthFactorThreshold: 1.5, // More conservative
  
  // Change top-up amount (in wei)
  topUpAmount: '50000000000000000', // 0.05 ETH instead of 0.01
  
  // Change job duration (in seconds)
  jobDuration: 3600, // 1 hour instead of 5 minutes
};
```

### Using Your Own Health Monitoring API

If you have your own API for health monitoring:

#### Option 1: Replace the Built-in API

Edit `src/services/health-monitor.service.ts` to add your custom logic, or replace it entirely with your API implementation.

#### Option 2: Use External API

If you already have a running health monitor API:

1. Ensure your API returns the health factor as a plain number (text/plain):
   ```
   GET https://your-api.com/health-factor/{address}
   
   Response: 1.45
   ```

2. Update `scripts/deploy-ngrok-job.ts`:

```typescript
const jobInput = {
  // ... other config
  
  // Point to your external API
  valueSourceUrl: `https://your-api.com/health-factor/${config.userAddress}`,
  
  // ... rest of config
};
```

3. You don't need to run `npm start` if using an external API
4. Deploy directly: `npm run deploy-ngrok`

#### Custom API Requirements

Your API must:
- Return health factor as a plain number (Content-Type: text/plain)
- Respond within 5-6 seconds (TriggerX timeout)
- Be publicly accessible (TriggerX needs to poll it)
- Return `0` on errors

Example API response:
```
1.45
```

NOT JSON:
```json
{"healthFactor": 1.45}  // Won't work
```

### Customizing Automation Logic

#### Change Top-Up Asset

To supply a different asset instead of WETH, edit `scripts/deploy-ngrok-job.ts`:

```typescript
// Change WETH_ADDRESS to your desired token
const YOUR_TOKEN_ADDRESS = '0xYourTokenAddress';

// Update in safeTransactions
safeTransactions: [
  {
    // Approve your token instead of WETH
    to: YOUR_TOKEN_ADDRESS,
    data: new ethers.Interface([...]).encodeFunctionData('approve', [
      config.aave.poolAddress,
      ethers.MaxUint256
    ]),
    // ...
  },
  {
    // Supply your token
    to: config.aave.poolAddress,
    data: new ethers.Interface([...]).encodeFunctionData('supply', [
      YOUR_TOKEN_ADDRESS, // Your token
      config.topUpAmount,
      config.userAddress,
      0
    ]),
    // ...
  }
]
```

#### Add Multiple Actions

You can add multiple transactions in `safeTransactions` array:

```typescript
safeTransactions: [
  // Transaction 1: Approve WETH
  { to: WETH_ADDRESS, data: approveData, operation: 0 },
  
  // Transaction 2: Supply WETH
  { to: AAVE_POOL, data: supplyData, operation: 0 },
  
  // Transaction 3: Enable collateral
  { to: AAVE_POOL, data: enableCollateralData, operation: 0 },
]
```

## Available Scripts

```bash
npm start           # Start health monitoring API
npm run deploy-ngrok # Deploy TriggerX job with ngrok URL
npm run create-safe  # Create a new Safe wallet
npm run prepare-safe # Check Safe wallet balance and status
npm run approve-weth # Approve WETH for Aave Pool from Safe wallet
npm run build       # Build TypeScript to JavaScript
npm run dev         # Run in development mode with auto-reload
npm run clean       # Remove build artifacts
```

## Security Considerations

1. **Private Keys**: Never commit `.env` file or share your private keys
2. **Safe Wallet**: Automation executes through Safe wallet, providing an additional security layer
3. **WETH Approval**: Approves maximum WETH to avoid repeated approvals (save gas)
4. **API Exposure**: ngrok exposes your health API publicly - ensure no sensitive data is exposed
5. **Fund Management**: Only fund Safe wallet with amount needed for automation

## Troubleshooting

### Job Not Triggering

1. **Check health factor**: Ensure it's actually below threshold
   ```bash
   curl https://your-ngrok-url.ngrok-free.dev/health-factor/your-address
   ```

2. **Verify Safe wallet**:
   ```bash
   npm run prepare-safe
   ```
   - Ensure it has WETH for top-up
   - Ensure it has ETH for gas
   - Ensure WETH is approved for Aave Pool

3. **Check ngrok**: Ensure ngrok is running and URL is correct in `.env`

4. **Job Status**: Check if job is expired or completed (non-recurring jobs execute once)

### API Timeout

If TriggerX times out calling your API:
- Check RPC provider speed (use Alchemy/Infura for faster responses)
- Ensure ngrok is running
- Verify firewall isn't blocking ngrok

### Transaction Failures

- Insufficient ETH for gas in Safe wallet
- Insufficient WETH in Safe wallet
- WETH not approved for Aave Pool
- Health factor already above threshold

## Advanced Configuration

### Recurring Jobs

To make the job recurring (triggers multiple times):

Edit `scripts/deploy-ngrok-job.ts`:

```typescript
const jobInput = {
  // ...
  recurring: true, // Change to true
  timeFrame: 86400, // 24 hours
  // ...
};
```

### Multiple Monitoring Addresses

To monitor multiple addresses:

1. Create separate `.env` files (`.env.wallet1`, `.env.wallet2`)
2. Run multiple instances:
   ```bash
   # Terminal 1
   NODE_ENV=wallet1 npm start
   
   # Terminal 2 (use different port)
   NODE_ENV=wallet2 PORT=3001 npm start
   ```
3. Create separate ngrok tunnels for each
4. Deploy separate jobs for each address

### Custom Trigger Conditions

TriggerX supports various condition types:

```typescript
conditionType: 'less_equal'        // Health factor <= threshold
conditionType: 'greater_equal'     // Health factor >= threshold
conditionType: 'equal'             // Health factor == threshold
conditionType: 'between'           // lowerLimit <= HF <= upperLimit
```

## Additional Resources

- [Aave V3 Documentation](https://docs.aave.com/developers/getting-started/readme)
- [TriggerX SDK Documentation](https://triggerx.gitbook.io/triggerx-docs)
- [Safe Wallet Documentation](https://docs.safe.global/)
- [Ethers.js Documentation](https://docs.ethers.org/)


This software is provided "as is" without warranty of any kind. Use at your own risk. Always test thoroughly on testnets before using with real funds. The authors are not responsible for any loss of funds.

---

**Built using TriggerX, Aave V3, and Safe Wallet**

