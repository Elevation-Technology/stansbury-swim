import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  NotFoundException,
  HttpCode,
  BadRequestException,
} from '@nestjs/common'
import { PaymentService } from './payment.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { PaypalService } from './paypal.service'
import { ActiveUser } from 'iam/authentication/decorators/active-user.decorator'
import { ActiveUserData } from 'iam/authentication/interfaces/active-user-data.interface'
import { UserService } from 'user/user.service'
import { CreatePaypalOrderDto } from './dto/create-paypal-order.dto'
import { PaymentGatewayTypesEnum } from 'shared/payment-gateway-types.enum'
import { PaymentStatusTypesEnum } from 'shared/payment-status-types.enum'
import { Roles } from 'iam/authentication/decorators/roles.decorator'
import { Role } from '@lesson-scheduler/shared'
import { LessonTypesEnum } from 'shared/lesson-types.enum'
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody, ApiParam } from '@nestjs/swagger'
import { PaymentResponseDto } from './dto/payment-response.dto'
import { ScheduleService } from 'schedule/schedule.service'
import { RegistrationService } from 'schedule/registration.service'
import { ProductService } from 'product/product.service'

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paypalService: PaypalService,
    private readonly userService: UserService,
    private readonly scheduleService: ScheduleService,
    private readonly registrationService: RegistrationService,
    private readonly productService: ProductService,
  ) {}

  @Get('')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  async findAll() {
    const products = await this.paymentService.findAll()
    return products
  }

  @Post('paypal-create-order')
  @ApiOperation({ summary: 'Create a PayPal order' })
  @ApiBody({ type: CreatePaypalOrderDto })
  async createPaypalOrder(@Body() createPaypalOrder: CreatePaypalOrderDto, @ActiveUser() userdata: ActiveUserData) {
    const user = await this.userService.findOne(userdata.sub)
    const product = await this.productService.findOne(createPaypalOrder.productId)

    // Resolve which session this purchase registers against, and validate it BEFORE
    // creating a PayPal order so a bad request never leaves an orphaned order behind.
    let scheduleId = createPaypalOrder.scheduleId
    if (product.lessonType === LessonTypesEnum.GROUP) {
      // A product linked to a specific schedule is authoritative — never trust a
      // client-supplied id that disagrees with it.
      if (product.scheduleId) {
        if (scheduleId && scheduleId !== product.scheduleId) {
          throw new BadRequestException('The selected session does not match this class.')
        }
        scheduleId = product.scheduleId
      }
      if (!scheduleId) {
        throw new BadRequestException('This class has no available session. Please contact us.')
      }
      if (!createPaypalOrder.studentId) {
        throw new BadRequestException('Please select a student.')
      }
      // Group sessions are a single seat per purchase; multi-quantity can't register.
      if (createPaypalOrder.quantity > 1) {
        throw new BadRequestException('Only one spot can be purchased per session.')
      }
    }

    if (scheduleId) {
      const schedule = await this.scheduleService.findOne(scheduleId)
      const registrations = await this.registrationService.findAll(scheduleId)
      const classSize = registrations.length + createPaypalOrder.quantity
      if (schedule.classSize && classSize > schedule.classSize) {
        throw new BadRequestException('Schedule is full')
      }
    }

    const order = await this.paypalService.createOrder(createPaypalOrder.productId, createPaypalOrder.quantity, user)

    await this.paymentService.create({
      productId: createPaypalOrder.productId,
      quantity: createPaypalOrder.quantity,
      userId: userdata.sub,
      paymentGateway: PaymentGatewayTypesEnum.PAYPAL,
      paymentGatewayId: order.id,
      status: PaymentStatusTypesEnum.PENDING,
      scheduleId,
      studentId: createPaypalOrder.studentId,
    })
    return {
      id: order.id,
    }
  }

  @Post('paypal-capture-order')
  @ApiOperation({ summary: 'Capture a PayPal order' })
  @ApiBody({ schema: { properties: { orderId: { type: 'string' } } } })
  @HttpCode(204)
  async captureOrder(@Body() { orderId }, @ActiveUser() userdata: ActiveUserData) {
    const payment = await this.paymentService.findByGatewayId(orderId)

    if (!payment) {
      throw new NotFoundException()
    }

    if (payment.scheduleId) {
      const schedule = await this.scheduleService.findOne(payment.scheduleId)
      const registrations = await this.registrationService.findAll(payment.scheduleId)
      const classSize = registrations.length + payment.quantity
      if (schedule.classSize && classSize > schedule.classSize) {
        throw new BadRequestException('Schedule is full')
      }
    }

    if (payment.userId !== userdata.sub) {
      throw new NotFoundException()
    }

    const order = await this.paypalService.captureOrder(orderId)

    if (order.status === 'COMPLETED') {
      await this.paymentService.update({
        id: payment.id,
        paymentGatewayId: order.id,
        status: PaymentStatusTypesEnum.SUCCESS,
      })
    }

    return order
  }

  @Post('apple-validate-merchant')
  @ApiOperation({ summary: 'Validate Apple Pay merchant' })
  @ApiBody({ schema: { properties: { validationUrl: { type: 'string' } } } })
  async appleValidateMerchant(@Body('validationUrl') validationUrl: string) {
    const merchantIdentifier = 'your-merchant-identifier' // Your Apple Pay Merchant ID
    const displayName = 'Stansbury Swim'
    const domainName = 'your-domain.com'

    const response = await fetch(validationUrl, {
      method: 'POST',
      body: JSON.stringify({
        merchantIdentifier,
        displayName,
        domainName,
      }),
      headers: { 'Content-Type': 'application/json' },
      // agent: add custom agent to use cert and key once we have them
    })

    return response.json()
  }

  @Post()
  @ApiOperation({ summary: 'Create a payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiOkResponse({ type: PaymentResponseDto })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: PaymentResponseDto })
  async findOne(@Param('id') id: string) {
    const product = await this.paymentService.findOne(id)
    if (!product) {
      throw new NotFoundException()
    }
    return product
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiOkResponse({ type: PaymentResponseDto })
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.paymentService.findOne(id)
    if (!payment) {
      throw new NotFoundException()
    }
    return this.paymentService.update({
      ...updatePaymentDto,
      id,
    })
  }
}
