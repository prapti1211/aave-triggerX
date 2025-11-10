"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const health_monitor_service_1 = require("../src/services/health-monitor.service");
const aave_service_1 = require("../src/services/aave.service");
const config_1 = require("../src/utils/config");
async function main() {
    console.log('Starting Aave TriggerX Auto Top-Up System');
    console.log(`Monitoring address: ${config_1.config.userAddress}`);
    console.log(`Health factor threshold: ${config_1.config.healthFactorThreshold}`);
    // Initialize services
    const aaveService = new aave_service_1.AaveService();
    const healthMonitor = new health_monitor_service_1.HealthMonitorService();
    // Start health monitoring API
    healthMonitor.start(3000);
    // Test Aave connection
    console.log('\nTesting Aave connection...');
    const accountData = await aaveService.getUserAccountDetails(config_1.config.userAddress);
    console.log('Account Data:', accountData);
    console.log('\nSystem is now running and monitoring your position!');
    console.log('Health factor API: http://localhost:3000/health-factor/' + config_1.config.userAddress);
    console.log('\nNext steps:');
    console.log('1. Run ngrok in another terminal: ngrok http 3000');
    console.log('2. Copy the ngrok URL and update scripts/deploy-ngrok-job.ts');
    console.log('3. Run: npm run deploy-ngrok');
}
main().catch(console.error);
//# sourceMappingURL=deploy-job.js.map