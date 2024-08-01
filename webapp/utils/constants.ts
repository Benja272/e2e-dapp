import * as fs from 'fs';

export const minAda: number = 2_000_000;
export const orderAddress = fs.readFileSync('./utils/orderAddress.txt', 'utf-8')
