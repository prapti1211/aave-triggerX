"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerXService = void 0;
// src/services/triggerx.service.ts
const sdk_triggerx_1 = require("sdk-triggerx");
const ethers_1 = require("ethers");
const config_1 = require("../utils/config");
const abis_1 = require("../contracts/abis");
class TriggerXService {
    constructor() {
        this.client = new sdk_triggerx_1.TriggerXClient(config_1.config.triggerxApiKey);
        const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpcUrl);
        this.signer = new ethers_1.ethers.Wallet(config_1.config.privateKey, provider);
    }
    async createAutoTopUpJob(userAddress) {
        const jobInput = {
            jobType: sdk_triggerx_1.JobType.Condition,
            argType: sdk_triggerx_1.ArgType.Static,
            jobTitle: `Auto Collateral Top-Up - ${userAddress.slice(0, 8)}`,
            timeFrame: config_1.config.jobDuration,
            recurring: false,
            timezone: 'UTC',
            chainId: config_1.config.chainId,
            conditionType: 'less_equal',
            lowerLimit: config_1.config.healthFactorThreshold,
            valueSourceType: 'api',
            valueSourceUrl: `http://localhost:3000/health-factor/${userAddress}`,
            targetContractAddress: config_1.config.aave.poolAddress,
            targetFunction: 'supply',
            abi: JSON.stringify(abis_1.AAVE_POOL_ABI),
            arguments: [
                abis_1.WETH_ADDRESS, // Asset to supply
                config_1.config.topUpAmount, // Amount
                userAddress, // On behalf of
                '0' // Referral code
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
    async createTestJob() {
        // Simple test job for validation
        const testJobInput = {
            jobType: sdk_triggerx_1.JobType.Time,
            argType: sdk_triggerx_1.ArgType.Static,
            jobTitle: 'Test TriggerX Integration',
            timeFrame: 120, // 2 minutes
            scheduleType: 'interval',
            timeInterval: 300, // Every 5 minutes
            timezone: 'UTC',
            chainId: config_1.config.chainId,
            targetContractAddress: config_1.config.aave.poolAddress,
            targetFunction: 'getUserAccountData',
            abi: JSON.stringify(abis_1.AAVE_POOL_ABI),
            arguments: [config_1.config.userAddress],
            dynamicArgumentsScriptUrl: '',
            autotopupTG: true,
        };
        const result = await (0, sdk_triggerx_1.createJob)(this.client, { jobInput: testJobInput, signer: this.signer });
        console.log('Test job created:', result);
        return result;
    }
}
exports.TriggerXService = TriggerXService;
//# sourceMappingURL=triggerx.service.js.map