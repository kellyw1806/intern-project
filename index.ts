import { ethers } from 'ethers'; 
import { BigNumber } from 'ethers';
import { ETH, USDC, WETH } from './tokens';
import { EthereumConstants } from './chains';
// as per the UniSwap Docs, we can find the ABI by importing this 
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'


const FROM_TOKEN = USDC;
const FROM_BALANCE = BigNumber.from('1000000'); 
const TO_TOKEN = ETH;
const WRAPPED_TO_TOKEN = WETH;

(async () => {
  console.info(`Converting ${FROM_BALANCE.toString()} ${FROM_TOKEN.symbol} to ${TO_TOKEN.symbol}`);

  // Get the contract for a DEX.
  const uniV2Address = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
  const uniABI = IUniswapV2Router02.abi

  // only need to find provider since we do not need to make transactions
  // if we did, I would find signer using provider.getSigner()
  const provider = ethers.providers.jsonRpcProvider(EthereumConstants.RPC_URL)
  
  // create an instance of the contract 
  const contractInstance = new ethers.Contract(uniV2Address, uniABI, provider)
 
  // Use ethers and the DEX contract to figure out how much TO_TOKEN you can get
  // for the FROM_TOKEN.

  const addressPair = await contractInstance.getPair(FROM_TOKEN.address, WRAPPED_TO_TOKEN.address)
  const contractPair = new ethers.Contract(addressPair, uniABI, provider)

  // i chose to use getAmountsOut since it also calculates 
  // the amount of one token to the other
  // if i wanted to find the ratio, i would have used reserves 

  const tokenAmt = await contractInstance.getAmountsOut(FROM_BALANCE, [FROM_TOKEN.address, WRAPPED_TO_TOKEN.address, TO_TOKEN.address])
  

  // TODO:

  // the estimated swap balance should be the very last value of the array 
  const swapBalance = tokenAmt[tokenAmt.length - 1];

  console.info(`Estimated swap balance: ${swapBalance.toString()} ${TO_TOKEN.symbol}`);

  // Figure out spot values of tokens.
  // used CoinGecko since CoinGecko was used when describing the tokens in tokens.ts
  const response = await ethers.utils.fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${FROM_TOKEN.coingecko},${TO_TOKEN.coingecko}&vs_currencies=usd`)
  
  const fromPrice = response[FROM_TOKEN.coingecko].usd
  const toPrice = response[TO_TOKEN.coingecko].usd

  // Calculate slippage on the swap.
  // TODO:
  const inAmt = parseFloat(fromPrice) * parseFloat(ethers.utils.formatUnits(FROM_BALANCE, FROM_TOKEN.decimals))
  const outAmt = parseFloat(toPrice) * parseFloat(ethers.utils.formatUnits(swapBalance, TO_TOKEN.decimals))

  const slippagePercent = ((outAmt - inAmt) / inAmt) 

  console.info(`Slippage: ${slippagePercent * 100}%`);
})();







