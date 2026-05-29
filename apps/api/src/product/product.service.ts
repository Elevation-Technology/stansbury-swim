import { Injectable } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { ProductEntity } from './entities/product.entity'
import { Product } from './product'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

const mapper = (entity: ProductEntity): Product => {
  return {
    id: entity._id.toString(),
    order: entity.order,
    name: entity.name,
    lessonType: entity.lessonType,
    credits: entity.credits,
    active: entity.active,
    amount: entity.amount,
    description: entity.description,
    scheduleId: entity.scheduleId?.toString(),
    features: entity.features,
  }
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductEntity.name)
    private readonly model: Model<ProductEntity>,
  ) {}
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const _id = new Types.ObjectId()
    const result = await this.model.create({
      _id,
      order: createProductDto.order,
      name: createProductDto.name,
      lessonType: createProductDto.lessonType,
      credits: createProductDto.credits,
      active: createProductDto.active,
      amount: createProductDto.amount,
      description: createProductDto.description,
      scheduleId: createProductDto.scheduleId ? new Types.ObjectId(createProductDto.scheduleId) : undefined,
      features: createProductDto.features,
    })
    const entity = await this.model.findById(result._id)
    if (!entity) {
      throw new Error('Product not found')
    }
    return mapper(entity)
  }

  async findAll(): Promise<Product[]> {
    return (await this.model.find({ active: true })).map(mapper)
  }

  async findOne(id: string): Promise<Product> {
    const entity = await this.model.findById(new Types.ObjectId(id))
    if (!entity) {
      throw new Error('Product not found')
    }
    return mapper(entity)
  }

  async update(updateProductDto: UpdateProductDto): Promise<Product> {
    const updates: any = {}
    if (updateProductDto.name) {
      updates['name'] = updateProductDto.name
    }

    if (updateProductDto.lessonType) {
      updates['lessonType'] = updateProductDto.lessonType
    }

    if (updateProductDto.credits) {
      updates['credits'] = updateProductDto.credits
    }

    if (updateProductDto.active) {
      updates['active'] = updateProductDto.active
    }

    if (updateProductDto.amount) {
      updates['amount'] = updateProductDto.amount
    }

    if (updateProductDto.description) {
      updates['description'] = updateProductDto.description
    }

    if (updateProductDto.scheduleId) {
      updates['scheduleId'] = new Types.ObjectId(updateProductDto.scheduleId)
    }

    if (updateProductDto.features) {
      updates['features'] = updateProductDto.features
    }

    if (updateProductDto.order) {
      updates['order'] = updateProductDto.order
    }

    await this.model.updateOne(
      { _id: new Types.ObjectId(updateProductDto.id) },
      {
        $set: {
          ...updates,
        },
      },
    )
    const entity = await this.model.findById(new Types.ObjectId(updateProductDto.id))
    if (!entity) {
      throw new Error('Product not found')
    }
    return mapper(entity)
  }

  async remove(id: string): Promise<void> {
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: { active: false } })
  }
}
