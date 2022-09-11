import express, { Router, Request, Response } from "express";
import Web3 from "web3";
import BlockEstimator from "../BlockEstimator";
import formatTime from "../utils/TimeHandler";
import { options, syncEventTopics, syncEventInputs } from "../constants";
import executeAsync from "../utils/AsyncBatch";

import contracts from "../chain/contracts";

const { WEBSOCKET_PROVIDER } = process.env;

const web3: Web3 = new Web3(
  new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER!, options)
);
const factoryContract = new web3.eth.Contract(
  contracts.abi.factory as any,
  contracts.address.factory
);

const blockEstimator = new BlockEstimator({ web3 });

const timeframe = 1 * 60 * 60;
const periode = 24;

const router: Router = express.Router();

router.get("/reserves", async (req: Request, res: Response) => {
  const { pairs } = req.query;

  if (typeof pairs !== "string") return res.sendStatus(400);

  var [averageBlockTime, block] = await Promise.all([
    blockEstimator.getAverageBlockTime(),
    web3.eth.getBlock("latest"),
  ]);

  const pairsAdress = pairs.split(",");

  var reserves = await Promise.all(
    pairsAdress.map((pair) => getReserves(pair as string, block))
  );

  res.json(reserves);
});

router.get("/pair", async (req: Request, res: Response) => {
  const { tokens } = req.query;

  var tokensAddress: string[] =
    typeof tokens === "string" ? tokens.split(",") : [];

  if (tokensAddress.length != 2)
    return res.status(400).json({ error: "Unsupported 'tokens' query" });

  try {
    var address = await getPairAddress(tokensAddress);

    res.json({ address });
  } catch {
    res.sendStatus(500);
  }
});

router.get("/pairs", async (req: Request, res: Response) => {
  const { path } = req.query;

  var pathAddresses: string[] = typeof path === "string" ? path.split(",") : [];

  if (pathAddresses.length < 2)
    return res.status(400).json({ error: "Unsupported 'path' query" });

  try {
    var addresses = await Promise.all(
      pathAddresses.map((address, index) =>
        index == 0 ? null : getPairAddress([address, pathAddresses[index - 1]])
      )
    );

    res.json({ pairs: addresses.slice(1) });
  } catch (e) {
    console.log(e);

    res.sendStatus(500);
  }
});

router.get("/pair/:address", async (req: Request, res: Response) => {
  var { address } = req.params;

  var data = await getPair(address);

  res.json(data);
});

router.get("/token/:address", async (req: Request, res: Response) => {
  var { address } = req.params;

  var data = await getToken(web3.utils.toChecksumAddress(address));

  res.json(data);
});

router.get("/path", async (req: Request, res: Response) => {
  const { tokenIn, tokenOut } = req.query;

  var path = getPath(tokenIn as string, tokenOut as string);

  res.json({ path });
});

export default router;

async function getPair(address: string) {
  var pairContract = new web3.eth.Contract(contracts.abi.pair as any, address);

  var batch: any = new web3.BatchRequest();

  var requests = [
    pairContract.methods.name().call.request(),
    pairContract.methods.symbol().call.request(),
    pairContract.methods.factory().call.request(),
    pairContract.methods.token0().call.request(),
    pairContract.methods.token1().call.request(),
    pairContract.methods.decimals().call.request(),
    pairContract.methods.totalSupply().call.request(),
  ];

  for (var request of requests) {
    batch.add(request);
  }

  var [name, symbol, factory, token0, token1, decimals, totalSupply]: any =
    await executeAsync(batch);

  return {
    address: web3.utils.toChecksumAddress(address),
    factory: web3.utils.toChecksumAddress(factory),
    token0: web3.utils.toChecksumAddress(token0),
    token1: web3.utils.toChecksumAddress(token1),
    name,
    symbol,
    decimals,
    totalSupply,
  };
}

async function getPairAddress(tokensAddress: string[]) {
  return await factoryContract.methods.getPair(...tokensAddress).call();
}

async function getToken(address: string) {
  var erc20Contract = new web3.eth.Contract(
    contracts.abi.erc20 as any,
    address
  );

  var batch: any = new web3.BatchRequest();

  var requests = [
    erc20Contract.methods.name().call.request(),
    erc20Contract.methods.symbol().call.request(),
    erc20Contract.methods.decimals().call.request(),
    erc20Contract.methods.totalSupply().call.request(),
  ];

  for (var request of requests) {
    batch.add(request);
  }

  var [name, symbol, decimals, totalSupply]: any = await executeAsync(batch);

  return { address, name, symbol, decimals: Number(decimals), totalSupply };
}

async function getReserves(pair: string, block: any) {
  var blockTimestamp = Number(block.timestamp);

  var blocks = [];

  var batch: any = new web3.BatchRequest();

  var getPastLogs: any = web3.eth.getPastLogs;

  for (var i = 0; i < periode; i++) {
    var date = new Date(formatTime(blockTimestamp - i * timeframe, 3));

    var timestamp = Math.round(date.getTime() / 1000) + timeframe;

    var number = blockEstimator.getBlockAtTimestamp(
      i == 0 ? blockTimestamp : timestamp
    );

    blocks.push({ timestamp, number });

    var blocksTail = i == periode ? 200 : 50;

    var fromBlock = number - blocksTail;
    var toBlock = number;

    batch.add(
      getPastLogs.request({
        address: pair,
        topics: syncEventTopics,
        fromBlock,
        toBlock,
      })
    );
  }

  var pastLogs: any = await executeAsync(batch);

  var reservesHistory = blocks.map((block, index) => {
    var logs = pastLogs.slice(index).find((logs: any) => logs.length > 0);

    var lastLog = logs[logs.length - 1];

    var { reserve0, reserve1 } = web3.eth.abi.decodeLog(
      syncEventInputs,
      lastLog.data,
      syncEventTopics
    );

    return {
      timestamp: block.timestamp,
      reserve0,
      reserve1,
    };
  });

  var pairData = await getPair(pair as string);

  return { pair: pairData, history: reservesHistory.reverse() };
}

function getPath(tokenIn: string, tokenOut: string) {
  return [tokenIn, tokenOut].map((address) =>
    web3.utils.toChecksumAddress(address)
  );
}
