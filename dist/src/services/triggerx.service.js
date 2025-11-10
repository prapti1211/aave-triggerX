"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerXService = void 0;
const sdk_triggerx_1 = require("sdk-triggerx");
const safeWallet_js_1 = require("sdk-triggerx/dist/api/safeWallet.js");
const ethers_1 = require("ethers");
const config_1 = require("../utils/config");
const abis_1 = require("../contracts/abis");
class TriggerXService {
    constructor() {
        this.safeAddress = null; // Add this line
        this.client = new sdk_triggerx_1.TriggerXClient(config_1.config.triggerxApiKey);
        const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpcUrl);
        this.signer = new ethers_1.ethers.Wallet(config_1.config.privateKey, provider);
    }
    async initializeSafeWallet() {
        if (this.safeAddress) {
            console.log('Safe wallet already initialized:', this.safeAddress);
            return this.safeAddress;
        }
        // Check if Safe wallet address is provided in config
        if (config_1.config.safeWalletAddress) {
            console.log('Using Safe wallet from config:', config_1.config.safeWalletAddress);
            this.safeAddress = config_1.config.safeWalletAddress;
            return this.safeAddress;
        }
        // If no Safe wallet in config, create a new one
        try {
            console.log('No Safe wallet in config. Creating new Safe wallet...');
            this.safeAddress = await (0, safeWallet_js_1.createSafeWallet)(this.signer);
            console.log('Safe wallet created successfully:', this.safeAddress);
            console.log('[IMPORTANT] Add this to your .env file:');
            console.log(`SAFE_WALLET_ADDRESS=${this.safeAddress}`);
            return this.safeAddress;
        }
        catch (error) {
            console.error('Error creating Safe wallet:', error);
            throw error;
        }
    }
    async createAutoTopUpJob(userAddress, publicApiUrl) {
        if (!this.safeAddress) {
            throw new Error('Safe wallet not initialized. Call initializeSafeWallet() first.');
        }
        const jobInput = {
            jobType: sdk_triggerx_1.JobType.Condition,
            argType: sdk_triggerx_1.ArgType.Static,
            walletMode: 'safe', // Enable Safe mode
            safeAddress: this.safeAddress, // Required for Safe mode
            jobTitle: `Auto Collateral Top-Up - ${userAddress.slice(0, 8)}`,
            timeFrame: config_1.config.jobDuration,
            recurring: false,
            timezone: 'UTC',
            chainId: config_1.config.chainId,
            conditionType: 'less_equal',
            upperLimit: 10,
            lowerLimit: config_1.config.healthFactorThreshold,
            valueSourceType: 'api',
            valueSourceUrl: `${publicApiUrl}/health-factor/${userAddress}`,
            targetContractAddress: config_1.config.aave.poolAddress,
            targetFunction: 'supply',
            abi: JSON.stringify(abis_1.AAVE_POOL_ABI),
            arguments: [
                abis_1.WETH_ADDRESS,
                config_1.config.topUpAmount,
                userAddress,
                '0'
            ],
            dynamicArgumentsScriptUrl: '',
            autotopupTG: true,
        };
        try {
            const result = await (0, sdk_triggerx_1.createJob)(this.client, { jobInput, signer: this.signer });
            console.log('Auto top-up job created:', result);
            return result;
        }
        catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    }
    getSafeAddress() {
        return this.safeAddress;
    }
}
exports.TriggerXService = TriggerXService;
//# sourceMappingURL=triggerx.service.js.map