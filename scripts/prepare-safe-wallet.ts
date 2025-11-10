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
  console.log('Verifying Pre-existing Safe Wallet for Aave Automation\n');
  console.log('═'.repeat(60));
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // Step 1: Validate Safe wallet address from env
  console.log('\nStep 1: Validate Safe Wallet Address');
  console.log('─'.repeat(60));
  
  const safeAddress = config.safeWalletAddress;
  
  if (!safeAddress) {
    console.error('[ERROR] SAFE_WALLET_ADDRESS not found in .env file!');
    console.log('\nPlease add your Safe wallet address to .env:');
    console.log('SAFE_WALLET_ADDRESS=0xYourSafeWalletAddressHere');
    process.exit(1);
  }
  
  // Validate address format
  if (!ethers.isAddress(safeAddress)) {
    console.error('[ERROR] Invalid Safe wallet address format:', safeAddress);
    process.exit(1);
  }
  
  console.log('[SUCCESS] Safe wallet address:', safeAddress);
  
  // Check if address has code (is a contract)
  try {
    const code = await provider.getCode(safeAddress);
    if (code === '0x') {
      console.log('[WARNING] Address has no contract code. Are you sure this is a Safe wallet?');
    } else {
      console.log('[INFO] Address is a contract (likely a Safe wallet)');
    }
  } catch (error: any) {
    console.error('[WARNING] Could not verify contract code:', error.message);
  }
  
  // Step 2: Check Safe wallet owners
  console.log('\nStep 2: Check Safe Wallet Owners');
  console.log('─'.repeat(60));
  
  try {
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, provider);
    const owners = await safeContract.getOwners();
    const threshold = await safeContract.getThreshold();
    
    console.log(`Number of Owners: ${owners.length}`);
    console.log(`Signature Threshold: ${threshold.toString()}`);
    console.log('\nOwners:');
    owners.forEach((owner: string, index: number) => {
      console.log(`  ${index + 1}. ${owner}`);
      if (owner.toLowerCase() === config.userAddress.toLowerCase()) {
        console.log('     ^ This is your USER_ADDRESS');
      }
    });
  } catch (error: any) {
    console.log('[WARNING] Could not retrieve Safe owners:', error.message);
    console.log('   This might not be a Safe wallet contract.');
    console.log('   Continuing with verification...');
  }
  
  // Step 3: Check WETH balance in Safe wallet
  console.log('\nStep 3: Check WETH Balance in Safe Wallet');
  console.log('─'.repeat(60));
  
  const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
  
  try {
    const wethBalance = await wethContract.balanceOf(safeAddress);
    const wethBalanceFormatted = ethers.formatEther(wethBalance);
    
    console.log(`WETH Balance: ${wethBalanceFormatted} WETH`);
    
    if (wethBalance === 0n) {
      console.log('\n[WARNING] Safe wallet has no WETH!');
      console.log('\nTo fund your Safe wallet with WETH:');
      console.log('─'.repeat(60));
      console.log('1. Go to https://app.aave.com/ or use a DEX');
      console.log('2. Get WETH on OP Sepolia testnet');
      console.log('3. Send WETH to your Safe wallet address:');
      console.log(`   ${safeAddress}`);
      console.log('4. Run this script again to verify');
      console.log('\n[TIP] You can also wrap ETH to WETH using the WETH contract');
    } else {
      const estimatedTopups = Math.floor(Number(wethBalanceFormatted) / Number(ethers.formatEther(config.topUpAmount)));
      console.log(`[INFO] Estimated top-ups available: ${estimatedTopups}`);
    }
  } catch (error: any) {
    console.error('[ERROR] Failed to check WETH balance:', error.message);
    process.exit(1);
  }
  
  // Step 4: Check ETH balance (for gas)
  console.log('\nStep 4: Check ETH Balance (for gas fees)');
  console.log('─'.repeat(60));
  
  try {
    const ethBalance = await provider.getBalance(safeAddress);
    const ethBalanceFormatted = ethers.formatEther(ethBalance);
    
    console.log(`ETH Balance: ${ethBalanceFormatted} ETH`);
    
    if (ethBalance === 0n) {
      console.log('[WARNING] Safe wallet has no ETH for gas fees!');
      console.log('   Make sure to add some ETH for transaction gas costs.');
    }
  } catch (error: any) {
    console.error('[ERROR] Failed to check ETH balance:', error.message);
  }
  
  // Step 5: Summary and next steps
  console.log('\nSafe Wallet Verification Summary');
  console.log('═'.repeat(60));
  console.log('Safe Wallet Address:', safeAddress);
  console.log('WETH Balance:', ethers.formatEther(await wethContract.balanceOf(safeAddress)), 'WETH');
  console.log('ETH Balance:', ethers.formatEther(await provider.getBalance(safeAddress)), 'ETH');
  console.log('Monitored User Address:', config.userAddress);
  console.log('Aave Pool Address:', config.aave.poolAddress);
  
  console.log('\nNext Steps:');
  console.log('─'.repeat(60));
  console.log('1. Test your health factor: npm run test-health');
  console.log('2. Start health monitor API: npm start');
  console.log('3. Expose API publicly: ngrok http 3000');
  console.log('4. Deploy the TriggerX job: npm run deploy-ngrok');
  
  console.log('\nThe job will automatically:');
  console.log('─'.repeat(60));
  console.log('• Monitor health factor of:', config.userAddress);
  console.log(`• Trigger when health factor drops below ${config.healthFactorThreshold}`);
  console.log(`• Supply ${ethers.formatEther(config.topUpAmount)} WETH per top-up`);
  console.log('• Execute from Safe wallet:', safeAddress);
  
  console.log('\nImportant Notes:');
  console.log('─'.repeat(60));
  console.log('• The Safe wallet must have WETH for automated top-ups');
  console.log('• The Safe wallet must have ETH for gas fees');
  console.log('• TriggerX will handle WETH approvals automatically');
  console.log('• Keep the health monitor API running for automation to work');
}

prepareSafeWallet().catch((error) => {
  console.error('\n[FATAL] Fatal error:', error);
  process.exit(1);
});

