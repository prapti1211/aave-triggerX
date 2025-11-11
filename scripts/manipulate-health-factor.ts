// Script to manipulate health factor for testing automation
import { ethers } from 'ethers';
import { config } from '../src/utils/config';
import { AaveService } from '../src/services/aave.service';

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // OP Sepolia WETH
const USDC_ADDRESS = '0x5fd84259d66Cd46123540766Be93DFE6D43130D7'; // OP Sepolia USDC

async function manipulateHealthFactor() {
  console.log('Health Factor Manipulation Tool');
  console.log('═'.repeat(60));
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  const aaveService = new AaveService();
  
  // Get current state
  console.log('\n📊 Current Position:');
  const accountData = await aaveService.getUserAccountDetails(config.userAddress);
  const currentHF = await aaveService.getHealthFactor(config.userAddress);
  
  console.log(`Health Factor: ${currentHF}`);
  console.log(`Total Collateral: ${accountData.totalCollateral} ETH`);
  console.log(`Total Debt: ${accountData.totalDebt} ETH`);
  console.log(`Available Borrows: ${accountData.availableBorrows} ETH`);
  
  console.log('\n🎯 Available Actions:');
  console.log('═'.repeat(60));
  console.log('1. LOWER Health Factor  → Borrow more USDC (increases risk)');
  console.log('2. RAISE Health Factor   → Supply more WETH collateral (decreases risk)');
  console.log('3. WITHDRAW Collateral   → Withdraw WETH (increases risk)');
  console.log('4. REPAY Debt           → Repay USDC (decreases risk)');
  
  // Get action from command line
  const action = process.argv[2];
  
  if (!action) {
    console.log('\n💡 Usage:');
    console.log('   npm run manipulate-hf lower     # Borrow more to lower HF');
    console.log('   npm run manipulate-hf raise     # Supply more to raise HF');
    console.log('   npm run manipulate-hf withdraw  # Withdraw collateral to lower HF');
    console.log('   npm run manipulate-hf repay     # Repay debt to raise HF');
    return;
  }
  
  const aavePoolAbi = [
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
    'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
    'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
    'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)'
  ];
  
  const wethAbi = [
    'function deposit() payable',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address) view returns (uint256)'
  ];
  
  const usdcAbi = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address) view returns (uint256)'
  ];
  
  const aavePool = new ethers.Contract(config.aave.poolAddress, aavePoolAbi, signer);
  const weth = new ethers.Contract(WETH_ADDRESS, wethAbi, signer);
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, signer);
  
  try {
    switch (action.toLowerCase()) {
      case 'lower': {
        console.log('\n🔴 LOWERING Health Factor (Borrowing more USDC)...');
        
        // Borrow small amount of USDC
        const borrowAmount = ethers.parseUnits('1', 6); // 1 USDC
        
        console.log(`Borrowing ${ethers.formatUnits(borrowAmount, 6)} USDC...`);
        const tx = await aavePool.borrow(
          USDC_ADDRESS,
          borrowAmount,
          2, // Variable interest rate
          0,
          config.userAddress
        );
        
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Borrowed successfully!');
        break;
      }
      
      case 'raise': {
        console.log('\n🟢 RAISING Health Factor (Supplying more WETH)...');
        
        // Supply 0.01 ETH worth of WETH
        const supplyAmount = ethers.parseEther('0.01');
        
        // Get current balance
        const balance = await provider.getBalance(config.userAddress);
        console.log(`Current ETH balance: ${ethers.formatEther(balance)}`);
        
        if (balance < supplyAmount) {
          console.log('❌ Insufficient ETH balance');
          return;
        }
        
        // Wrap ETH to WETH
        console.log(`Wrapping ${ethers.formatEther(supplyAmount)} ETH to WETH...`);
        let tx = await weth.deposit({ value: supplyAmount });
        await tx.wait();
        console.log('✅ WETH wrapped');
        
        // Approve Aave Pool
        console.log('Approving Aave Pool...');
        tx = await weth.approve(config.aave.poolAddress, supplyAmount);
        await tx.wait();
        console.log('✅ Approved');
        
        // Supply to Aave
        console.log('Supplying WETH to Aave...');
        tx = await aavePool.supply(
          WETH_ADDRESS,
          supplyAmount,
          config.userAddress,
          0
        );
        
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Supplied successfully!');
        break;
      }
      
      case 'withdraw': {
        console.log('\n🔴 LOWERING Health Factor (Withdrawing WETH collateral)...');
        
        // Withdraw small amount
        const withdrawAmount = ethers.parseEther('0.005'); // 0.005 ETH
        
        console.log(`Withdrawing ${ethers.formatEther(withdrawAmount)} WETH...`);
        const tx = await aavePool.withdraw(
          WETH_ADDRESS,
          withdrawAmount,
          config.userAddress
        );
        
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Withdrawn successfully!');
        break;
      }
      
      case 'repay': {
        console.log('\n🟢 RAISING Health Factor (Repaying USDC debt)...');
        
        // Check USDC balance
        const usdcBalance = await usdc.balanceOf(config.userAddress);
        console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 6)}`);
        
        if (usdcBalance === 0n) {
          console.log('❌ No USDC balance to repay');
          return;
        }
        
        // Repay small amount
        const repayAmount = ethers.parseUnits('0.5', 6); // 0.5 USDC
        
        // Approve Aave Pool
        console.log('Approving Aave Pool...');
        let tx = await usdc.approve(config.aave.poolAddress, repayAmount);
        await tx.wait();
        console.log('✅ Approved');
        
        console.log(`Repaying ${ethers.formatUnits(repayAmount, 6)} USDC...`);
        tx = await aavePool.repay(
          USDC_ADDRESS,
          repayAmount,
          2, // Variable interest rate
          config.userAddress
        );
        
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Repaid successfully!');
        break;
      }
      
      default:
        console.log('❌ Unknown action:', action);
        console.log('Use: lower, raise, withdraw, or repay');
        return;
    }
    
    // Wait a bit for data to update
    console.log('\n⏳ Waiting for blockchain to update...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Show new state
    console.log('\n📊 New Position:');
    const newAccountData = await aaveService.getUserAccountDetails(config.userAddress);
    const newHF = await aaveService.getHealthFactor(config.userAddress);
    
    console.log(`Health Factor: ${currentHF} → ${newHF}`);
    console.log(`Total Collateral: ${accountData.totalCollateral} → ${newAccountData.totalCollateral} ETH`);
    console.log(`Total Debt: ${accountData.totalDebt} → ${newAccountData.totalDebt} ETH`);
    
    const hfChange = newHF - currentHF;
    if (hfChange > 0) {
      console.log(`\n✅ Health factor INCREASED by ${hfChange.toFixed(4)}`);
    } else if (hfChange < 0) {
      console.log(`\n⚠️  Health factor DECREASED by ${Math.abs(hfChange).toFixed(4)}`);
    } else {
      console.log(`\n➡️  Health factor unchanged (may need more time to update)`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.message?.includes('insufficient collateral')) {
      console.log('\n💡 Not enough collateral for this action. Supply more collateral first.');
    } else if (error.message?.includes('insufficient balance')) {
      console.log('\n💡 Insufficient token balance.');
    }
  }
}

manipulateHealthFactor().catch(console.error);

