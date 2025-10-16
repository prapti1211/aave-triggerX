"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/test-health-factor.ts
const aave_service_1 = require("../src/services/aave.service");
const config_1 = require("../src/utils/config");
async function testHealthFactor() {
    console.log('🧪 Testing Health Factor Monitoring');
    console.log(`Monitoring address: ${config_1.config.userAddress}`);
    console.log(`RPC URL: ${config_1.config.rpcUrl}`);
    console.log(`Chain ID: ${config_1.config.chainId}`);
    const aaveService = new aave_service_1.AaveService();
    try {
        console.log('\n📡 Fetching health factor...');
        const healthFactor = await aaveService.getHealthFactor(config_1.config.userAddress);
        console.log('\n📊 Fetching account details...');
        const accountData = await aaveService.getUserAccountDetails(config_1.config.userAddress);
        console.log('\n📊 Account Status:');
        console.log('━'.repeat(50));
        console.log('Health Factor:', healthFactor);
        console.log('Total Collateral:', accountData.totalCollateral, 'ETH');
        console.log('Total Debt:', accountData.totalDebt, 'ETH');
        console.log('Available Borrows:', accountData.availableBorrows, 'ETH');
        console.log('\n🚨 Risk Assessment:');
        console.log('━'.repeat(50));
        if (healthFactor === 0) {
            console.log('❓ No position found or user has no debt');
        }
        else if (healthFactor > 1.5) {
            console.log('✅ Position is SAFE');
        }
        else if (healthFactor > 1.2) {
            console.log('⚠️  Position is MODERATE risk');
        }
        else if (healthFactor > 1.0) {
            console.log('🔥 Position is HIGH risk - Top-up recommended!');
        }
        else {
            console.log('💀 Position is LIQUIDATABLE!');
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        if (error.message?.includes('missing revert data')) {
            console.log('\n💡 Possible issues:');
            console.log('1. User address has no position on Aave');
            console.log('2. RPC endpoint is not responding correctly');
            console.log('3. Contract address might be incorrect');
        }
    }
}
testHealthFactor().catch(console.error);
//# sourceMappingURL=test-health-factor.js.map