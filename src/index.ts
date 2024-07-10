import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { PoolFetchType, Raydium } from '@raydium-io/raydium-sdk-v2';
// import {getAssociatedTokenAddressSync} from '@solana/spl-token';
import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { Token, Tokens, loadTokens } from './utils';



async function main() {
    const tokens: Tokens = loadTokens();
    const rpc: string = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc);
    const raydium = await Raydium.load({
        connection: connection,
    })
    const pools = await raydium.api.fetchPoolByMints({
        mint1: tokens.bySymbol["SOL"].address,
        // mint1: "So11111111111111111111111111111111111111112"
        mint2: tokens.bySymbol["USDC"].address,
        type: PoolFetchType.Standard
    })

    console.log(pools)
}


main().catch(error => {
    console.error('Error:', error);
});