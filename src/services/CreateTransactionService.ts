import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoriesRepository = getRepository(Category);

    // Verificar se essa transação pode ser criada, validando o outcome com o total
    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('Requested amount greater than the total');
    }

    // Verificar se a categoria existe, caso nao exista, criar e pegar o ID
    let categoryFound = await categoriesRepository.findOne({
      title: category,
    });
    if (!categoryFound) {
      const newCategory = categoriesRepository.create({ title: category });
      await categoriesRepository.save(newCategory);
      categoryFound = newCategory;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryFound.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
