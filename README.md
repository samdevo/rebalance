# Rebalance

## Usage:

1. Install docker
2. Set `RPC_ENDPOINT` and `WSS_ENDPOINT` in `compose.yaml` to a valid Solana RPC and WSS endpoint
3. Run `docker-compose up --build`

## More info

### AMMs supported currently

- Raydium AMM v4

Data structure stored in Redis (see `pooldb-updater/src/poolInfo.ts`):
```typescript
type PoolDBData = {
  rpcData: string;
  baseReserve: string;
  quoteReserve: string;
  mintAAmount: string;
  mintBAmount: string;
  poolPrice: string;
  lastUpdated: number;
  isValid: boolean;
  accountId: PublicKey;
  programId: PublicKey;
};
```

### Where to find pools

- "pools" key in Redis, stored as RedisJSON

