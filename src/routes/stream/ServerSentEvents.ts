import { Response } from 'express';

const sendEvent = (res: Response, data: any) => {

    if (!res.headersSent) {

        res.writeHead(200, {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'text/event-stream',
        });

    }

    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export { sendEvent };
