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

// const ClmmOnMessage = async (data: WebSocket.Data) => {
//   try {
//     const jsonData = JSON.parse(data.toString());
//     if (jsonData.result) {
//       console.log("clmm subscruption id", jsonData.result);
//       return;
//     }
//     const accountData: string[] = jsonData.params.result.value.account.data;
//     const buffer = Buffer.from(accountData[0], "base64");

//     // const buffer = accountData.substring(Layout.offsetOf("mintA") / 8, Layout.offsetOf("mintA")/8 + 8)
//     const messageData = PoolInfoLayout.decode(buffer);
//   } catch (error) {
//     console.error("Error decoding v4 data", error);
//   }
// };

// const CpmmOnMessage = async (data: WebSocket.Data) => {
//   try {
//     const jsonData = JSON.parse(data.toString());
//     if (jsonData.result) {
//       console.log("cpmm subscruption id", jsonData.result);
//       return;
//     }
//     const accountData: string[] = jsonData.params.result.value.account.data;
//     const buffer = Buffer.from(accountData[0], "base64");

//     // const buffer = accountData.substring(Layout.offsetOf("mintA") / 8, Layout.offsetOf("mintA")/8 + 8)
//     const messageData = CpmmPoolInfoLayout.decode(buffer);
//     const programId = jsonData.params.result.value.account.owner
//   } catch (error) {
//     console.error("Error decoding v4 data", error);
//   }
// };
