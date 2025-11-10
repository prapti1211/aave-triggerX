"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainIdNumber = exports.config = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.config = {
    privateKey: process.env.PRIVATE_KEY,
    triggerxApiKey: process.env.TRIGGERX_API_KEY,
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    chainId: process.env.CHAIN_ID,
    userAddress: process.env.USER_ADDRESS,
    safeWalletAddress: process.env.SAFE_WALLET_ADDRESS, // Optional: Pre-existing Safe wallet
    aave: {
        poolAddress: process.env.AAVE_POOL_ADDRESS,
        dataProvider: process.env.AAVE_POOL_DATA_PROVIDER,
    },
    healthFactorThreshold: 1.2, // Trigger when health factor drops below 1.2
    topUpAmount: '10000000000000000', // 0.01 ETH in wei
    jobDuration: 300, // 5 minutes
};
// Optionally expose numeric chainId for libraries that require a number
exports.chainIdNumber = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
//# sourceMappingURL=config.js.map