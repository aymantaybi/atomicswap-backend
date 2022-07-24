require("dotenv").config();

import Web3 from 'web3';
import mongoose from 'mongoose';

import contracts from '../chain/contracts';
import executeAsync from './AsyncBatch';
import Pair from '../models/pair';
import logger from './logger';

const { WEBSOCKET_PROVIDER, MONGODB_URI } = process.env;

mongoose.connect(MONGODB_URI!, { dbName: "atomicswap" });

const web3: Web3 = new Web3(new Web3.providers.HttpProvider("https://eth-rpc.gateway.pokt.network/"));

const factoryContract = new web3.eth.Contract(contracts.abi.factory as any, "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f" /* contracts.address.factory */);

const queueSize = 50;

(async () => {

    var chainId = await web3.eth.getChainId();

    logger.info(`Chain Id : ${chainId}`);

    var allPairsLength = await factoryContract.methods.allPairsLength().call();

    logger.info(`All Pairs Length : ${allPairsLength}`);

    for (var i = 0; i < allPairsLength; i += queueSize + 1) {

        var pairs = await downloadPairs(i, Math.min(allPairsLength, i + queueSize));

        logger.info(`Download pairs data`);

        var result = await Pair.collection.insertMany(pairs);

        logger.info(`Inserted ${result.insertedCount} documents`);

    };

})();


async function downloadPairs(start: number, end: number) {

    var batch: any = new web3.BatchRequest();

    for (var i = start; i < end; i++) {
        batch.add(factoryContract.methods.allPairs(i).call.request());
    }

    var pairsAddress = await executeAsync(batch) as string[];

    batch = new web3.BatchRequest();

    var requestsLength = 0;

    for (var pairAddress of pairsAddress) {
        var requests = getPair(pairAddress).method.requests();
        requestsLength = requests.length;
        for (var request of requests) {
            batch.add(request);
        }
    };

    var pairsData = await executeAsync(batch) as string[];

    var pairs = pairsAddress.map((address, index) => {

        var data: string[] = pairsData.slice(index * requestsLength, (index + 1) * requestsLength);

        var [name, symbol, token0, token1, decimals] = data;

        return {
            index: index + start,
            address: web3.utils.toChecksumAddress(address),
            name: name,
            symbol: symbol,
            token0: web3.utils.toChecksumAddress(token0),
            token1: web3.utils.toChecksumAddress(token1),
            decimals: Number(decimals)
        }

    });

    return pairs;
}

function getPair(address: string) {

    var pairContract = new web3.eth.Contract(contracts.abi.pair as any, address);

    var batch: any = new web3.BatchRequest();

    var requests = [
        pairContract.methods.name().call.request(),
        pairContract.methods.symbol().call.request(),
        pairContract.methods.token0().call.request(),
        pairContract.methods.token1().call.request(),
        pairContract.methods.decimals().call.request()
    ];

    for (var request of requests) {
        batch.add(request);
    };

    return {
        data: async () => {
            var [
                name,
                symbol,
                token0,
                token1,
                decimals
            ]: any = await executeAsync(batch);
            return {
                address: web3.utils.toChecksumAddress(address),
                name: name,
                symbol: symbol,
                token0: web3.utils.toChecksumAddress(token0),
                token1: web3.utils.toChecksumAddress(token1),
                decimals: Number(decimals)
            }
        },
        method: {
            requests: () => requests
        }
    }

};