"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const triggerx_service_1 = require("../src/services/triggerx.service");
const config_1 = require("../src/utils/config");
async function main() {
    console.log('Creating Safe Wallet...');
    console.log(`Network: ${config_1.config.rpcUrl}`);
    // Initialize the triggerx service
    const triggerxService = new triggerx_service_1.TriggerXService();
    try {
        // Create Safe wallet
        const safeAddress = await triggerxService.initializeSafeWallet();
        console.log('\nSafe wallet created successfully!');
        console.log(`Safe Address: ${safeAddress}`);
        console.log('\nYou can save this address and use it later when deploying the automation job.');
        console.log('   This Safe wallet will be used to execute your automation jobs securely.');
    }
    catch (error) {
        console.error('Failed to create Safe wallet:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        process.exit(1);
    }
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=create-safe-wallet.js.map