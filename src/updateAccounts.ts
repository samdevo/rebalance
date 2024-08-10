import { LiquidityStateV4, Raydium } from "@raydium-io/raydium-sdk-v2";
import {
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "redis";
import { getPoolDBData, PoolDBData } from "./poolInfo";
import { PublicKey } from "@solana/web3.js";

export const updateAccounts = async (
  raydium: Raydium,
  redisClient: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >
) => {
  // rate limit to 3 requests per second
//   let lastUpdate = Date.now();
//   let counter = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextAmm = await redisClient.lPop("update_queue");
    if (!nextAmm) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    // while (counter >= 3) {
    //   if (Date.now() - lastUpdate > 1000) {
    //     counter = 0;
    //     lastUpdate = Date.now();
    //   }
    // }
    // counter++;
    const poolDbData = await redisClient.json.get("pools:" + nextAmm.toString());
    if (!poolDbData) {
        console.error("Pool not found in DB");
        return [];
    }
    if (typeof poolDbData !== "string") {
        console.error("Invalid pool data in DB");
        return [];
    }
    const poolDataJson: PoolDBData = JSON.parse(poolDbData);
    const ammData = await getPoolDBData(
      raydium,
      poolDataJson,
    );
    redisClient.json.set(
      "pools:" + nextAmm.toString(),
      "$",
      JSON.stringify(ammData)
    );
    console.log("Updated pool: ", nextAmm);
  }
};
