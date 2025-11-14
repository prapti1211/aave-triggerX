import { ethers } from 'ethers';
import { config } from '../src/utils/config';
import { ERC20_ABI, WETH_ADDRESS } from '../src/contracts/abis';

/**
 * This script verifies your pre-existing Safe wallet for automated Aave supply operations:
 * 1. Validates the Safe wallet address from .env
 * 2. Checks WETH balance in the Safe wallet
 * 3. Retrieves Safe wallet owner information
 * 
 * IMPORTANT: Set SAFE_WALLET_ADDRESS in your .env file before running this script!
 */

// Safe Contract ABI - minimal interface for owner check
const SAFE_ABI = [
  {
    "inputs": [],
    "name": "getOwners",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getThreshold",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function prepareSafeWallet() {
  console.log('Verifying Safe Wallet\n');
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const safeAddress = config.safeWalletAddress;
  
  if (!safeAddress) {
    console.error('SAFE_WALLET_ADDRESS not found in .env file');
    console.log('Add to .env: SAFE_WALLET_ADDRESS=0xYourAddress');
    process.exit(1);
  }
  
  if (!ethers.isAddress(safeAddress)) {
    console.error('Invalid Safe wallet address:', safeAddress);
    process.exit(1);
  }
  
  console.log('Safe wallet address:', safeAddress);
  
  try {
    const code = await provider.getCode(safeAddress);
    if (code === '0x') {
      console.log('Warning: Address has no contract code');
    }
  } catch (error: any) {
    console.error('Could not verify contract:', error.message);
  }
  
  try {
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, provider);
    const owners = await safeContract.getOwners();
    const threshold = await safeContract.getThreshold();
    
    console.log(`\nOwners: ${owners.length}, Threshold: ${threshold.toString()}`);
    owners.forEach((owner: string, index: number) => {
      const isYou = owner.toLowerCase() === config.userAddress.toLowerCase();
      console.log(`  ${index + 1}. ${owner}${isYou ? ' (your address)' : ''}`);
    });
  } catch (error: any) {
    console.log('Could not retrieve Safe owners:', error.message);
  }
  
  const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
  
  try {
    const wethBalance = await wethContract.balanceOf(safeAddress);
    const wethBalanceFormatted = ethers.formatEther(wethBalance);
    
    console.log(`\nWETH Balance: ${wethBalanceFormatted} WETH`);
    
    if (wethBalance === 0n) {
      console.log('Warning: Safe wallet has no WETH');
      console.log('Send WETH to:', safeAddress);
    } else {
      const estimatedTopups = Math.floor(Number(wethBalanceFormatted) / Number(ethers.formatEther(config.topUpAmount)));
      console.log(`Estimated top-ups available: ${estimatedTopups}`);
    }
  } catch (error: any) {
    console.error('Failed to check WETH balance:', error.message);
    process.exit(1);
  }
  
  try {
    const ethBalance = await provider.getBalance(safeAddress);
    const ethBalanceFormatted = ethers.formatEther(ethBalance);
    
    console.log(`ETH Balance: ${ethBalanceFormatted} ETH`);
    
    if (ethBalance === 0n) {
      console.log('Warning: Safe wallet has no ETH for gas fees');
    }
  } catch (error: any) {
    console.error('Failed to check ETH balance:', error.message);
  }
  
  console.log('\nSummary:');
  console.log('Safe:', safeAddress);
  console.log('WETH:', ethers.formatEther(await wethContract.balanceOf(safeAddress)));
  console.log('ETH:', ethers.formatEther(await provider.getBalance(safeAddress)));
  console.log('User:', config.userAddress);
  console.log('Threshold:', config.healthFactorThreshold);
  
  console.log('\nNext: npm start, then npm run deploy-ngrok');
}

prepareSafeWallet().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

