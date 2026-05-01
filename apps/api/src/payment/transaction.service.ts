import { Injectable } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { TransactionEntity } from './entities/transaction.entity'
import { Transaction } from './transaction'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { CreditBalanceDto } from './dto/credit-balance.dto'
import { CreditTypesEnum } from 'shared/credit-types.enum'
import { EventBus } from '@nestjs/cqrs'
import { TransactionCreatedEvent } from './events'
import { TransactionTypesEnum } from 'shared/transaction-types.enum'

const mapper = (entity: TransactionEntity): Transaction => {
  return {
    id: entity._id.toString(),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    userId: entity.userId.toString(),
    productId: entity.productId ? entity.productId.toString() : undefined,
    scheduleId: entity.scheduleId ? entity.scheduleId.toString() : undefined,
    amount: entity.amount,
    credits: entity.credits,
    creditType: entity.creditType,
    transactionType: entity.transactionType,
    studentId: entity.studentId ? entity.studentId.toString() : undefined,
  }
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(TransactionEntity.name)
    private readonly model: Model<TransactionEntity>,
    private readonly eventBus: EventBus,
  ) {}
  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const _id = new Types.ObjectId()
    const result = await this.model.create({
      _id,
      userId: new Types.ObjectId(createTransactionDto.userId),
      productId: createTransactionDto.productId ? new Types.ObjectId(createTransactionDto.productId) : undefined,
      scheduleId: createTransactionDto.scheduleId ? new Types.ObjectId(createTransactionDto.scheduleId) : undefined,
      amount: createTransactionDto.amount,
      credits: createTransactionDto.credits,
      creditType: createTransactionDto.creditType,
      transactionType: createTransactionDto.transactionType,
      paymentId: createTransactionDto.paymentId ? new Types.ObjectId(createTransactionDto.paymentId) : undefined,
      studentId: createTransactionDto.studentId ? new Types.ObjectId(createTransactionDto.studentId) : undefined,
    })
    const entity = await this.model.findById(result._id)
    if (!entity) {
      throw new Error('Transaction not found')
    }
    const transaction = mapper(entity)
    this.eventBus.publish(new TransactionCreatedEvent(transaction))
    return transaction
  }

  async findAll(): Promise<Transaction[]> {
    return (await this.model.find()).map(mapper)
  }

  async findOne(id: string): Promise<Transaction> {
    const entity = await this.model.findById(new Types.ObjectId(id))
    if (!entity) {
      throw new Error('Transaction not found')
    }
    return mapper(entity)
  }

  async readCreditBalances(userId: string): Promise<CreditBalanceDto[]> {
    const creditBalances = await this.model.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$creditType',
          balance: { $sum: '$credits' },
        },
      },
    ])

    return creditBalances.map(creditBalance => {
      return {
        creditType: creditBalance._id,
        balance: creditBalance.balance,
      }
    })
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return (await this.model.find({ userId: new Types.ObjectId(userId) })).map(mapper)
  }

  async countCredits(query: {
    transactionType: TransactionTypesEnum
    creditType: CreditTypesEnum
    from?: Date
    to?: Date
  }): Promise<number> {
    const { from, to, ...rest } = query
    const filter: any = { ...rest }
    if (from || to) {
      filter.createdAt = {}
      if (from) filter.createdAt.$gte = from
      if (to) filter.createdAt.$lt = to
    }
    const transactions = await this.model.find(filter)
    return transactions.reduce((acc, transaction) => acc + Math.abs(transaction.credits), 0)
  }

  async aggregateUserCreditBalances(range?: { from?: Date; to?: Date }): Promise<Record<string, number>> {
    const match: any = { creditType: 'private' }
    if (range?.from || range?.to) {
      match.createdAt = {}
      if (range.from) match.createdAt.$gte = range.from
      if (range.to) match.createdAt.$lt = range.to
    }
    const results = await this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$userId',
          balance: { $sum: '$credits' },
        },
      },
    ])
    const balances: Record<string, number> = {}
    for (const result of results) {
      balances[result._id.toString()] = result.balance
    }
    return balances
  }
}
