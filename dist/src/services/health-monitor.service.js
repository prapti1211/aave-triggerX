"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitorService = void 0;
// src/services/health-monitor.service.ts
const express_1 = __importDefault(require("express"));
const aave_service_1 = require("./aave.service");
const config_1 = require("../utils/config");
class HealthMonitorService {
    constructor() {
        this.aaveService = new aave_service_1.AaveService();
        this.app = (0, express_1.default)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.app.get('/health-factor/:address', async (req, res) => {
            try {
                const { address } = req.params;
                const healthFactor = await this.aaveService.getHealthFactor(address);
                res.json({
                    address,
                    healthFactor,
                    timestamp: Date.now(),
                    safe: healthFactor > config_1.config.healthFactorThreshold
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch health factor' });
            }
        });
        this.app.get('/account-data/:address', async (req, res) => {
            try {
                const { address } = req.params;
                const accountData = await this.aaveService.getUserAccountDetails(address);
                res.json(accountData);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch account data' });
            }
        });
    }
    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`Health monitor API running on port ${port}`);
            console.log(`Health factor endpoint: http://localhost:${port}/health-factor/${config_1.config.userAddress}`);
        });
    }
}
exports.HealthMonitorService = HealthMonitorService;
//# sourceMappingURL=health-monitor.service.js.map