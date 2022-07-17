import express, { Router, Request, Response } from 'express';
import Web3 from 'web3';
import { sendEvent } from './ServerSentEvents';

import contracts from '../../chain/contracts';
import { EventEmitter } from 'events';

const { WEBSOCKET_PROVIDER } = process.env;

const web3: Web3 = new Web3(new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER!));

interface Subscriber {
    event: string,
    address: string,
    response: Response
}

interface Subscription {
    event: string,
    address: string,
    eventEmitter: EventEmitter
}

const subscribers: Subscriber[] = [];
const subscriptions: Subscription[] = [];

const router: Router = express.Router();

router.get("/reserves", (req: Request, res: Response) => {

    const { pair } = req.query;

    console.log('Stream Open');

    var pairContract = new web3.eth.Contract(contracts.abi.pair as any, pair as string);

    var subscription = subscriptions.find(subscription => subscription.address == pair && subscription.event == "sync");

    if (!subscription) {

        subscription = {
            event: 'sync',
            address: pair as string,
            eventEmitter: pairContract.events.Sync()
        };

        subscription.eventEmitter.on('data', (event) => {

            var { reserve0, reserve1 } = event.returnValues;

            var timestamp = Math.round(Date.now() / 1000);

            for (var subscriber of subscribers) {
                sendEvent(subscriber.response, { reserve0, reserve1, timestamp });
            }

        });

        subscriptions.push(subscription);

    };

    var subscriber = {
        event: 'sync',
        address: pair as string,
        response: res
    };

    var subscriberIndex = subscribers.length;

    subscribers.push(subscriber);

    res.on('close', () => {
        subscribers.splice(subscriberIndex, 1)
        res.end();
        console.log('Stream Closed');
    });

});

export default router;