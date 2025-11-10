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
      const startedAt = Date.now();
      try {
        const { address } = req.params;
        const healthFactor = await this.aaveService.getHealthFactor(address);
        const latency = Date.now() - startedAt;
        console.log(`[HF] ${address} -> ${healthFactor} (${latency}ms)`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(healthFactor.toString());
      } catch (error: any) {
        const latency = Date.now() - startedAt;
        console.error('[HF] error:', { code: error?.code, message: error?.message, latency });
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
        const startTime = Date.now();
        
        console.log('\n[VERIFICATION] Job execution detected, checking health factor...');
        
        // Wait a bit for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const healthFactor = await this.aaveService.getHealthFactor(address);
        const accountData = await this.aaveService.getUserAccountDetails(address);
        const latency = Date.now() - startTime;
        
        const result = {
          timestamp: new Date().toISOString(),
          address,
          healthFactor,
          accountData,
          safe: healthFactor > config.healthFactorThreshold,
          latencyMs: latency
        };
        
        console.log('\n[VERIFICATION] Post-execution health check:');
        console.log('──────────────────────────────────────────────────────');
        console.log('Time:', result.timestamp);
        console.log('Health Factor:', healthFactor);
        console.log('Total Collateral:', accountData.totalCollateral, 'ETH');
        console.log('Total Debt:', accountData.totalDebt, 'ETH');
        console.log('Status:', result.safe ? 'SAFE' : 'STILL AT RISK');
        console.log('──────────────────────────────────────────────────────\n');
        
        res.json(result);
      } catch (error: any) {
        console.error('[VERIFICATION] Error:', error.message);
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
        
        console.log('[VERIFICATION] Manual health check for:', address);
        console.log('Health Factor:', healthFactor, '| Safe:', result.safe);
        
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
