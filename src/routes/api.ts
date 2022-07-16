import express, { Router, Request, Response } from 'express';
import Web3 from 'web3';
import BlockEstimator from '@/BlockEstimator';
import formatTime from '@/utils/TimeHandler';
import { syncEventTopics, syncEventInputs } from '@/constants';
import executeAsync from '@/utils/AsyncBatch';
import factoryAbi from '@/chain/contracts/abi/Factory.json';
import contractAddress from '@/chain/contracts/address.json';

const { WEBSOCKET_PROVIDER } = process.env;
const { factory: factoryAddress } = contractAddress;

const web3: Web3 = new Web3(new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER!));

const factoryContract = new web3.eth.Contract(factoryAbi, factoryAddress);

const router: Router = express.Router();

const blockEstimator = new BlockEstimator({ web3 });

const timeframe = 1 * 60 * 60;
const periode = 24;

router.get("/reserves", async (req: Request, res: Response) => {

    const { pair } = req.query;

    var [averageBlockTime, block] = await Promise.all([blockEstimator.getAverageBlockTime(), web3.eth.getBlock("latest")]);

    var blockTimestamp = Number(block.timestamp);

    var blocks = [];

    var batch: any = new web3.BatchRequest();

    var getPastLogs: any = web3.eth.getPastLogs;

    for (var i = 0; i < periode; i++) {

        var date = new Date(formatTime(blockTimestamp - (i * timeframe), 3));

        var timestamp = Math.round(date.getTime() / 1000);

        var number = blockEstimator.getBlockAtTimestamp(i == 0 ? blockTimestamp : timestamp)

        blocks.push({ timestamp, number });

        var blocksTail = i == periode ? 200 : 50;

        var fromBlock = number - blocksTail;
        var toBlock = number;

        batch.add(
            getPastLogs.request({
                address: pair,
                topics: syncEventTopics,
                fromBlock,
                toBlock
            })
        );

    };

    var pastLogs: any = await executeAsync(batch);

    var reservesHistory = blocks.map((block, index) => {

        var logs = pastLogs.slice(index).find((logs: any) => logs.length > 0);

        var lastLog = logs[logs.length - 1];

        var { reserve0, reserve1 } = web3.eth.abi.decodeLog(syncEventInputs, lastLog.data, syncEventTopics)

        return {
            timestamp: block.timestamp,
            reserve0,
            reserve1
        }

    })

    res.json({ history: reservesHistory.reverse() });
});

router.get("/pair", async (req: Request, res: Response) => {

    const { tokens } = req.query;

    if (!Array.isArray(tokens) || (Array.isArray(tokens) && tokens.length != 2)) return res.status(401).json({ error: "Unsupported 'tokens' query" });

    res.json({});
});

router.get("/pair/:address", async (req: Request, res: Response) => {
    res.json({});
});

export default router;