import contractsAddress from './address.json';

import factoryAbi from './abi/Factory.json';
import pairAbi from './abi/Pair.json';
import erc20Abi from './abi/Erc20.json';


const { factory: factoryAddress } = contractsAddress;

const contracts = {
    abi: {
        factory: factoryAbi,
        pair: pairAbi,
        erc20: erc20Abi,
    },
    address: {
        factory: factoryAddress,
    }
}

export default contracts;