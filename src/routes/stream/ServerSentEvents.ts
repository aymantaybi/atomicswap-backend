import { Response } from 'express';

const writeEvent = (res: Response, data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const sendEvent = (res: Response, data: any) => {

    if (!res.headersSent) {

        res.writeHead(200, {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'text/event-stream',
        });

    }

    writeEvent(res, data);
};

export { sendEvent, writeEvent };
