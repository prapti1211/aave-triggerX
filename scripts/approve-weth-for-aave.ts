import { ethers } from 'ethers';
import { config } from '../src/utils/config';
import { ERC20_ABI, WETH_ADDRESS } from '../src/contracts/abis';

/**
 * This script helps approve WETH spending for the Aave Pool contract
 * This is a PREREQUISITE before the Safe wallet can supply WETH to Aave
 * 
 * IMPORTANT: This transaction needs to be executed FROM the Safe wallet
 * You have two options:
 * 1. Execute this through the Safe UI (recommended for multisig)
 * 2. If your Safe has only 1 owner, this script can help generate the transaction
 */

async function approveWethForAave() {
  console.log('WETH Approval Script for Aave Pool');
  console.log('═'.repeat(70));
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  if (!config.safeWalletAddress) {
    console.error('[ERROR] SAFE_WALLET_ADDRESS not set in .env!');
    process.exit(1);
  }
  
  console.log('\nConfiguration:');
  console.log('─'.repeat(70));
  console.log('Safe Wallet Address:', config.safeWalletAddress);
  console.log('WETH Contract:', WETH_ADDRESS);
  console.log('Aave Pool (Spender):', config.aave.poolAddress);
  console.log('Your Signer Address:', signer.address);
  
  // Create WETH contract interface
  const wethInterface = new ethers.Interface(ERC20_ABI);
  
  // Check current allowance
  console.log('\n1️⃣  Checking Current Allowance');
  console.log('─'.repeat(70));
  
  const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
  
  try {
    const currentAllowance = await wethContract.allowance(
      config.safeWalletAddress,
      config.aave.poolAddress
    );
    
    console.log('Current Allowance:', ethers.formatEther(currentAllowance), 'WETH');
    
    if (currentAllowance >= ethers.MaxUint256 / 2n) {
      console.log('✓ Safe wallet already has sufficient approval for Aave Pool!');
      console.log('  No action needed.');
      return;
    }
    
    if (currentAllowance > 0n) {
      console.log('⚠️  Existing allowance found, but not unlimited.');
      console.log('   This script will set it to unlimited.');
    }
  } catch (error: any) {
    console.error('✗ Failed to check current allowance:', error.message);
  }
  
  // Generate approval transaction data
  console.log('\n2️⃣  Generating Approval Transaction');
  console.log('─'.repeat(70));
  
  const approvalData = wethInterface.encodeFunctionData('approve', [
    config.aave.poolAddress,
    ethers.MaxUint256 // Unlimited approval
  ]);
  
  console.log('Transaction Details:');
  console.log('  To:', WETH_ADDRESS);
  console.log('  Value: 0 ETH');
  console.log('  Data:', approvalData);
  console.log('  Function: approve(address spender, uint256 amount)');
  console.log('  Parameters:');
  console.log('    - spender:', config.aave.poolAddress);
  console.log('    - amount: MaxUint256 (unlimited)');
  
  // Check if signer is a Safe owner
  console.log('\n3️⃣  Checking Safe Ownership');
  console.log('─'.repeat(70));
  
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
  
  try {
    const safeContract = new ethers.Contract(config.safeWalletAddress, SAFE_ABI, provider);
    const owners = await safeContract.getOwners();
    const threshold = await safeContract.getThreshold();
    
    console.log(`Safe has ${owners.length} owner(s), threshold: ${threshold}`);
    console.log('Owners:');
    owners.forEach((owner: string, index: number) => {
      const isYou = owner.toLowerCase() === signer.address.toLowerCase();
      console.log(`  ${index + 1}. ${owner}${isYou ? ' (YOU)' : ''}`);
    });
    
    const isOwner = owners.some((owner: string) => 
      owner.toLowerCase() === signer.address.toLowerCase()
    );
    
    if (!isOwner) {
      console.log('\n⚠️  WARNING: Your signer address is NOT an owner of this Safe!');
      console.log('   You will not be able to execute transactions.');
    }
  } catch (error: any) {
    console.log('⚠️  Could not verify Safe ownership:', error.message);
  }
  
  // Instructions
  console.log('\n4️⃣  How to Execute This Approval');
  console.log('═'.repeat(70));
  console.log('\nOPTION A: Using Safe Web Interface (RECOMMENDED)');
  console.log('─'.repeat(70));
  console.log('1. Go to: https://app.safe.global/');
  console.log('2. Connect your wallet and select your Safe');
  console.log('3. Go to "New Transaction" > "Transaction Builder"');
  console.log('4. Enter the following:');
  console.log(`   - To: ${WETH_ADDRESS}`);
  console.log('   - Value: 0');
  console.log(`   - Data (ABI): ${approvalData}`);
  console.log('5. Review and execute the transaction');
  console.log('6. Get other owners to sign if threshold > 1');
  
  console.log('\nOPTION B: Using Safe SDK (Advanced)');
  console.log('─'.repeat(70));
  console.log('Use the Safe Protocol Kit to programmatically propose this transaction.');
  console.log('See: https://docs.safe.global/sdk/protocol-kit');
  
  console.log('\nOPTION C: If Safe has 1 owner and threshold = 1');
  console.log('─'.repeat(70));
  console.log('You can execute directly through Safe\'s execTransaction function.');
  console.log('(This requires additional setup - not recommended for beginners)');
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log('✓ Approval transaction data generated');
  console.log('✓ Once approved, your Safe can supply WETH to Aave');
  console.log('✓ The approval is unlimited, so you won\'t need to do this again');
  console.log('\nNext steps after approval:');
  console.log('1. Verify approval: npm run prepare-safe');
  console.log('2. Deploy TriggerX job: npm run deploy-ngrok');
  console.log('═'.repeat(70));
}

approveWethForAave().catch((error) => {
  console.error('\n[FATAL] Fatal error:', error);
  process.exit(1);
});

