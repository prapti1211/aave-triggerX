import express from 'express';
import { AaveService } from './aave.service';
import { config } from '../utils/config';

export class HealthMonitorService {
  private aaveService: AaveService;
  private app: express.Application;

  constructor() {
    this.aaveService = new AaveService();
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes() {
    // TriggerX compatible endpoint - returns plain number
    this.app.get('/health-factor/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const healthFactor = await this.aaveService.getHealthFactor(address);
        
        // Return just the number for TriggerX
        res.setHeader('Content-Type', 'text/plain');
        res.send(healthFactor.toString());
      } catch (error) {
        res.status(500).send('0');
      }
    });

    // Debug endpoint with full JSON
    this.app.get('/debug-health/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const healthFactor = await this.aaveService.getHealthFactor(address);
        
        res.json({
          address,
          healthFactor,
          timestamp: Date.now(),
          safe: healthFactor > config.healthFactorThreshold
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch health factor' });
      }
    });

    this.app.get('/account-data/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const accountData = await this.aaveService.getUserAccountDetails(address);
        res.json(accountData);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account data' });
      }
    });
  }

  start(port: number = 3000) {
    this.app.listen(port, () => {
      console.log(`🚀 Health monitor API running on port ${port}`);
      console.log(`📡 TriggerX endpoint: http://localhost:${port}/health-factor/${config.userAddress}`);
      console.log(`🐛 Debug endpoint: http://localhost:${port}/debug-health/${config.userAddress}`);
    });
  }
}
