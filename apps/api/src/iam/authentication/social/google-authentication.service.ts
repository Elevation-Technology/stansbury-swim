import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuth2Client, TokenPayload } from 'google-auth-library'
import { AuthenticationService } from '../authentication.service'
import { UserService } from 'user/user.service'

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oauthClient: OAuth2Client

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
  ) {}

  onModuleInit() {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID')
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET')
    this.oauthClient = new OAuth2Client(clientId, clientSecret)
  }

  async authenticate(token: string) {
    let payload: TokenPayload | undefined
    try {
      const loginTicket = await this.oauthClient.verifyIdToken({ idToken: token })
      payload = loginTicket?.getPayload()
    } catch {
      throw new UnauthorizedException('Invalid Google credential')
    }

    if (!payload) {
      throw new UnauthorizedException('Invalid Google credential')
    }

    const { email, email_verified, sub: googleId, given_name, family_name } = payload

    if (!email || !email_verified) {
      throw new UnauthorizedException('Google account email is not verified')
    }

    const existingByGoogleId = await this.userService.findOneByGoogleId({ googleId })
    if (existingByGoogleId) {
      return this.authService.generateTokens(existingByGoogleId)
    }

    // Reject auto-merge by email to prevent pre-hijacking: an attacker who
    // pre-registered a password account with someone else's email must not
    // be silently linked to that person's Google identity on first sign-in.
    const existingByEmail = await this.userService.findOneForAuth(email)
    if (existingByEmail) {
      throw new ConflictException(
        'An account already exists for this email. Sign in with your password to access it.',
      )
    }

    const user = await this.userService.saveGoogleId(email, googleId, given_name, family_name)
    return this.authService.generateTokens(user)
  }
}
