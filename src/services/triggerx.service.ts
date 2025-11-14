import { TriggerXClient, createJob, JobType, ArgType } from 'sdk-triggerx';
import { createSafeWallet } from 'sdk-triggerx/dist/api/safeWallet.js';
import { ethers } from 'ethers';
import { config } from '../utils/config';
import { AAVE_POOL_ABI, WETH_ADDRESS } from '../contracts/abis';

export class TriggerXService {
  private client: TriggerXClient;
  private signer: ethers.Wallet;
  private safeAddress: string | null = null; // Add this line

  constructor() {
    this.client = new TriggerXClient(config.triggerxApiKey);
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, provider);
  }

  async initializeSafeWallet(): Promise<string> {
    if (this.safeAddress) {
      return this.safeAddress;
    }
  
    // Check if Safe wallet address is provided in config
    if (config.safeWalletAddress) {
      this.safeAddress = config.safeWalletAddress;
      return this.safeAddress;
    }
  
    // If no Safe wallet in config, create a new one
    try {
      this.safeAddress = await createSafeWallet(this.signer);
      console.log('Safe wallet created:', this.safeAddress);
      console.log('Add to .env: SAFE_WALLET_ADDRESS=' + this.safeAddress);
      return this.safeAddress!;
    } catch (error: unknown) {
      console.error('Error creating Safe wallet:', error);
      throw error;
    }
  }

  async createAutoTopUpJob(userAddress: string, publicApiUrl: string) {
    if (!this.safeAddress) {
      throw new Error('Safe wallet not initialized. Call initializeSafeWallet() first.');
    }
    const jobInput = {
      jobType: JobType.Condition,
      argType: ArgType.Static,
      walletMode: 'safe' as const, // Enable Safe mode
      safeAddress: this.safeAddress, // Required for Safe mode

      jobTitle: `Auto Collateral Top-Up - ${userAddress.slice(0, 8)}`,
      timeFrame: config.jobDuration,
      recurring: false,
      timezone: 'UTC',

      chainId: config.chainId,
      conditionType: 'less_equal' as const,
      upperLimit: 10,
      lowerLimit: config.healthFactorThreshold,
      valueSourceType: 'api' as const,
      valueSourceUrl: `${publicApiUrl}/health-factor/${userAddress}`,

      targetContractAddress: config.aave.poolAddress,
      targetFunction: 'supply',
      abi: JSON.stringify(AAVE_POOL_ABI),

      arguments: [
        WETH_ADDRESS,
        config.topUpAmount,
        userAddress,
        '0'
      ],
      dynamicArgumentsScriptUrl: '',

      autotopupTG: true,
    };

    try {
      const result = await createJob(this.client, { jobInput, signer: this.signer });
      return result;
    } catch (error: unknown) {
      console.error('Error creating job:', error);
      throw error;
    }
  }
  getSafeAddress(): string | null {
    return this.safeAddress;
  }
}
