import contractsAddress from './address.json';

import factoryAbi from './abi/Factory.json';
import pairAbi from './abi/Pair.json';

const { factory: factoryAddress } = contractsAddress;

const contracts = {
    abi: {
        factory: factoryAbi,
        pair: pairAbi,
    },
    address: {
        factory: factoryAddress,
    }
}

export default contracts;