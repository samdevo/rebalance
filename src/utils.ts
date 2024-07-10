import * as fs from "fs";
import { TOKEN_LIST_URL } from "@jup-ag/core";
import axios from "axios";


export interface Token {
    symbol: string;
    address: string;
    name: string;
    decimals: number;
    chainId: number;
}

export interface Tokens {
    bySymbol: {
        [symbol: string]: Token;
    };
    byAddress: {
        [address: string]: Token;
    };
}

const getJson = () => {
    if (fs.existsSync("./tokens.json")) {
        return JSON.parse(fs.readFileSync("./tokens.json", "utf-8"));
    } else {
        axios.get(TOKEN_LIST_URL["mainnet-beta"]).then((res) => {
            // save tokens to tokens.json file
            fs.writeFileSync(
                "./tokens.json",
                JSON.stringify(res.data, null, 2)
            );
            return res.data;
        });
    }
}
export const loadTokens = () => {
    const jsondata = getJson();
    const tokens: Tokens = {
        bySymbol: {},
        byAddress: {},
    };
    for (const token of jsondata) {
        // only store fields in Token (subset of fields in jsondata)
        const { symbol, address, name, decimals, chainId } = token;
        tokens.byAddress[address] = { symbol, address, name, decimals, chainId };
        if (!tokens.bySymbol[symbol]) {
            tokens.bySymbol[symbol] = { symbol, address, name, decimals, chainId };
        }
    }
    return tokens;
}

