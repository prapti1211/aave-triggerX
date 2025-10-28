import { ethers } from 'ethers';
import { AAVE_POOL_ABI, WETH_ADDRESS } from '../contracts/abis';
import { config } from '../utils/config';

export class AaveService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private poolContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.poolContract = new ethers.Contract(
      config.aave.poolAddress,
      AAVE_POOL_ABI,
      this.wallet
    );
  }

  async getHealthFactor(userAddress: string): Promise<number> {
    try {
      const t0 = Date.now();
      const accountData = await this.poolContract.getUserAccountData(userAddress);
      const t1 = Date.now();
      console.log('[AAVE] getUserAccountData latencyMs=', t1 - t0);
      const healthFactor = ethers.formatUnits(accountData.healthFactor, 18);
      return parseFloat(healthFactor);
    } catch (error) {
      const anyErr: any = error;
      console.error('Error fetching health factor:', {
        code: anyErr?.code,
        reason: anyErr?.reason,
        message: anyErr?.message,
      });
      return 0;
    }
  }

  async getUserAccountDetails(userAddress: string) {
    const t0 = Date.now();
    const accountData = await this.poolContract.getUserAccountData(userAddress);
    const t1 = Date.now();
    console.log('[AAVE] getUserAccountData (details) latencyMs=', t1 - t0);
    return {
      totalCollateral: ethers.formatEther(accountData.totalCollateralBase),
      totalDebt: ethers.formatEther(accountData.totalDebtBase),
      healthFactor: ethers.formatUnits(accountData.healthFactor, 18),
      availableBorrows: ethers.formatEther(accountData.availableBorrowsBase)
    };
  }

  async supplyCollateral(amount: string, userAddress: string): Promise<string> {
    try {
      const tx = await this.poolContract.supply(
        WETH_ADDRESS,
        amount,
        userAddress,
        0
      );
      
      await tx.wait();
      console.log(`Collateral supplied: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('Error supplying collateral:', error);
      throw error;
    }
  }
}
