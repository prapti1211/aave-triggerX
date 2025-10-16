"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AaveService = void 0;
// src/services/aave.service.ts
const ethers_1 = require("ethers");
const abis_1 = require("../contracts/abis");
const config_1 = require("../utils/config");
class AaveService {
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(config_1.config.privateKey, this.provider);
        this.poolContract = new ethers_1.ethers.Contract(config_1.config.aave.poolAddress, abis_1.AAVE_POOL_ABI, this.wallet);
    }
    async getHealthFactor(userAddress) {
        try {
            const accountData = await this.poolContract.getUserAccountData(userAddress);
            const healthFactor = ethers_1.ethers.formatUnits(accountData.healthFactor, 18);
            return parseFloat(healthFactor);
        }
        catch (error) {
            console.error('Error fetching health factor:', error);
            return 0;
        }
    }
    async getUserAccountDetails(userAddress) {
        const accountData = await this.poolContract.getUserAccountData(userAddress);
        return {
            totalCollateral: ethers_1.ethers.formatEther(accountData.totalCollateralBase),
            totalDebt: ethers_1.ethers.formatEther(accountData.totalDebtBase),
            healthFactor: ethers_1.ethers.formatUnits(accountData.healthFactor, 18),
            availableBorrows: ethers_1.ethers.formatEther(accountData.availableBorrowsBase)
        };
    }
}
exports.AaveService = AaveService;
//# sourceMappingURL=aave.service.js.map