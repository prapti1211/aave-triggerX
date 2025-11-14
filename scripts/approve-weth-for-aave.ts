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
  console.log('WETH Approval for Aave Pool\n');
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  if (!config.safeWalletAddress) {
    console.error('SAFE_WALLET_ADDRESS not set in .env');
    process.exit(1);
  }
  
  console.log('Safe:', config.safeWalletAddress);
  console.log('WETH:', WETH_ADDRESS);
  console.log('Aave Pool:', config.aave.poolAddress);
  
  const wethInterface = new ethers.Interface(ERC20_ABI);
  const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
  
  try {
    const currentAllowance = await wethContract.allowance(
      config.safeWalletAddress,
      config.aave.poolAddress
    );
    
    console.log('\nCurrent Allowance:', ethers.formatEther(currentAllowance), 'WETH');
    
    if (currentAllowance >= ethers.MaxUint256 / 2n) {
      console.log('Already approved - no action needed');
      return;
    }
  } catch (error: any) {
    console.error('Failed to check allowance:', error.message);
  }
  
  const approvalData = wethInterface.encodeFunctionData('approve', [
    config.aave.poolAddress,
    ethers.MaxUint256
  ]);
  
  console.log('\nApproval Transaction Data:');
  console.log('To:', WETH_ADDRESS);
  console.log('Value: 0');
  console.log('Data:', approvalData);
  
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
    
    console.log(`\nOwners: ${owners.length}, Threshold: ${threshold}`);
    const isOwner = owners.some((owner: string) => 
      owner.toLowerCase() === signer.address.toLowerCase()
    );
    
    if (!isOwner) {
      console.log('Warning: Your address is not a Safe owner');
    }
  } catch (error: any) {
    console.log('Could not verify Safe ownership:', error.message);
  }
  
  console.log('\nExecute via Safe UI:');
  console.log('1. Visit: https://app.safe.global/');
  console.log('2. New Transaction > Transaction Builder');
  console.log('3. Paste the data above');
  console.log('\nNext: npm run prepare-safe');
}

approveWethForAave().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

