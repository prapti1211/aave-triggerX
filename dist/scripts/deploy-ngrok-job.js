"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_triggerx_1 = require("sdk-triggerx");
const ethers_1 = require("ethers");
const config_1 = require("../src/utils/config");
async function deployNgrokJob() {
    console.log('Deploying TriggerX job with ngrok public URL...');
    // Use env if provided to avoid hardcoding changing tunnels
    const ngrokUrl = (process.env.PUBLIC_URL || 'https://unrecognized-conjunctionally-madelyn.ngrok-free.dev').trim();
    console.log(`Using ngrok URL: ${ngrokUrl}`);
    const client = new sdk_triggerx_1.TriggerXClient(config_1.config.triggerxApiKey, {
        timeout: 90000 // 90 seconds for slow IPFS fetches
    });
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpcUrl);
    const signer = new ethers_1.ethers.Wallet(config_1.config.privateKey, provider);
    try {
        // Validate Safe wallet address
        if (!config_1.config.safeWalletAddress) {
            console.error('[ERROR] SAFE_WALLET_ADDRESS not found in .env file!');
            console.log('\nPlease add your Safe wallet address to .env:');
            console.log('SAFE_WALLET_ADDRESS=0xYourSafeWalletAddressHere');
            process.exit(1);
        }
        console.log('Using Safe wallet:', config_1.config.safeWalletAddress);
        // Create job input with safeAddress
        const jobInput = {
            jobType: sdk_triggerx_1.JobType.Condition,
            argType: sdk_triggerx_1.ArgType.Dynamic,
            jobTitle: 'Auto Supply to Aave',
            timeFrame: 90,
            recurring: false,
            conditionType: 'less_equal',
            upperLimit: 10,
            lowerLimit: config_1.config.healthFactorThreshold,
            valueSourceType: 'api',
            valueSourceUrl: `${ngrokUrl}/health-factor/${config_1.config.userAddress}`,
            timezone: 'UTC',
            chainId: config_1.config.chainId,
            // REQUIRED: Add Safe wallet configuration from env
            walletMode: 'safe',
            safeAddress: config_1.config.safeWalletAddress,
            dynamicArgumentsScriptUrl: 'https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreidgobokf2nkg6lj34httfajpuvbuts3ai6t264bdmuig6aodd2bzi',
            autotopupTG: true,
        };
        // Step 2.5: Check provider/network reachability before job creation
        try {
            const netStart = Date.now();
            const net = await provider.getNetwork();
            const netLatency = Date.now() - netStart;
            console.log('RPC network OK:', { chainId: Number(net.chainId), latencyMs: netLatency });
        }
        catch (netErr) {
            console.error('RPC network check failed - this can cause job creation to fail');
            console.error('   rpcUrl:', config_1.config.rpcUrl);
            console.error('   code:', netErr?.code);
            console.error('   message:', netErr?.message);
        }
        // Step 3: Validate URL
        console.log('Validating URL...');
        console.log('Full API URL:', jobInput.valueSourceUrl);
        try {
            new URL(jobInput.valueSourceUrl);
            console.log('URL format is valid');
        }
        catch (urlError) {
            console.error('Invalid URL format:', urlError);
            return;
        }
        // Step 3.1: Preflight check to the public endpoint
        try {
            const controller = new AbortController();
            const timeoutMs = 6000;
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const startedAt = Date.now();
            console.log('Probing value source URL (timeout', timeoutMs + 'ms' + '):');
            const res = await fetch(jobInput.valueSourceUrl, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);
            const latencyMs = Date.now() - startedAt;
            const text = await res.text().catch(() => '<non-text body>');
            console.log('   - status:', res.status);
            console.log('   - latencyMs:', latencyMs);
            console.log('   - body:', text.slice(0, 200));
        }
        catch (probeErr) {
            console.error('Preflight to public endpoint failed. This can cause TriggerX to time out.');
            console.error('   probe.code:', probeErr?.code);
            console.error('   probe.name:', probeErr?.name);
            console.error('   probe.message:', probeErr?.message);
            if (probeErr?.name === 'AbortError') {
                console.error('   The request exceeded the timeout.');
            }
        }
        const result = await (0, sdk_triggerx_1.createJob)(client, { jobInput, signer });
        console.log('Fixed ngrok job created successfully!');
        console.log('Job Result:', result);
        if (!result.success) {
            console.error('Job creation reported failure. Detailed diagnostics:');
            try {
                const details = result.details || {};
                const originalError = details.originalError || details.error || {};
                console.error(' error:', result.error);
                console.error(' errorCode:', result.errorCode);
                console.error(' httpStatusCode:', result.httpStatusCode);
                console.error(' errorType:', result.errorType);
                console.error(' details:', JSON.stringify(details, null, 2));
                if (originalError) {
                    console.error(' originalError.code:', originalError.code);
                    console.error(' originalError.message:', originalError.message);
                    console.error(' originalError.stack:', originalError.stack);
                }
            }
            catch (logErr) {
                console.error('Failed to log detailed error info:', logErr);
            }
        }
        if (result.success && result.data?.job_ids) {
            console.log('- New Job ID:', result.data.job_ids[0]);
        }
    }
    catch (error) {
        console.error('Error creating job (exception thrown):');
        console.error(error);
        if (error && typeof error === 'object') {
            const anyErr = error;
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
//# sourceMappingURL=deploy-ngrok-job.js.map