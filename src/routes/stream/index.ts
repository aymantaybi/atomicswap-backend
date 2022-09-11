import express, { Router, Request, Response } from "express";
import Web3 from "web3";
import { EventEmitter } from "events";

import { sendEvent } from "./ServerSentEvents";
import contracts from "../../chain/contracts";
import formatTime from "../../utils/TimeHandler";

const { WEBSOCKET_PROVIDER } = process.env;

const web3: Web3 = new Web3(
  new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER!)
);

interface Subscriber {
  event: string;
  address: string;
  response: Response;
}

interface Subscription {
  event: string;
  address: string;
  eventEmitter: EventEmitter;
}

const subscribers: Subscriber[] = [];
const subscriptions: Subscription[] = [];

const router: Router = express.Router();

router.get("/reserves", (req: Request, res: Response) => {
  let { pair } = req.query;

  console.log("Stream Open");

  let pairContract = new web3.eth.Contract(
    contracts.abi.pair as any,
    pair as string
  );

  let subscription = subscriptions.find(
    (subscription) =>
      subscription.address == pair && subscription.event == "sync"
  );

  if (!subscription) {
    subscription = {
      event: "sync",
      address: pair as string,
      eventEmitter: pairContract.events.Sync(),
    };

    subscription.eventEmitter.on("data", (event) => {
      let { reserve0, reserve1 } = event.returnValues;

      let date = new Date(formatTime(Date.now(), 3));

      let timestamp = Math.round(date.getTime() / 1000) + 3600;

      for (let subscriber of subscribers) {
        if (subscriber.address == event.address) {
          console.log({ pair, timestamp, reserve0, reserve1 });
          sendEvent(subscriber.response, {
            pair,
            timestamp,
            reserve0,
            reserve1,
          });
        }
      }
    });

    subscriptions.push(subscription);
  }

  let subscriber = {
    event: "sync",
    address: pair as string,
    response: res,
  };

  let subscriberIndex = subscribers.length;

  subscribers.push(subscriber);

  res.on("close", () => {
    subscribers.splice(subscriberIndex, 1);
    console.log("Stream Closed");
    console.log(subscribers);
  });

  sendEvent(subscriber.response, {});
});

export default router;
