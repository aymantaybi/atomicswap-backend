import Web3 from "web3";
import executeAsync from './utils/AsyncBatch';

interface BlockEstimatorConstructor {
    web3: Web3
}

class BlockEstimator {

    web3: Web3;
    averageBlockTime: number;
    blocks: any;

    constructor({ web3 }: BlockEstimatorConstructor) {
        this.web3 = web3;
        this.averageBlockTime = 0;
        this.blocks = [];
    }

    public async getAverageBlockTime(numberOfBlocks: number = 10) {

        if (this.averageBlockTime > 0) return this.averageBlockTime;

        var { timestamp: blockTimestamp, number: blockNumber } = await this.web3.eth.getBlock("latest");

        var batch: any = new this.web3.BatchRequest();

        var getBlock: any = this.web3.eth.getBlock;

        for (var i = blockNumber; i >= blockNumber - numberOfBlocks; i--) {
            batch.add(getBlock.request(i));
        };

        var blocks: any = await executeAsync(batch);

        this.blocks = blocks;

        var blocksTimestamps = blocks.map((block: any) => block.timestamp).reverse();

        var blocksTimes = [];

        for (var i = 1; i < blocksTimestamps.length; i++) {

            var previousBlockTimestamp = blocksTimestamps[i - 1];
            var currentBlockTimestamp = blocksTimestamps[i];

            var blockTime = currentBlockTimestamp - previousBlockTimestamp;

            blocksTimes.push(blockTime);
        }

        var averageBlockTime = blocksTimes.reduce((previousValue, currentValue) => previousValue + currentValue) / blocksTimes.length;

        this.averageBlockTime = averageBlockTime;

        return averageBlockTime;
    }

    public getBlockAtTimestamp(timestamp: number, blockNumber: number = this.blocks[0].number, blockTimestamp: number = this.blocks[0].timestamp, blockTime: number = this.averageBlockTime) {

        var timeDistance = blockTimestamp - timestamp;

        var blocksDistance = Math.round(timeDistance / blockTime);

        var blockAtTimestamp = blockNumber - blocksDistance;

        return blockAtTimestamp;
    }

    public getTimestampAtBlock(number: number, blockNumber: number = this.blocks[0].number, blockTimestamp: number = this.blocks[0].timestamp, blockTime: number = this.averageBlockTime) {

        var blocksDistance = blockNumber - number;

        var timeDistance = Math.round(blocksDistance * blockTime);

        var timestampAtBlock = blockTimestamp - timeDistance;

        return timestampAtBlock;
    }

}

export default BlockEstimator;