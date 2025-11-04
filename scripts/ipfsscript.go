package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

func main() {
	// Configuration
	const safeAddress = "0xC9C19C9d84Bf5f6AF1047DE5a0B5cb2aBf90D5F2"
	const aavePool = "0xb50201558B00496A145fE76f7424749556E326D8"      // Aave Pool on Optimism Sepolia
	const wethAddress = "0x4200000000000000000000000000000000000006"  // WETH

	// Supply 0.01 ETH worth of WETH to Aave
	amountIn := big.NewInt(10_000_000_000_000_000) // 0.01 ETH (18 decimals)

	// Define the supply function ABI
	supplyABI, err := abi.JSON(strings.NewReader(`[{
		"type": "function",
		"name": "supply",
		"inputs": [
			{"name": "asset", "type": "address"},
			{"name": "amount", "type": "uint256"},
			{"name": "onBehalfOf", "type": "address"},
			{"name": "referralCode", "type": "uint16"}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	}]`))
	if err != nil {
		panic(fmt.Sprintf("Failed to parse ABI: %v", err))
	}

	// Pack the supply function call
	supplyData, err := supplyABI.Pack(
		"supply",
		common.HexToAddress(wethAddress),         // asset
		amountIn,                                  // amount
		common.HexToAddress(safeAddress),         // onBehalfOf
		uint16(0),                                // referralCode
	)
	if err != nil {
		panic(fmt.Sprintf("Failed to pack supply data: %v", err))
	}

	// Create arguments array for Safe.execJobFromHub
	args := []interface{}{
		safeAddress,                            // safeAddress
		aavePool,                               // actionTarget (Aave Pool)
		"0",                                    // actionValue (0 ETH - we're supplying WETH not ETH)
		"0x" + hex.EncodeToString(supplyData), // actionData
		0,                                      // operation (0 = CALL)
	}

	// Output JSON
	output, err := json.MarshalIndent(args, "", "  ")
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal JSON: %v", err))
	}
	
	fmt.Println(string(output))
}