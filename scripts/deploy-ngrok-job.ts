import { TriggerXClient, createJob, JobType, ArgType } from 'sdk-triggerx';
import { createSafeWallet } from 'sdk-triggerx/dist/api/safeWallet.js';
import { ethers } from 'ethers';
import { config } from '../src/utils/config';
import { AAVE_POOL_ABI, WETH_ADDRESS } from '../src/contracts/abis';

async function deployNgrokJob() {
    console.log('🌐 Deploying TriggerX job with ngrok public URL...');

    // 🔥 Use env if provided to avoid hardcoding changing tunnels
    const ngrokUrl = (process.env.PUBLIC_URL || 'https://unrecognized-conjunctionally-madelyn.ngrok-free.dev').trim();

    console.log(`Using ngrok URL: ${ngrokUrl}`);

    const client = new TriggerXClient(config.triggerxApiKey, {
        timeout: 90000 // 90 seconds for slow IPFS fetches
      });
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);

    try {
    // Create job input with safeAddress
        const jobInput = {
            jobType: JobType.Condition,
            argType: ArgType.Dynamic,
            jobTitle: 'Auto Supply to Aave',
            timeFrame: 90,
            recurring: false,
            conditionType: 'less_equal' as const,
            upperLimit: 10,
            lowerLimit: 1.05,
            valueSourceType: 'api' as const,
            valueSourceUrl: `${ngrokUrl}/health-factor/${config.userAddress}`,
            timezone: 'UTC',
            chainId: '11155420',
            
            // ✅ REQUIRED: Add Safe wallet configuration
            walletMode: 'safe' as const,
            safeAddress: "0xC9C19C9d84Bf5f6AF1047DE5a0B5cb2aBf90D5F2",
            dynamicArgumentsScriptUrl: 'https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreidgobokf2nkg6lj34httfajpuvbuts3ai6t264bdmuig6aodd2bzi',
            autotopupTG: true,
        };

        // Step 2.5: Check provider/network reachability before job creation
        try {
            const netStart = Date.now();
            const net = await provider.getNetwork();
            const netLatency = Date.now() - netStart;
            console.log('🔗 RPC network OK:', { chainId: Number(net.chainId), latencyMs: netLatency });
        } catch (netErr: any) {
            console.error('❌ RPC network check failed - this can cause job creation to fail');
            console.error('   rpcUrl:', config.rpcUrl);
            console.error('   code:', netErr?.code);
            console.error('   message:', netErr?.message);
        }

        // Step 3: Validate URL
        console.log('🔍 Validating URL...');
        console.log('Full API URL:', jobInput.valueSourceUrl);
        
        try {
            new URL(jobInput.valueSourceUrl);
            console.log('✅ URL format is valid');
        } catch (urlError) {
            console.error('❌ Invalid URL format:', urlError);
            return;
        }

        // Step 3.1: Preflight check to the public endpoint
        try {
            const controller = new AbortController();
            const timeoutMs = 6000;
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const startedAt = Date.now();
            console.log('🌐 Probing value source URL (timeout', timeoutMs + 'ms' + '):');
            const res = await fetch(jobInput.valueSourceUrl, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);
            const latencyMs = Date.now() - startedAt;
            const text = await res.text().catch(() => '<non-text body>');
            console.log('   - status:', res.status);
            console.log('   - latencyMs:', latencyMs);
            console.log('   - body:', text.slice(0, 200));
        } catch (probeErr: any) {
            console.error('❌ Preflight to public endpoint failed. This can cause TriggerX to time out.');
            console.error('   probe.code:', probeErr?.code);
            console.error('   probe.name:', probeErr?.name);
            console.error('   probe.message:', probeErr?.message);
            if (probeErr?.name === 'AbortError') {
                console.error('   The request exceeded the timeout.');
            }
        }

        const result = await createJob(client, { jobInput, signer });
        console.log('✅ Fixed ngrok job created successfully!');
        console.log('Job Result:', result);

        if (!result.success) {
            console.error('❌ Job creation reported failure. Detailed diagnostics:');
            try {
                const details = (result as any).details || {};
                const originalError = details.originalError || details.error || {};
                console.error(' error:', (result as any).error);
                console.error(' errorCode:', (result as any).errorCode);
                console.error(' httpStatusCode:', (result as any).httpStatusCode);
                console.error(' errorType:', (result as any).errorType);
                console.error(' details:', JSON.stringify(details, null, 2));
                if (originalError) {
                    console.error(' originalError.code:', originalError.code);
                    console.error(' originalError.message:', originalError.message);
                    console.error(' originalError.stack:', originalError.stack);
                }
            } catch (logErr) {
                console.error('Failed to log detailed error info:', logErr);
            }
        }

        if (result.success && result.data?.job_ids) {
            console.log('- New Job ID:', result.data.job_ids[0]);
        }

    } catch (error) {
        console.error('❌ Error creating job (exception thrown):');
        console.error(error);
        if (error && typeof error === 'object') {
            const anyErr: any = error;
            console.error(' code:', anyErr.code);
            console.error(' message:', anyErr.message);
            console.error(' stack:', anyErr.stack);
            if (anyErr.response) {
                console.error(' response.status:', anyErr.response.status);
                console.error(' response.data:', anyErr.response.data);
            }
        }
    }
}

deployNgrokJob().catch(console.error);
