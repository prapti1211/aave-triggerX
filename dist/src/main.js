"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/main.ts
const aave_service_1 = require("./services/aave.service");
const triggerx_service_1 = require("./services/triggerx.service");
const health_monitor_service_1 = require("./services/health-monitor.service");
const config_1 = require("./utils/config");
async function main() {
    console.log('🚀 Starting Aave TriggerX Auto Top-Up System');
    console.log(`Monitoring address: ${config_1.config.userAddress}`);
    console.log(`Health factor threshold: ${config_1.config.healthFactorThreshold}`);
    // Initialize services
    const aaveService = new aave_service_1.AaveService();
    const triggerxService = new triggerx_service_1.TriggerXService();
    const healthMonitor = new health_monitor_service_1.HealthMonitorService();
    // Start health monitoring API
    healthMonitor.start(3000);
    // Test Aave connection
    console.log('\n📊 Testing Aave connection...');
    const accountData = await aaveService.getUserAccountDetails(config_1.config.userAddress);
    console.log('Account Data:', accountData);
    // Wait for API to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Create TriggerX automation job
    console.log('\n🤖 Creating TriggerX automation job...');
    try {
        const jobResult = await triggerxService.createAutoTopUpJob(config_1.config.userAddress);
        console.log('✅ Auto top-up job created successfully!');
        console.log('Job ID:', jobResult.jobId);
    }
    catch (error) {
        console.error('❌ Failed to create automation job:', error);
    }
    console.log('\n🎯 System is now running and monitoring your position!');
    console.log('📡 Health factor API: http://localhost:3000/health-factor/' + config_1.config.userAddress);
}
main().catch(console.error);
//# sourceMappingURL=main.js.map