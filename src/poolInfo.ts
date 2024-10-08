import {
  Raydium,
  getMultipleAccountsInfoWithCustomFlags,
  liquidityStateV4Layout,
  AmmRpcData,
  toAmmComputePoolInfo,
  AmmV4Keys,
  AmmV5Keys,
  Structure,
  CpmmPoolInfoInterface,
  LiquidityStateLayoutV4,
  LiquidityStateV4,
  PoolFetchType,
  PoolsApiReturn,
} from "@raydium-io/raydium-sdk-v2";
import { AccountLayout } from "@solana/spl-token";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Decimal } from "decimal.js";
import { config } from "process";
import {
  RedisClientType,
  RedisDefaultModules,
  RedisModules,
  RedisFunctions,
  RedisScripts,
} from "redis";

export type PoolDBData = {
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

export const getTemplateFullAmmData = (
  buff: string,
  accountId: PublicKey
): PoolDBData => {
  return {
    rpcData: buff,
    baseReserve: "0",
    mintAAmount: "0",
    mintBAmount: "0",
    quoteReserve: "0",
    poolPrice: "0",
    lastUpdated: 0,
    isValid: false,
    accountId: accountId,
    programId: new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
  };
};

export const dbDataToRpcData = (data: PoolDBData): AmmRpcData => {
  const buff = Buffer.from(data.rpcData, "base64");
  const poolInfo = liquidityStateV4Layout.decode(buff);
  return {
    ...poolInfo,
    baseReserve: new BN(data.baseReserve),
    quoteReserve: new BN(data.quoteReserve),
    mintAAmount: new BN(data.mintAAmount),
    mintBAmount: new BN(data.mintBAmount),
    poolPrice: new Decimal(data.poolPrice),
    programId: data.programId,
  };
};

export const rpcDataToDbData = (
  data: AmmRpcData,
  accountId: PublicKey
): PoolDBData => {
  const buff = Buffer.alloc(liquidityStateV4Layout.span);
  liquidityStateV4Layout.encode(data, buff);
  return {
    rpcData: buff.toString("base64"),
    baseReserve: data.baseReserve.toString(),
    quoteReserve: data.quoteReserve.toString(),
    mintAAmount: data.mintAAmount.toString(),
    mintBAmount: data.mintBAmount.toString(),
    poolPrice: data.poolPrice.toString(),
    lastUpdated: Date.now(),
    isValid: true,
    accountId: accountId,
    programId: data.programId,
  };
};

export const getVaults = async (data: PoolDBData) => {
  const poolInfo = dbDataToRpcData(data);
  return [poolInfo.baseVault, poolInfo.quoteVault];
};

export const getPoolDBData = async (
  raydium: Raydium,
  oldData: PoolDBData,
  config?: { batchRequest?: boolean; chunkCount?: number }
): Promise<PoolDBData> => {
  const needFetchVaults = await getVaults(oldData);
  const vaultAccountInfo = await getMultipleAccountsInfoWithCustomFlags(
    raydium.connection,
    needFetchVaults.map((i) => ({ pubkey: new PublicKey(i) })),
    config
  );
  const accountInfos: AccountInfo<Buffer>[] = vaultAccountInfo.map((i) => {
    if (i.accountInfo === null) {
      throw Error("fetch vault info error");
    }
    return i.accountInfo;
  });
  const newDbData = getNewDbDataFromFetchedVaults(
    oldData,
    accountInfos[0],
    accountInfos[1]
  );
  return newDbData;
};

const getNewDbDataFromFetchedVaults = (
  oldData: PoolDBData,
  baseAccountInfo: AccountInfo<Buffer>,
  quoteAccountInfo: AccountInfo<Buffer>
): PoolDBData => {
  const poolInfo = dbDataToRpcData(oldData);
  if (baseAccountInfo === null || quoteAccountInfo === null)
    throw Error("fetch vault info error");
  const mintAAmount = new BN(
    AccountLayout.decode(baseAccountInfo.data).amount.toString()
  );
  const mintBAmount = new BN(
    AccountLayout.decode(quoteAccountInfo.data).amount.toString()
  );
  const baseReserve = mintAAmount.sub(poolInfo.baseNeedTakePnl);
  const quoteReserve = mintBAmount.sub(poolInfo.quoteNeedTakePnl);
  console.log(oldData.accountId);
  console.log("baseReserve", baseReserve.toString());
  console.log("quoteReserve", quoteReserve.toString());
  console.log("mintAAmount", mintAAmount.toString());
  console.log("mintBAmount", mintBAmount.toString());
  return {
    ...oldData,
    baseReserve: baseReserve.toString(),
    mintAAmount: mintAAmount.toString(),
    mintBAmount: mintBAmount.toString(),
    quoteReserve: quoteReserve.toString(),
    poolPrice: new Decimal(quoteReserve.toString())
      .div(new Decimal(10).pow(poolInfo.quoteDecimal.toString()))
      .div(
        new Decimal(baseReserve.toString()).div(
          new Decimal(10).pow(poolInfo.baseDecimal.toString())
        )
      )
      .toString(),
    lastUpdated: Date.now(),
    isValid: true,
  };
};

const loadFromRaydiumSdk = async (
  raydium: Raydium,
  redisClient: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >,
  minPoolVol: number
) => {
  let hasNextPage = true;
  let page = 0;
  console.log("Fetching pools");
  while (hasNextPage) {
    page += 1;
    try {
      const data: PoolsApiReturn = await raydium.api.getPoolList({
        type: PoolFetchType.Standard,
        sort: "volume24h",
        order: "desc",
        pageSize: 500,
        page: page,
      });
      data.data.forEach((pool) => {
        redisClient.json.set("pools:" + pool.id, "$", JSON.stringify(pool));
      });
      console.log("fetched ", data.data.length, " pools");
      hasNextPage = data.hasNextPage;
      if (hasNextPage && data.data[0].day.volume < minPoolVol) {
        console.log(
          "Stopping fetching pools as volume is less than minPoolVol: ",
          minPoolVol
        );
        hasNextPage = false;
      }
    } catch (error) {
      console.error("Error fetching pools", error);
      return;
    }
  }
  console.log("Finished fetching pools");
};
// import * as base64 from "base64-js";
// import { decode } from "@project-serum/anchor/dist/utils/bytes/base64";

// // Define the structure of the logs in TypeScript
// type SwapBaseInLog = {
//   log_type: number;
//   max_in: bigint;
//   amount_out: bigint;
//   direction: bigint;
//   user_source: bigint;
//   pool_coin: bigint;
//   pool_pc: bigint;
//   out_amount: bigint;
// };

// type SwapBaseOutLog = {
//   log_type: number;
//   max_in: bigint;
//   amount_out: bigint;
//   direction: bigint;
//   user_source: bigint;
//   pool_coin: bigint;
//   pool_pc: bigint;
//   deduct_in: bigint;
// };

// type SwapLog = SwapBaseInLog | SwapBaseOutLog;

// export const streamLogs = (raydium: Raydium): number => {
//   const connection = raydium.connection;
//   const subId = connection.onLogs(
//     new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
//     async (logs, ctx) => {
//       if (logs.err) {
//         return;
//       }
//       for (const log of logs.logs) {
//         // if log containt substring ray_log, isolate everything after that. if it is not present, return
//         // it will not start with ray_log, but may or may not contain it
//         const ind = log.indexOf("ray_log: ");
//         if (ind === -1) {
//           continue;
//         }
//         const logData = log.slice(ind + 9);
//         const bytes = base64.toByteArray(logData);
//         const buffer = Buffer.from(bytes);

//         // Manually decode the bytes to match the Rust structure
//         const logType = buffer.readUInt8(0);
//         let decoded: SwapLog;
//         if (logType === 4) {
//           decoded = {
//             log_type: buffer.readUInt8(0),
//             max_in: buffer.readBigUInt64LE(1),
//             amount_out: buffer.readBigUInt64LE(9),
//             direction: buffer.readBigUInt64LE(17),
//             user_source: buffer.readBigUInt64LE(25),
//             pool_coin: buffer.readBigUInt64LE(33),
//             pool_pc: buffer.readBigUInt64LE(41),
//             deduct_in: buffer.readBigUInt64LE(49),
//           };
//         } else if (logType === 3) {
//           decoded = {
//             log_type: buffer.readUInt8(0),
//             max_in: buffer.readBigUInt64LE(1),
//             amount_out: buffer.readBigUInt64LE(9),
//             direction: buffer.readBigUInt64LE(17),
//             user_source: buffer.readBigUInt64LE(25),
//             pool_coin: buffer.readBigUInt64LE(33),
//             pool_pc: buffer.readBigUInt64LE(41),
//             out_amount: buffer.readBigUInt64LE(49),
//           };
//         } else {
//           continue;
//         }
//         console.log(decoded);
//       }
//     },
//     "confirmed"
//   );
//   return subId;
// };
