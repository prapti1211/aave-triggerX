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
  // FIXED safe address
  const safeAddress = "0xC9C19C9d84Bf5f6AF1047DE5a0B5cb2aBf90D5F2"
  const target = "0xb50201558B00496A145fE76f7424749556E326D8"          // target contract address
  const tokenIn = "0x4200000000000000000000000000000000000006"        // WETH (Optimism Sepolia)
  const tokenOut = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"        // USDC (Optimism Sepolia)
	fee := big.NewInt(3000)   
  
   vm.deal(SAFE_ADDRESS, 1 ether);// 0.3%


  // Dynamic inputs - swapping ETH to USDC
  amountIn := big.NewInt(10_000_000_000_000_000) // 0.01 ETH (18 decimals)
 
  // Set minimum output amount directly (no quote needed)
  minOut := big.NewInt(0) // Set to 0 wei as minimum


  
  supply, _ := abi.JSON(strings.NewReader(`[
    {"type":"function","name":"supply","inputs":[
      {"name":"asset","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"onBehalfOf","type":"address"},
      {"name":"referralCode","type":"uint16"}
    ],"outputs":[],"stateMutability":"nonpayable"}
  ]`))

  type SupplyParams struct {
    Asset         common.Address
    Amount        *big.Int
    OnBehalfOf    common.Address
    ReferralCode  uint16
}

supplyParams := SupplyParams{
    Asset:        common.HexToAddress(tokenIn), 
    Amount:       amountIn,
    OnBehalfOf:   common.HexToAddress(safeAddress),
    ReferralCode: 0, // typically 0 if no referral
}

supplyData, err := supply.Pack("supply", supplyParams.Asset, supplyParams.Amount, supplyParams.OnBehalfOf, supplyParams.ReferralCode)
if err != nil {
    panic(fmt.Sprintf("Failed to pack supply data: %v", err))
}


  // Create array of arguments for direct call to target (no MultiSend needed)
  args := []interface{}{
      safeAddress,                                    // safeAddress
      target,                                         // actionTarget (direct call to target)
      amountIn.String(),                              // actionValue (ETH amount to send)
      "0x" + hex.EncodeToString(supplyData),           // actionData (supply function call)
      0,                                             // operation (CALL)
  }


  out, _ := json.MarshalIndent(args, "", "  ")
  fmt.Println(string(out))
}




