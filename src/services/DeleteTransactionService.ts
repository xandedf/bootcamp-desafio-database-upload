import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(transactionId: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionRepository.findOne(transactionId);

    if (!transaction) {
      throw new AppError('Transaction not exist');
    }

    await transactionRepository.delete(transactionId);
  }
}

export default DeleteTransactionService;
