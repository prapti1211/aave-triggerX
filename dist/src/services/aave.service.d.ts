export declare class AaveService {
    private provider;
    private wallet;
    private poolContract;
    constructor();
    getHealthFactor(userAddress: string): Promise<number>;
    getUserAccountDetails(userAddress: string): Promise<{
        totalCollateral: string;
        totalDebt: string;
        healthFactor: string;
        availableBorrows: string;
    }>;
}
//# sourceMappingURL=aave.service.d.ts.map