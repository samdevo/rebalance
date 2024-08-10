import {
  createClient,
  RedisClientType,
  RedisDefaultModules,
  RediSearchSchema,
  RedisFunctions,
  RedisModules,
  RedisScripts,
  SchemaFieldTypes,
} from "redis";
// import { PoolUpdater } from "./redis_ops";
import { web3 } from "@project-serum/anchor";
import {
  AmmRpcData,
  ApiV3PoolInfoStandardItem,
  LiquidityStateV4,
  liquidityStateV4Layout,
  PoolFetchType,
  PoolsApiReturn,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import dotenv from "dotenv";
import { PublicKey, KeyedAccountInfo } from "@solana/web3.js";
import { parseAccountUpdateAmmV4 } from "./stream";
// import { getTemplateFullAmmData } from "./poolInfo";
// import { updateAccounts } from "./updateAccounts";
import { BN } from "bn.js";
import { getTemplateFullAmmData, PoolDBData, rpcDataToDbData } from "./poolInfo";
import { updateAccounts } from "./updateAccounts";

dotenv.config();

const main = async () => {
  const redisClient = createClient();
  await setupClient(redisClient);
  await redisClient.flushAll();
  let counter = 0;

  console.log("DB Flushed. Connecting to RPC endpoint and loading pools");
  const connection = new web3.Connection(process.env.RPC_ENDPOINT as string, {
    wsEndpoint: process.env.WSS_ENDPOINT as string,
    commitment: "confirmed",
  });
  const raydium = await Raydium.load({
    connection: connection,
  });
  const subId = raydium.connection.onProgramAccountChange(
    new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
    async (data) => {
      // check if is in redis already
      const ammData = await redisClient.json.get(
        "pools:" + data.accountId.toString()
      );
      // console.log(ammData)
      if (ammData) {
        // set ammData.isValid = false
        await redisClient.json.set(
          "pools:" + data.accountId.toString(),
          "$.isValid",
          false
        ); // update rpcData
        await redisClient.json.set(
          "pools:" + data.accountId.toString(),
          "$.rpcData",
          JSON.stringify(liquidityStateV4Layout.decode(data.accountInfo.data))
        );
      } else {
        // console.log("New pool found, adding to DB");
        const decodedAmm = liquidityStateV4Layout.decode(data.accountInfo.data);
        const json = data.accountInfo.data.toString("base64")
        

        if (!decodedAmm.status.eq(new BN(6)))
          return;
        counter++
        // console.log(decodedAmm)
        // console.log("made it")
        // const encoded = JSON.stringify(decodedAmm);
        // const decodedAgain: LiquidityStateV4 = JSON.parse(encoded);
        // console.log("starting")
        // console.log(decodedAmm);
        // console.log(encoded)
        // console.log(decodedAgain);
        // console.log(decodedAmm.maxOrder.toBuffer());
        // console.log(decodedAmm.maxOrder.toString());
        // console.log(decodedAmm.maxOrder.toJSON());
        // console.log(decodedAmm.maxOrder.toNumber());
        // throw new Error("stop")
        const templateData: PoolDBData = getTemplateFullAmmData(json, data.accountId);
        await redisClient.json.set(
          "pools:" + data.accountId.toString(),
          "$",
          JSON.stringify(templateData)
        );
      }
      // add to update queue
      await redisClient.rPush("update_queue", data.accountId.toString());
    },
    {
      encoding: "base64",
      commitment: "confirmed"
    }
  );
  console.log("Subscribed to AMM v4");
  // scrape account data
  updateAccounts(raydium, redisClient);
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log("Processed ", counter, " accounts");
  await raydium.connection.removeProgramAccountChangeListener(subId);
  console.log("Unsubscribed from AMM v4");
};

const setupClient = async (
  redisClient: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >
) => {
  redisClient.on("connect", async () => {
    console.log("Redis client connected");
    await redisClient.ft.create(
      "idx:pools",
      {
        "$.mintA.address": {
          type: SchemaFieldTypes.TEXT,
          AS: "mintA_address",
          SORTABLE: "UNF",
        },
        "$.mintB.address": {
          type: SchemaFieldTypes.TEXT,
          AS: "mintB_address",
          SORTABLE: "UNF",
        },
        "$.day.volume": {
          type: SchemaFieldTypes.NUMERIC,
          AS: "day_volume",
        },
      } as RediSearchSchema,
      {
        ON: "JSON",
        PREFIX: "pools:",
      }
    );
    console.log("Index created");
  });
  redisClient.on("error", (err: string) => {
    throw new Error(
      "Redis client error " + err + " Have you started the Redis server?"
    );
  });
  await redisClient.connect();
};

main()
  .then(() => {
    console.log("main process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
