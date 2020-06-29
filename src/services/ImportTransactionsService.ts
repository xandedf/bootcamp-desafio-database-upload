/* eslint-disable no-restricted-syntax */
import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

interface Line {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    // verificar se o arquivo existe
    const importFilePath = path.join(uploadConfig.directory, fileName);
    const importFileExists = await fs.promises.stat(importFilePath);

    if (!importFileExists) {
      throw new AppError('Import file not exist.');
    }

    // ler e importar o arquivo
    const readCSVStream = fs.createReadStream(importFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: Line[] = [];

    parseCSV.on('data', line => {
      const lineParsed: Line = {
        title: String(line[0]),
        type: line[1] === 'income' ? 'income' : 'outcome',
        value: Number(line[2]),
        category: String(line[3]),
      };
      lines.push(lineParsed);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransaction = new CreateTransactionService();
    const transactions: Transaction[] = [];

    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransaction.execute(line);
      transactions.push(transaction);
    }

    // deletar o arquivo
    await fs.promises.unlink(importFilePath);

    // retornar as transacoes
    return transactions;
  }
}

export default ImportTransactionsService;
