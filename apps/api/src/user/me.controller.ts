import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode } from '@nestjs/common'
import { UserService } from './user.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator'
import { ActiveUserData } from '../iam/authentication/interfaces/active-user-data.interface'
import { WaiverDto } from './dto/waiver.dto'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'

@Controller('users/me')
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findMe(@ActiveUser() user: ActiveUserData) {
    return this.userService.findOne(user.sub)
  }

  @Patch()
  update(@ActiveUser() user: ActiveUserData, @Body() updateUserDto: UpdateUserDto) {
    // Self-service, so a new address has to be confirmed before it replaces the live one.
    // An admin driving this session through impersonation is exempt: that is the repair
    // path for an address that is already wrong, and no confirmation could ever arrive at it.
    return this.userService.update(user.sub, updateUserDto, {
      requireEmailConfirmation: !user.impersonatorId,
    })
  }

  @Post('waiver')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update the user waiver',
    description: 'Updates the waiver information for the current user.',
  })
  @ApiBody({ type: WaiverDto })
  @ApiResponse({ status: 200, description: 'Waiver updated successfully.' })
  updateWaiver(@ActiveUser() user: ActiveUserData, @Body() waiverDto: WaiverDto) {
    return this.userService.updateWaiver(
      user.sub,
      waiverDto.signedWaiver,
      waiverDto.waiverSignature,
      waiverDto.waiverSignatureDate,
    )
  }

  @Delete()
  @HttpCode(204)
  remove(@ActiveUser() user: ActiveUserData) {
    return this.userService.remove(user.sub)
  }
}
