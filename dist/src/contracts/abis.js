"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WETH_ADDRESS = exports.ERC20_ABI = exports.AAVE_POOL_ABI = void 0;
// src/contracts/abis.ts
exports.AAVE_POOL_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "asset", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "address", "name": "onBehalfOf", "type": "address" },
            { "internalType": "uint16", "name": "referralCode", "type": "uint16" }
        ],
        "name": "supply",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getUserAccountData",
        "outputs": [
            { "internalType": "uint256", "name": "totalCollateralBase", "type": "uint256" },
            { "internalType": "uint256", "name": "totalDebtBase", "type": "uint256" },
            { "internalType": "uint256", "name": "availableBorrowsBase", "type": "uint256" },
            { "internalType": "uint256", "name": "currentLiquidationThreshold", "type": "uint256" },
            { "internalType": "uint256", "name": "ltv", "type": "uint256" },
            { "internalType": "uint256", "name": "healthFactor", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
exports.ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
// WETH address on Sepolia
exports.WETH_ADDRESS = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14';
//# sourceMappingURL=abis.js.map