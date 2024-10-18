import { Raydium } from "@raydium-io/raydium-sdk-v2";
import {
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "redis";
import { getPoolDBData, PoolDBData } from "./poolInfo";

export const updateAccounts = async (
  raydium: Raydium,
  redisClient: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >
) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextAmm = await redisClient.lPop("update_queue");
    if (!nextAmm) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    const poolDbData = await redisClient.json.get(
      "pools:" + nextAmm.toString()
    );
    if (!poolDbData) {
      console.error("Pool not found in DB");
      return [];
    }
    if (typeof poolDbData !== "string") {
      console.error("Invalid pool data in DB");
      return [];
    }
    const poolDataJson: PoolDBData = JSON.parse(poolDbData);
    const ammData = await getPoolDBData(raydium, poolDataJson);
    redisClient.json.set(
      "pools:" + nextAmm.toString(),
      "$",
      JSON.stringify(ammData)
    );
    console.log("Updated pool: ", nextAmm);
  }
};
