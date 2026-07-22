import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import { AuthenticationService } from './authentication.service'
import { SignInDto } from './dto/sign-in.dto'
import { SignUpDto } from './dto/sign-up.dto'
import { response, Response } from 'express'
import { Auth } from './decorators/auth.decorator'
import { AuthType } from './enums/auth-type.enum'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ConfigService } from '@nestjs/config'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { Roles } from './decorators/roles.decorator'
import { Role } from '@lesson-scheduler/shared'
import { ImpersonateDto } from './dto/impersonate.dto'
import { ActiveUser } from './decorators/active-user.decorator'
import { ActiveUserData } from './interfaces/active-user-data.interface'

@ApiTags('Authentication')
@Controller('auth')
@Auth(AuthType.None)
export class AuthenticationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async signUp(@Res({ passthrough: true }) response: Response, @Body() signUpDto: SignUpDto) {
    const result = await this.authService.signUp(signUpDto)
    response.cookie('authToken', result.accessToken, {
      secure: this.configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.stansburyswim.com' : 'localhost',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    })
    return result
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  async signIn(@Res({ passthrough: true }) response: Response, @Body() signInDto: SignInDto) {
    const result = await this.authService.signIn(signInDto)
    response.cookie('authToken', result.accessToken, {
      secure: this.configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.stansburyswim.com' : 'localhost',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    })
    return result
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-tokens')
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  async refreshTokens(@Res({ passthrough: true }) response: Response, @Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshTokens(refreshTokenDto)
    response.cookie('authToken', result.accessToken, {
      secure: this.configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.stansburyswim.com' : 'localhost',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    })
    return result
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout the current user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the auth cookie
    response.clearCookie('authToken')
    return { message: 'Logged out successfully' }
  }

  @Post('impersonate')
  @Auth(AuthType.Bearer)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Impersonate a user (Admins only)' })
  async impersonate(
    @Res({ passthrough: true }) response: Response,
    @Body() impersonateDto: ImpersonateDto,
    @ActiveUser() adminUser: ActiveUserData,
  ) {
    const result = await this.authService.impersonate(impersonateDto.userId, adminUser)
    response.cookie('authToken', result.accessToken, {
      secure: this.configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.stansburyswim.com' : 'localhost',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    })
    return result
  }

  @Post('exit-impersonation')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exit user impersonation' })
  async exitImpersonation(@Res({ passthrough: true }) response: Response, @ActiveUser() activeUser: ActiveUserData) {
    const result = await this.authService.exitImpersonation(activeUser)
    response.cookie('authToken', result.accessToken, {
      secure: this.configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.stansburyswim.com' : 'localhost',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    })
    return result
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ success: boolean }> {
    await this.authService.forgotPassword(forgotPasswordDto.email)
    return { success: true }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password)
    return { message: 'Password reset successfully' }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an email address from a verification link' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email address confirmed' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ email: string }> {
    const user = await this.authService.verifyEmail(verifyEmailDto.token)
    return { email: user.email }
  }

  @Post('resend-verification')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the verification link for the signed-in account' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@ActiveUser() activeUser: ActiveUserData): Promise<{ success: boolean }> {
    await this.authService.resendVerification(activeUser.sub)
    return { success: true }
  }
}
