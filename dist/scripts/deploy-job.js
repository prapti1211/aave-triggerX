"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/deploy-job.ts
const triggerx_service_1 = require("../src/services/triggerx.service");
const health_monitor_service_1 = require("../src/services/health-monitor.service");
const config_1 = require("../src/utils/config");
async function deployAutomation() {
    console.log('🚀 Deploying Aave Auto Top-Up Automation');
    // Start health monitor
    const healthMonitor = new health_monitor_service_1.HealthMonitorService();
    healthMonitor.start(3000);
    // Wait for API to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Deploy TriggerX job
    const triggerxService = new triggerx_service_1.TriggerXService();
    try {
        console.log('Creating automation job...');
        const result = await triggerxService.createAutoTopUpJob(config_1.config.userAddress);
        console.log('✅ Deployment successful!');
        console.log('Job Details:', result);
        console.log('\n📋 Next Steps:');
        console.log('1. Monitor your position at: http://localhost:3000/account-data/' + config_1.config.userAddress);
        console.log('2. Test health factor API: http://localhost:3000/health-factor/' + config_1.config.userAddress);
        console.log('3. Visit TriggerX dashboard: https://app.triggerx.network');
    }
    catch (error) {
        console.error('❌ Deployment failed:', error);
    }
}
deployAutomation().catch(console.error);
//# sourceMappingURL=deploy-job.js.map