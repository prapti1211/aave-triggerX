export declare class TriggerXService {
    private client;
    private signer;
    private safeAddress;
    constructor();
    initializeSafeWallet(): Promise<string>;
    createAutoTopUpJob(userAddress: string, publicApiUrl: string): Promise<import("sdk-triggerx").JobResponse>;
    getSafeAddress(): string | null;
}
//# sourceMappingURL=triggerx.service.d.ts.map