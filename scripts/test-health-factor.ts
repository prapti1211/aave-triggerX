import { AaveService } from '../src/services/aave.service';
import { config } from '../src/utils/config';

async function testHealthFactor() {
  console.log('Testing Health Factor Monitoring');
  console.log(`Monitoring address: ${config.userAddress}`);
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`Chain ID: ${config.chainId}`);
  
  const aaveService = new AaveService();
  
  try {
    console.log('\nFetching health factor...');
    const healthFactor = await aaveService.getHealthFactor(config.userAddress);
    
    console.log('\nFetching account details...');
    const accountData = await aaveService.getUserAccountDetails(config.userAddress);
    
    console.log('\nAccount Status:');
    console.log('━'.repeat(50));
    console.log('Health Factor:', healthFactor);
    console.log('Total Collateral:', accountData.totalCollateral, 'ETH');
    console.log('Total Debt:', accountData.totalDebt, 'ETH');
    console.log('Available Borrows:', accountData.availableBorrows, 'ETH');
    
    console.log('\nRisk Assessment:');
    console.log('━'.repeat(50));
    
    if (healthFactor > 1e50) {
      console.log('[INFO] No debt position detected (infinite health factor)');
      console.log('To test automation, you need to:');
      console.log('   1. Supply collateral to Aave');
      console.log('   2. Borrow some assets');
      console.log('   3. Then monitor the health factor');
    } else if (healthFactor === 0) {
      console.log('No position found or user has no debt');
    } else if (healthFactor > 1.5) {
      console.log('Position is SAFE');
    } else if (healthFactor > 1.2) {
      console.log('Position is MODERATE risk');
    } else if (healthFactor > 1.0) {
      console.log('Position is HIGH risk - Top-up recommended!');
    } else {
      console.log('Position is LIQUIDATABLE!');
    }
    
  } catch (error: unknown) {
    console.error('Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message?.includes('missing revert data')) {
        console.log('\nPossible issues:');
        console.log('1. User address has no position on Aave');
        console.log('2. RPC endpoint is not responding correctly');
        console.log('3. Contract address might be incorrect');
      }
    } else {
      console.log('An unknown error occurred');
    }
  }
}

testHealthFactor().catch(console.error);
