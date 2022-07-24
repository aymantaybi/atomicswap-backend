
interface IPair {
    index: number,
    address: string,
    name: string,
    symbol: string,
    token0: string,
    token1: string,
    decimals: number
}

const pairs: IPair[] = [
    {
        "index": 0,
        "address": "0xC6344Bc1604FcaB1A5aAd712D766796E2b7A70B9",
        "name": "Axie Infinity Shard - Ronin Wrapped Ether",
        "symbol": "AXS-WETH",
        "token0": "0x97a9107C1793BC407d6F527b77e7fff4D812bece",
        "token1": "0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5",
        "decimals": 18
    },
    {
        "index": 1,
        "address": "0x306A28279d04a47468ed83d55088d0DCd1369294",
        "name": "Smooth Love Potion - Ronin Wrapped Ether",
        "symbol": "SLP-WETH",
        "token0": "0xa8754b9Fa15fc18BB59458815510E40a12cD2014",
        "token1": "0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5",
        "decimals": 18
    },
    {

        "index": 2,
        "address": "0xA7964991f339668107E2b6A6f6b8e8B74Aa9D017",
        "name": "Ronin USD Coin - Ronin Wrapped Ether",
        "symbol": "USDC-WETH",
        "token0": "0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc",
        "token1": "0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5",
        "decimals": 18
    },
    {
        "index": 3,
        "address": "0x2ECb08F87F075b5769Fe543d0e52e40140575ea7",
        "name": "Ronin Wrapped Ether - Wrapped Ronin",
        "symbol": "WETH-WRON",
        "token0": "0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5",
        "token1": "0xe514d9DEB7966c8BE0ca922de8a064264eA6bcd4",
        "decimals": 18
    }
]

function getIntersections(arrayA: any[], arrayB: any[]) {
    return arrayA.filter(item => arrayB.includes(item));
}

function getTokenPairsTokens(token: string, pairs: IPair[]) {

    var tokenPairs = pairs.filter(pair => [pair.token0, pair.token1].includes(token));

    var tokenPairsTokens = tokenPairs.map(pair => pair.token0 == token ? pair.token1 : pair.token0);

    return tokenPairsTokens;
}

function getPath(tokenIn: string, tokenOut: string, pairs: IPair[]) {

    var tokenInPairsTokens = getTokenPairsTokens(tokenIn, pairs);
    var tokenOutPairsTokens = getTokenPairsTokens(tokenOut, pairs);

    var intersections = getIntersections(tokenInPairsTokens, tokenOutPairsTokens);

    if (intersections.length > 0) return [tokenIn, intersections[0], tokenOut];

    

}

describe("Intersection", () => {
    test("test intersection function", async () => {

        console.log(getPath("0x97a9107C1793BC407d6F527b77e7fff4D812bece", "0xa8754b9Fa15fc18BB59458815510E40a12cD2014", pairs));

        var arrayA = [1, 2, 3];
        var arrayB = [0, 2, 6];

        var intersections = getIntersections(arrayA, arrayB);

        expect(intersections[0]).toEqual(2);
    });
});