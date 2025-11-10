export declare class AaveService {
    private provider;
    private wallet;
    private poolContract;
    private wethContract;
    constructor();
    getHealthFactor(userAddress: string): Promise<number>;
    getUserAccountDetails(userAddress: string): Promise<{
        totalCollateral: string;
        totalDebt: string;
        healthFactor: string;
        availableBorrows: string;
    }>;
    supplyCollateral(amount: string, userAddress: string): Promise<string>;
    /**
     * Check WETH balance of a given address (e.g., Safe wallet)
     */
    getWethBalance(address: string): Promise<string>;
    /**
     * Check WETH allowance for Aave Pool from a given address
     */
    getWethAllowance(ownerAddress: string): Promise<string>;
    /**
     * Approve WETH spending for Aave Pool
     * Note: This should be called from the wallet that will supply WETH
     */
    approveWeth(amount: string): Promise<string>;
}
//# sourceMappingURL=aave.service.d.ts.map