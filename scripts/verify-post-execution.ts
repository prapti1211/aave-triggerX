import { AaveService } from '../src/services/aave.service';
import { config } from '../src/utils/config';
import { ethers } from 'ethers';

/**
 * This script verifies the health factor after a TriggerX job execution
 * Use this to confirm that the automated supply transaction was successful
 * and that the health factor has increased to a safe level
 */

async function verifyPostExecution() {
  console.log('Post-Execution Health Factor Verification');
  console.log('═'.repeat(60));
  console.log(`Monitored Address: ${config.userAddress}`);
  console.log(`Safe Wallet: ${config.safeWalletAddress}`);
  console.log(`Threshold: ${config.healthFactorThreshold}`);
  console.log('═'.repeat(60));
  
  const aaveService = new AaveService();
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  try {
    // Get current health factor and account data
    console.log('\nFetching current position data...');
    const healthFactor = await aaveService.getHealthFactor(config.userAddress);
    const accountData = await aaveService.getUserAccountDetails(config.userAddress);
    
    // Check Safe wallet balances
    console.log('\nChecking Safe wallet balances...');
    const safeWethBalance = await aaveService.getWethBalance(config.safeWalletAddress || '');
    const safeEthBalance = await provider.getBalance(config.safeWalletAddress || '');
    
    // Display results
    console.log('\n' + '─'.repeat(60));
    console.log('CURRENT POSITION STATUS');
    console.log('─'.repeat(60));
    console.log(`Health Factor: ${healthFactor}`);
    console.log(`Total Collateral: ${accountData.totalCollateral} ETH`);
    console.log(`Total Debt: ${accountData.totalDebt} ETH`);
    console.log(`Available Borrows: ${accountData.availableBorrows} ETH`);
    
    console.log('\n' + '─'.repeat(60));
    console.log('SAFE WALLET REMAINING BALANCE');
    console.log('─'.repeat(60));
    console.log(`WETH Balance: ${safeWethBalance} WETH`);
    console.log(`ETH Balance: ${ethers.formatEther(safeEthBalance)} ETH`);
    
    const estimatedTopups = Math.floor(Number(safeWethBalance) / Number(ethers.formatEther(config.topUpAmount)));
    console.log(`Estimated Top-ups Remaining: ${estimatedTopups}`);
    
    // Risk assessment
    console.log('\n' + '─'.repeat(60));
    console.log('RISK ASSESSMENT');
    console.log('─'.repeat(60));
    
    if (healthFactor > 1e50) {
      console.log('Status: NO DEBT POSITION');
      console.log('Info: Infinite health factor (no borrowing detected)');
    } else if (healthFactor === 0) {
      console.log('Status: NO POSITION FOUND');
      console.log('Warning: User has no active Aave position');
    } else if (healthFactor >= config.healthFactorThreshold + 0.3) {
      console.log('Status: VERY SAFE');
      console.log(`Health factor is well above threshold (${config.healthFactorThreshold})`);
    } else if (healthFactor >= config.healthFactorThreshold) {
      console.log('Status: SAFE');
      console.log(`Health factor is above threshold (${config.healthFactorThreshold})`);
    } else if (healthFactor > 1.0) {
      console.log('Status: AT RISK');
      console.log(`Health factor is below threshold (${config.healthFactorThreshold})`);
      console.log('Warning: Position should trigger automation soon');
    } else {
      console.log('Status: CRITICAL - LIQUIDATABLE');
      console.log('Warning: Position is at risk of liquidation!');
    }
    
    // Check if automation should trigger
    console.log('\n' + '─'.repeat(60));
    console.log('AUTOMATION STATUS');
    console.log('─'.repeat(60));
    
    if (healthFactor <= config.healthFactorThreshold && healthFactor > 0 && healthFactor < 1e50) {
      console.log('[ACTIVE] Health factor is at or below threshold');
      console.log('Expected: TriggerX should execute supply job');
      console.log(`Action: Supply ${ethers.formatEther(config.topUpAmount)} WETH`);
    } else if (healthFactor > config.healthFactorThreshold) {
      console.log('[STANDBY] Health factor is above threshold');
      console.log('Expected: No action needed, monitoring continues');
    }
    
    // Warnings
    console.log('\n' + '─'.repeat(60));
    console.log('WARNINGS');
    console.log('─'.repeat(60));
    
    if (estimatedTopups < 3) {
      console.log('[WARNING] Safe wallet is running low on WETH');
      console.log(`Only ${estimatedTopups} top-ups remaining`);
      console.log('Action: Consider refilling Safe wallet with more WETH');
    }
    
    if (Number(ethers.formatEther(safeEthBalance)) < 0.01) {
      console.log('[WARNING] Safe wallet is low on ETH for gas');
      console.log('Action: Add more ETH to Safe wallet for gas fees');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('Verification completed at:', new Date().toISOString());
    console.log('═'.repeat(60));
    
  } catch (error: unknown) {
    console.error('\n[ERROR] Verification failed:', error);
    
    if (error instanceof Error) {
      if (error.message?.includes('missing revert data')) {
        console.log('\nPossible issues:');
        console.log('1. User address has no position on Aave');
        console.log('2. RPC endpoint is not responding correctly');
        console.log('3. Contract address might be incorrect');
      }
    }
    process.exit(1);
  }
}

verifyPostExecution().catch(console.error);

