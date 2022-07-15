import express, { Router, Request, Response } from 'express';
import Web3 from 'web3';
import BlockEstimator from '../BlockEstimator';

const { WEBSOCKET_PROVIDER } = process.env;

const web3: Web3 = new Web3(new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER!));

const blockEstimator = new BlockEstimator({ web3 });

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {

    var averageBlockTime = await blockEstimator.getAverageBlockTime();

    console.log(averageBlockTime);

    var blockAtTimestamp = blockEstimator.getBlockAtTimestamp(1657800414);

    console.log(blockAtTimestamp);

    var timestampAtBlock = blockEstimator.getTimestampAtBlock(blockAtTimestamp);

    console.log(timestampAtBlock);

    res.json({ block: "ok" });
});

export default router;