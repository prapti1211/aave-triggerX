import { AaveService } from '../src/services/aave.service';
import { config } from '../src/utils/config';
import { ethers } from 'ethers';
import { ERC20_ABI, WETH_ADDRESS } from '../src/contracts/abis';

/**
 * Diagnostic script to check why automation isn't triggering
 */

async function diagnose() {
  console.log('AUTOMATION DIAGNOSTIC TOOL');
  console.log('═'.repeat(70));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('═'.repeat(70));

  const aaveService = new AaveService();
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);

  let issuesFound = 0;

  // 1. Check Health Factor
  console.log('\n1️⃣  CHECKING HEALTH FACTOR');
  console.log('─'.repeat(70));
  
  try {
    const healthFactor = await aaveService.getHealthFactor(config.userAddress);
    console.log(`Current Health Factor: ${healthFactor}`);
    console.log(`Threshold: ${config.healthFactorThreshold}`);
    
    if (healthFactor <= config.healthFactorThreshold) {
      console.log('✓ Health factor IS below threshold - Job SHOULD trigger');
      console.log(`  Difference: ${(config.healthFactorThreshold - healthFactor).toFixed(4)}`);
    } else {
      console.log('✗ Health factor is ABOVE threshold - Job will NOT trigger');
      console.log(`  Difference: ${(healthFactor - config.healthFactorThreshold).toFixed(4)}`);
      issuesFound++;
    }
  } catch (error: any) {
    console.log('✗ FAILED to fetch health factor:', error.message);
    issuesFound++;
  }

  // 2. Check Safe Wallet Address
  console.log('\n2️⃣  CHECKING SAFE WALLET CONFIGURATION');
  console.log('─'.repeat(70));
  
  if (!config.safeWalletAddress) {
    console.log('✗ SAFE_WALLET_ADDRESS not set in .env!');
    issuesFound++;
  } else {
    console.log(`Safe Wallet Address: ${config.safeWalletAddress}`);
    console.log('✓ Safe wallet address is configured');
    
    // Check if it's a contract
    try {
      const code = await provider.getCode(config.safeWalletAddress);
      if (code === '0x') {
        console.log('✗ WARNING: Safe address has no contract code!');
        console.log('  This might not be a deployed Safe wallet.');
        issuesFound++;
      } else {
        console.log('✓ Safe wallet is a deployed contract');
      }
    } catch (error: any) {
      console.log('✗ Could not verify Safe contract:', error.message);
      issuesFound++;
    }
  }

  // 3. Check Safe Wallet WETH Balance
  console.log('\n3️⃣  CHECKING SAFE WALLET WETH BALANCE');
  console.log('─'.repeat(70));
  
  if (!config.safeWalletAddress) {
    console.log('✗ Cannot check WETH balance - Safe wallet address not set');
    issuesFound++;
  } else {
    try {
      const wethBalance = await wethContract.balanceOf(config.safeWalletAddress);
      const wethFormatted = ethers.formatEther(wethBalance);
      const requiredWeth = ethers.formatEther(config.topUpAmount);
      
      console.log(`WETH Balance: ${wethFormatted} WETH`);
      console.log(`Required per top-up: ${requiredWeth} WETH`);
      
      if (wethBalance >= BigInt(config.topUpAmount)) {
        console.log('✓ Safe wallet has sufficient WETH');
        const topups = Math.floor(Number(wethFormatted) / Number(requiredWeth));
        console.log(`  Estimated top-ups available: ${topups}`);
      } else if (wethBalance === 0n) {
        console.log('✗ CRITICAL: Safe wallet has NO WETH!');
        console.log('  Job will fail without WETH. Fund your Safe wallet.');
        issuesFound++;
      } else {
        console.log('✗ WARNING: Safe wallet has insufficient WETH!');
        console.log(`  Has: ${wethFormatted} WETH, Needs: ${requiredWeth} WETH`);
        issuesFound++;
      }
    } catch (error: any) {
      console.log('✗ FAILED to check WETH balance:', error.message);
      issuesFound++;
    }
  }

  // 4. Check Safe Wallet ETH Balance (for gas)
  console.log('\n4️⃣  CHECKING SAFE WALLET ETH BALANCE (GAS)');
  console.log('─'.repeat(70));
  
  if (!config.safeWalletAddress) {
    console.log('✗ Cannot check ETH balance - Safe wallet address not set');
    issuesFound++;
  } else {
    try {
      const ethBalance = await provider.getBalance(config.safeWalletAddress);
      const ethFormatted = ethers.formatEther(ethBalance);
      
      console.log(`ETH Balance: ${ethFormatted} ETH`);
      
      if (ethBalance > ethers.parseEther('0.001')) {
        console.log('✓ Safe wallet has sufficient ETH for gas');
      } else if (ethBalance === 0n) {
        console.log('✗ CRITICAL: Safe wallet has NO ETH for gas!');
        console.log('  Transactions will fail without ETH. Add ETH to Safe wallet.');
        issuesFound++;
      } else {
        console.log('✗ WARNING: Safe wallet has very low ETH!');
        console.log('  Consider adding more ETH for gas fees.');
        issuesFound++;
      }
    } catch (error: any) {
      console.log('✗ FAILED to check ETH balance:', error.message);
      issuesFound++;
    }
  }

  // 5. Check WETH Approval for Aave Pool
  console.log('\n5️⃣  CHECKING WETH APPROVAL FOR AAVE POOL');
  console.log('─'.repeat(70));
  
  if (!config.safeWalletAddress) {
    console.log('✗ Cannot check WETH approval - Safe wallet address not set');
    issuesFound++;
  } else {
    try {
      const allowance = await wethContract.allowance(
        config.safeWalletAddress,
        config.aave.poolAddress
      );
      const allowanceFormatted = ethers.formatEther(allowance);
      const requiredWeth = ethers.formatEther(config.topUpAmount);
      
      console.log(`WETH Allowance: ${allowanceFormatted} WETH`);
      console.log(`Required per top-up: ${requiredWeth} WETH`);
      
      if (allowance >= BigInt(config.topUpAmount)) {
        console.log('✓ Safe wallet has sufficient WETH approval for Aave Pool');
      } else if (allowance === 0n) {
        console.log('✗ CRITICAL: Safe wallet has NO WETH approval for Aave Pool!');
        console.log('  The transaction will REVERT without approval.');
        console.log('  Run: npm run approve-weth');
        issuesFound++;
      } else {
        console.log('✗ WARNING: Safe wallet has insufficient WETH approval!');
        console.log(`  Has: ${allowanceFormatted} WETH, Needs: ${requiredWeth} WETH`);
        console.log('  Run: npm run approve-weth');
        issuesFound++;
      }
    } catch (error: any) {
      console.log('✗ FAILED to check WETH allowance:', error.message);
      issuesFound++;
    }
  }

  // 6. Check API Endpoint
  console.log('\n6️⃣  CHECKING API ENDPOINT');
  console.log('─'.repeat(70));
  
  try {
    const apiUrl = process.env.PUBLIC_URL || 'Not set';
    console.log(`Public URL: ${apiUrl}`);
    
    if (apiUrl === 'Not set') {
      console.log('✗ PUBLIC_URL environment variable not set');
      console.log('  Run: export PUBLIC_URL=https://your-ngrok-url.ngrok-free.dev');
      issuesFound++;
    } else {
      console.log('✓ Public URL is configured');
      
      // Try to fetch from the endpoint
      console.log('Testing endpoint...');
      const testUrl = `${apiUrl}/health-factor/${config.userAddress}`;
      
      try {
        const response = await fetch(testUrl);
        const body = await response.text();
        
        if (response.ok) {
          console.log(`✓ Endpoint is reachable (Status: ${response.status})`);
          console.log(`  Response: ${body}`);
        } else {
          console.log(`✗ Endpoint returned error (Status: ${response.status})`);
          issuesFound++;
        }
      } catch (fetchError: any) {
        console.log(`✗ Could not reach endpoint: ${fetchError.message}`);
        console.log('  Make sure health monitor API and ngrok are running!');
        issuesFound++;
      }
    }
  } catch (error: any) {
    console.log('✗ Error checking endpoint:', error.message);
    issuesFound++;
  }

  // 7. Check Account Details
  console.log('\n7️⃣  CHECKING AAVE ACCOUNT DETAILS');
  console.log('─'.repeat(70));
  
  try {
    const accountData = await aaveService.getUserAccountDetails(config.userAddress);
    console.log(`Total Collateral: ${accountData.totalCollateral} ETH`);
    console.log(`Total Debt: ${accountData.totalDebt} ETH`);
    console.log(`Available Borrows: ${accountData.availableBorrows} ETH`);
    console.log('✓ Account data retrieved successfully');
  } catch (error: any) {
    console.log('✗ FAILED to fetch account data:', error.message);
    issuesFound++;
  }

  // 8. Job Configuration Info
  console.log('\n8️⃣  JOB CONFIGURATION');
  console.log('─'.repeat(70));
  console.log(`Job Type: Condition-based`);
  console.log(`Condition: Health Factor <= ${config.healthFactorThreshold}`);
  console.log(`Action: Supply ${ethers.formatEther(config.topUpAmount)} WETH`);
  console.log(`Check Frequency: Every 90 seconds`);
  console.log(`Recurring: false (will execute only ONCE)`);
  console.log('');
  console.log('⚠️  IMPORTANT: Job is set to NON-RECURRING!');
  console.log('   After first execution, it will NOT trigger again.');
  console.log('   You would need to redeploy the job after each execution.');

  // Summary
  console.log('\n═'.repeat(70));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('═'.repeat(70));
  
  if (issuesFound === 0) {
    console.log('✓ No critical issues found!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Wait 90 seconds for next TriggerX polling cycle');
    console.log('2. Check health monitor API logs for incoming requests');
    console.log('3. Run: npm run verify-execution (after job executes)');
  } else {
    console.log(`✗ Found ${issuesFound} issue(s) that may prevent automation!`);
    console.log('');
    console.log('Action Items:');
    console.log('1. Fix the issues marked with ✗ above');
    console.log('2. Run: npm run prepare-safe (to check Safe wallet)');
    console.log('3. Redeploy job if needed: npm run deploy-ngrok');
  }
  
  console.log('');
  console.log('For real-time monitoring, check:');
  console.log('• Terminal running "npm start" (health monitor logs)');
  console.log('• ngrok dashboard: http://127.0.0.1:4040');
  console.log('• Run: npm run test-health (current status)');
  console.log('═'.repeat(70));
}

diagnose().catch(console.error);

