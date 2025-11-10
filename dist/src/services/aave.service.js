"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AaveService = void 0;
const ethers_1 = require("ethers");
const abis_1 = require("../contracts/abis");
const config_1 = require("../utils/config");
class AaveService {
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(config_1.config.privateKey, this.provider);
        this.poolContract = new ethers_1.ethers.Contract(config_1.config.aave.poolAddress, abis_1.AAVE_POOL_ABI, this.wallet);
        this.wethContract = new ethers_1.ethers.Contract(abis_1.WETH_ADDRESS, abis_1.ERC20_ABI, this.wallet);
    }
    async getHealthFactor(userAddress) {
        try {
            const t0 = Date.now();
            const accountData = await this.poolContract.getUserAccountData(userAddress);
            const t1 = Date.now();
            console.log('[AAVE] getUserAccountData latencyMs=', t1 - t0);
            const healthFactor = ethers_1.ethers.formatUnits(accountData.healthFactor, 18);
            return parseFloat(healthFactor);
        }
        catch (error) {
            const anyErr = error;
            console.error('Error fetching health factor:', {
                code: anyErr?.code,
                reason: anyErr?.reason,
                message: anyErr?.message,
            });
            return 0;
        }
    }
    async getUserAccountDetails(userAddress) {
        const t0 = Date.now();
        const accountData = await this.poolContract.getUserAccountData(userAddress);
        const t1 = Date.now();
        console.log('[AAVE] getUserAccountData (details) latencyMs=', t1 - t0);
        return {
            totalCollateral: ethers_1.ethers.formatEther(accountData.totalCollateralBase),
            totalDebt: ethers_1.ethers.formatEther(accountData.totalDebtBase),
            healthFactor: ethers_1.ethers.formatUnits(accountData.healthFactor, 18),
            availableBorrows: ethers_1.ethers.formatEther(accountData.availableBorrowsBase)
        };
    }
    async supplyCollateral(amount, userAddress) {
        try {
            const tx = await this.poolContract.supply(abis_1.WETH_ADDRESS, amount, userAddress, 0);
            await tx.wait();
            console.log(`Collateral supplied: ${tx.hash}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error supplying collateral:', error);
            throw error;
        }
    }
    /**
     * Check WETH balance of a given address (e.g., Safe wallet)
     */
    async getWethBalance(address) {
        try {
            const balance = await this.wethContract.balanceOf(address);
            return ethers_1.ethers.formatEther(balance);
        }
        catch (error) {
            console.error('Error fetching WETH balance:', error);
            throw error;
        }
    }
    /**
     * Check WETH allowance for Aave Pool from a given address
     */
    async getWethAllowance(ownerAddress) {
        try {
            const allowance = await this.wethContract.allowance(ownerAddress, config_1.config.aave.poolAddress);
            return ethers_1.ethers.formatEther(allowance);
        }
        catch (error) {
            console.error('Error fetching WETH allowance:', error);
            throw error;
        }
    }
    /**
     * Approve WETH spending for Aave Pool
     * Note: This should be called from the wallet that will supply WETH
     */
    async approveWeth(amount) {
        try {
            const tx = await this.wethContract.approve(config_1.config.aave.poolAddress, amount);
            await tx.wait();
            console.log(`WETH approved for Aave Pool: ${tx.hash}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error approving WETH:', error);
            throw error;
        }
    }
}
exports.AaveService = AaveService;
//# sourceMappingURL=aave.service.js.map