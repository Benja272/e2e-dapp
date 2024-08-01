// Import the express in typescript file
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupReferences } from './operations/operations';

import { reload, start, resolve, cancel, submit, lucidBase, datum } from './endpoints';

dotenv.config();
// Initialize the express engine
const app: express.Application = express();

const port = process.env.PORT;

const endpoints: { [index: string]: any; } = {
    "/start": start,
    "/reload": reload,
    "/resolve": resolve,
    "/cancel": cancel,
    "/submit": submit,
    "/datum": datum
}

for (const key in endpoints) {
    app.get(key, async (_req, _res) => {
        try {
            _res.header("Access-Control-Allow-Origin", "*");
            const res = await endpoints[key](_req.query);
            _res.send(res)
        } catch (e: any) {
            e = String(e)
            let res = { error: e }
            if (e.includes("TranslationLogicMissingInput")) {
                res = { error: "Input missing. Please wait a few seconds and try again." }
            }
            console.log(res)
            _res.status(500).send(res);
        }
    });
}

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = ['http://localhost:4202'];

const options: cors.CorsOptions = {
    origin: allowedOrigins
};

await setupReferences(await lucidBase())

app.use(cors(options));
app.use(express.json());

// Server setup
app.listen(port, () => {
    console.log(`Offchain running on http://localhost:${port}/`);
});
