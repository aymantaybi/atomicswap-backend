import express, { Router, Request, Response } from 'express';
import { sendEvent, writeEvent } from './ServerSentEvents';

const router: Router = express.Router();

router.get("/reserves", (req: Request, res: Response) => {

    var data = {
        "reserve0": "4147626610",
        "reserve1": "12284938235954016919913"
    }

    sendEvent(res, data);

    setInterval(() => {
        writeEvent(res, data);
    }, 3000)

});

export default router;