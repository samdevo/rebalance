import {
  CpmmPoolInfoLayout,
  LiquidityStateV4,
  liquidityStateV4Layout,
  PoolInfoLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import WebSocket from "ws";
// import { getFullAmmDataRpc } from "./poolInfo";
import { PublicKey } from "@solana/web3.js";
import { web3 } from "@project-serum/anchor";

export const parseAccountUpdateAmmV4 = (
  data: web3.AccountInfo<Buffer>
): LiquidityStateV4 | undefined => {
  const jsonData = JSON.parse(data.data.toString());
  try {
    const accountData: string[] = jsonData.params.result.value.account.data;
    const buffer = Buffer.from(accountData[0], "base64");
    const messageData = liquidityStateV4Layout.decode(buffer);
    return messageData;
  } catch (error) {
    if (jsonData.result) {
      console.log("v4 subscruption id", jsonData.result);
      return;
    }
    console.error("Error decoding v4 data", error);
  }
};
