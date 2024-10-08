// import { web3 } from "@project-serum/anchor";
// import {
//   ApiV3PoolInfoStandardItem,
//   PoolInfoLayout,
//   CpmmPoolInfoLayout,
//   PoolFetchType,
//   PoolsApiReturn,
//   Raydium,
//   liquidityStateV4Layout,
// } from "@raydium-io/raydium-sdk-v2";
// import {
//   createClient,
//   RedisClientType,
//   RediSearchSchema,
//   SchemaFieldTypes,
// } from "redis";
// import WebSocket from "ws";
// import dotenv from "dotenv";
// import { Keypair } from "@solana/web3.js";
// import fs from "fs";
// import { Structure } from "@raydium-io/raydium-sdk-v2/lib/marshmallow/buffer-layout";
// import { FullAmmRpcData } from "./poolInfo";

// dotenv.config();

// const AMM_TYPES = {
//   amm_v4: {
//     address: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
//     layout: liquidityStateV4Layout,
//   },
//   clmm: {
//     address: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
//     layout: PoolInfoLayout,
//   },
//   cpmm: {
//     address: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
//     layout: CpmmPoolInfoLayout,
//   },
// };

// const AMM_TYPE = "amm_v4";

// export class PoolUpdater {
//   public redisClient: RedisClientType;
//   public connection: web3.Connection;
//   public raydium: Raydium | undefined;
//   public socket: WebSocket;

//   constructor() {
//     this.redisClient = createClient();
//     this.redisClient.on("connect", async () => {
//       console.log("Redis client connected");
//       await this.redisClient.ft.create(
//         "idx:pools",
//         {
//           "$.mintA.address": {
//             type: SchemaFieldTypes.TEXT,
//             AS: "mintA_address",
//             SORTABLE: "UNF",
//           },
//           "$.mintB.address": {
//             type: SchemaFieldTypes.TEXT,
//             AS: "mintB_address",
//             SORTABLE: "UNF",
//           },
//           "$.day.volume": {
//             type: SchemaFieldTypes.NUMERIC,
//             AS: "day_volume",
//           },
//         } as RediSearchSchema,
//         {
//           ON: "JSON",
//           PREFIX: "pools:",
//         }
//       );
//       console.log("Index created");
//     });
//     this.redisClient.on("error", (err: string) => {
//       console.log(
//         "Redis redisClient error ",
//         err,
//         " Have you started the Redis server?"
//       );
//     });
//     this.redisClient.connect();
//     console.log("Connecting to RPC endpoint");
//     this.connection = new web3.Connection(process.env.RPC_ENDPOINT as string, {
//       wsEndpoint: process.env.WSS_ENDPOINT as string,
//       commitment: "confirmed",
//     });
//     this.socket = this.openSocket();
//   }

//   public openSocket = () => {
//     if (
//       this.socket !== undefined &&
//       this.socket.readyState === WebSocket.OPEN
//     ) {
//       return this.socket;
//     }
//     this.socket = new WebSocket(process.env.WSS_ENDPOINT as string);
//     this.socket.on("open", () => {
//       console.log("WebSocket is open");
//     });
//     this.socket.on("error", function error(err) {
//       console.error("WebSocket error:", err);
//     });

//     this.socket.on("close", function close() {
//       console.log("WebSocket is closed");
//     });
//     return this.socket;
//   };

//   public socketSubscribe = async () => {
//     let attempts = 0;
//     while (this.socket.readyState !== WebSocket.OPEN) {
//       console.log("Waiting for socket to open");
//       await new Promise((resolve) => setTimeout(resolve, 1000));
//       attempts += 1;
//       if (attempts > 10) {
//         throw new Error("Failed to open socket");
//       }
//     }
//     await this.loadRaydium();
//     // this.sendRequest();
//     // this.socket.on("message", async (data) => {
//     //   ammV4OnMesssage(this.raydium as Raydium, data);
//     // });
//     await streamLogs(this.raydium as Raydium);
//   };

//   private sendRequest = () => {
//     const request = {
//       jsonrpc: "2.0",
//       id: 420,
//       method: "programSubscribe",
//       params: [
//         AMM_TYPES[AMM_TYPE].address,
//         {
//           commitment: "confirmed",
//           encoding: "base64",
//           maxSupportedTransactionVersion: 0,
//           filters: [
//             {
//               dataSize: AMM_TYPES[AMM_TYPE].layout.span,
//             },
//           ],
//         },
//       ],
//     };
//     try {
//       this.socket.send(JSON.stringify(request));
//     } catch (error) {
//       console.error("Error sending request");
//     }
//   };

//   private loadRaydium = async () => {
//     if (this.raydium) {
//       return this.raydium;
//     }
//     try {
//       this.raydium = await Raydium.load({
//         connection: this.connection,
//       });
//       return this.raydium;
//     } catch (error) {
//       console.error("Error loading Raydium", error);
//     }
//   };

//   private addPoolToRedis = async (pool: ApiV3PoolInfoStandardItem) => {
//     await this.redisClient.json.set(
//       "pools:" + pool.id,
//       "$",
//       JSON.stringify(pool)
//     );
//   };

//   public loadFromRaydiumSdk = async (minPoolVol: number) => {
//     await this.loadRaydium();
//     if (!this.raydium) {
//       console.error("Raydium not loaded");
//       return;
//     }
//     console.log(this.raydium);
//     let hasNextPage = true;
//     let page = 0;
//     console.log("Fetching pools");
//     while (hasNextPage) {
//       page += 1;
//       try {
//         const data: PoolsApiReturn = await this.raydium.api.getPoolList({
//           type: PoolFetchType.Standard,
//           sort: "volume24h",
//           order: "desc",
//           pageSize: 500,
//           page: page,
//         });
//         data.data.forEach((pool) =>
//           this.addPoolToRedis(pool as ApiV3PoolInfoStandardItem)
//         );
//         console.log("fetched ", data.data.length, " pools");
//         hasNextPage = data.hasNextPage;
//         if (hasNextPage && data.data[0].day.volume < minPoolVol) {
//           console.log(
//             "Stopping fetching pools as volume is less than minPoolVol: ",
//             minPoolVol
//           );
//           hasNextPage = false;
//         }
//       } catch (error) {
//         console.error("Error fetching pools", error);
//         return;
//       }
//     }
//     console.log("Finished fetching pools");
//   };

//   public close = () => {
//     this.redisClient.quit();
//     this.socket.close();
//   };
// }
