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
        res.setHeader('Content-Type', 'text/plain');
        res.send(healthFactor.toString());
      } catch (error: any) {
        console.error('Error fetching health factor:', error?.message || error);
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

    // Post-execution verification endpoint
    this.app.post('/verify-execution/:address', async (req, res) => {
      try {
        const { address } = req.params;
        
        // Wait for transaction confirmation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const healthFactor = await this.aaveService.getHealthFactor(address);
        const accountData = await this.aaveService.getUserAccountDetails(address);
        
        const result = {
          timestamp: new Date().toISOString(),
          address,
          healthFactor,
          accountData,
          safe: healthFactor > config.healthFactorThreshold
        };
        
        res.json(result);
      } catch (error: any) {
        console.error('Verification error:', error.message);
        res.status(500).json({ error: 'Failed to verify execution' });
      }
    });

    // Get endpoint version for verification (can be called via GET)
    this.app.get('/verify-execution/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const healthFactor = await this.aaveService.getHealthFactor(address);
        const accountData = await this.aaveService.getUserAccountDetails(address);
        
        const result = {
          timestamp: new Date().toISOString(),
          address,
          healthFactor,
          accountData,
          safe: healthFactor > config.healthFactorThreshold
        };
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to verify execution' });
      }
    });
  }

  start(port: number = 3000) {
    this.app.listen(port, () => {
      console.log(`Health monitor API running on port ${port}`);
      console.log(`TriggerX endpoint: http://localhost:${port}/health-factor/${config.userAddress}`);
      console.log(`Debug endpoint: http://localhost:${port}/debug-health/${config.userAddress}`);
      console.log(`Verification endpoint: http://localhost:${port}/verify-execution/${config.userAddress}`);
    });
  }
}
