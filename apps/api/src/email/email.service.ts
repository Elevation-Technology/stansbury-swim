import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { Resend } from 'resend'
import { User } from 'user/user'
import { ConfigEnum } from '../shared/config.enum'
import { Student } from 'student/student'
import { Schedule } from 'schedule/schedule'
import { formatInTimeZone } from 'date-fns-tz'
import { PoolService } from 'pool/pool.service'
import { InstructorService } from 'instructor/instructor.service'

@Injectable()
export class EmailService {
  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    public readonly userService: UserService,
    public readonly logger: Logger,
    public readonly poolService: PoolService,
    public readonly instructorService: InstructorService,
  ) {}

  public async sendResetPasswordLink(email: string): Promise<void> {
    const payload = { email }

    const secret = this.configService.get(ConfigEnum.JwtVerificationTokenSecret)
    const expiresIn = this.configService.get(ConfigEnum.JwtVerificationTokenExpirationTime)

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    })

    const user = await this.userService.findOneForAuth(email)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    await this.userService.updateResetToken(user, token)

    const url = `${this.configService.get(ConfigEnum.EmailResetPasswordUrl)}?token=${token}`

    const text = `Hi, \nTo reset your password, click here: ${url}`
    const msg = {
      to: email,
      from: 'no-reply@stansburyswim.com',
      subject: 'Reset your password',
      text: text,
    }
    return this.sendMail(msg)
  }

  public async decodeConfirmationToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get(ConfigEnum.JwtVerificationTokenSecret),
      })

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email
      }
      throw new BadRequestException()
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired')
      }
      throw new BadRequestException('Bad confirmation token')
    }
  }

  public async sendWelcomeEmail(user: User): Promise<void> {
    const msg = {
      to: user.email,
      from: 'no-reply@stansburyswim.com',
      subject: 'Welcome to Stansbury Swim',
      html: `<html>
<body>
<p><strong>Stansbury Swim Registration</strong></p>
<p>Thanks for registering with Stansbury Swim!  We can't wait to swim with you. </p>
<p>Next, <a href='https://stansburyswim.com/dashboard'>add students</a>, <a href='https://stansburyswim.com/dashboard'>purchase credits</a>, reserve your <a href='http://stansburyswim.com/dashboard'>lesson</a> and have fun! </p>
<p>See you soon! </br>The Stansbury Swim Team</p>
<p> </p>
<p>COVID-19 UPDATE:  With your help, we can keep the facilities clean and social distancing in check. Do not come to the facility if sick or have been exposed to anyone sick.  See our updated "what we are doing" and "what you can do" lists on our <a href='https://www.facebook.com/arnellaquatics/'>Stansbury Swim Facebook Page</a> and at the pools. We plan to operate May 18-July 31, unless the threat level returns to red.  Please note, however, the nature of our training program does not allow us social distance between instructor and student during the lesson. Even though, the CDC says there is no evidence of the virus spreading through pools, there is probably still some risk when they are in close contact above the water. You are welcome to to enter the pool with your child to avoid instructor-child contact. If you are uncomfortable with any of these risks, please call Sarah at 435-659-6307 and we will refund your purchase. </p>
<p>Policies and Tips:</p>
<ul>
<li>Pool addresses:  103 Lakeview, Stansbury Park, 5446 Lanyard Lane, Stansbury Park, and 180 E Durfee St, Grantsville.  When you schedule, be sure to note the location as well as date/time/instructor.</li>
<li>All lessons are private, with one-on-one instruction customized to the student's goals and skill level.</li>
<li>Lessons start and end promptly.  We advise arriving at least 5 minutes early to be ready for the lesson.</li>
<li>Please be considerate when parking.  Do not block driveways or mailboxes.</li>
<li>All lesson credits MUST be used in the season purchased.  All unused lesson credits will be forfeited with no refund.  Seasons typically end July 31.</li>
<li>Text "@stansswim1" to 81010 or visit remind.com/join/stansswim1 to receive text updates (including new schedule offerings and cancellations due to weather).</li>
<li>24-hour cancellation notice is required.  There is no charge to reschedule any lesson, if done more that 24 hours ahead of time.  Within 24 hours of lesson time, there will be a full charge on all lessons.  You are welcome to send a replacement student if the scheduled student is unavailable.  </li>
<li>Instructors are subject to change without notice.</li>
<li>We strongly prefer reusable swim diapers over disposable and sunscreen lotion over aerosol.</li>
<li>Recommended: Ages 3-5 20-40 Lessons, Ages 5+10-20 Lessons + Maintenance Program 1-3 times/week. </li>
<li>Give your child lots of love and encouragement between lessons.  Recognize his/her bravery and achievements.  Take pictures and video during the lesson.  Children love to watch themselves and gain confidence as they do so.</li>
</ul>
<p>See you soon! </br>The Stansbury Swim Team</p>
</body>
</html>`,
    }
    return this.sendMail(msg)
  }

  private async sendMail(options: {
    to: string
    from: string
    subject: string
    text?: string
    html?: string
  }) {
    const key = this.configService.get(ConfigEnum.ResendApiKey)
    const resend = new Resend(key)

    try {
      const { data, error } = await resend.emails.send({
        from: options.from,
        to: options.to,
        bcc: 'info@stansburyswim.com',
        subject: options.subject,
        ...(options.html ? { html: options.html } : { text: options.text ?? '' }),
      })

      if (error) {
        this.logger.error(`Failed to send email to ${options.to}`, error)
        return
      }

      this.logger.log(`Email sent to ${options.to}`, { id: data?.id })
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}`, error?.stack)
    }
  }

  public async sendCancellationEmail(user: User, student: Student, schedule: Schedule): Promise<void> {
    const formattedDateTimeMdt = formatInTimeZone(schedule.startDateTime, 'America/Denver', 'MM/dd/yyyy hh:mm a')
    const msg = {
      to: user.email,
      from: 'no-reply@stansburyswim.com',
      subject: 'Lesson Cancellation Confirmation',
      html: `<html>
<body>
<p><strong>Lesson Cancellation Confirmation</strong></p>
<p>Your lesson scheduled for ${formattedDateTimeMdt} has been cancelled and your credit has been restored to your account.  Reserve your next lesson <a href='https://stansburyswim.com/dashboard'>here</a>.</p>
<p>See you soon! </br>The Stansbury Swim Team</p>

<p>Policies and Tips:</p>
<ul>
<li>Pool addresses:  103 Lakeview, Stansbury Park, 5446 Lanyard Lane, Stansbury Park, and 180 E Durfee St, Grantsville.  When you schedule, be sure to note the location as well as date/time/instructor.</li>
<li>All lessons are private, with one-on-one instruction customized to the student's goals and skill level.</li>
<li>Lessons start and end promptly.  We advise arriving at least 5 minutes early to be ready for the lesson.</li>
<li>Please be considerate when parking.  Do not block driveways or mailboxes.</li>
<li>All lesson credits MUST be used in the season purchased.  All unused lesson credits will be forfeited with no refund.  Seasons typically end July 31.</li>
<li>Text "@stansswim1" to 81010 or visit remind.com/join/stansswim1 to receive text updates (including new schedule offerings and cancellations due to weather).</li>
<li>24-hour cancellation notice is required.  There is no charge to reschedule any lesson, if done more that 24 hours ahead of time.  Within 24 hours of lesson time, there will be a full charge on all lessons.  You are welcome to send a replacement student if the scheduled student is unavailable.  </li>
<li>Instructors are subject to change without notice.</li>
<li>We strongly prefer reusable swim diapers over disposable and sunscreen lotion over aerosol.</li>
<li>Recommended: Ages 3-5 20-40 Lessons, Ages 5+10-20 Lessons + Maintenance Program 1-3 times/week. </li>
<li>Give your child lots of love and encouragement between lessons.  Recognize his/her bravery and achievements.  Take pictures and video during the lesson.  Children love to watch themselves and gain confidence as they do so.</li>
</ul>
<p>See you soon! </br>The Stansbury Swim Team</p>
</body>
</html>
</html>`,
    }
    return this.sendMail(msg)
  }

  public async sendReservationEmail(user: User, student: Student, schedule: Schedule): Promise<void> {
    // convert to MDT
    const formattedDateTimeMdt = formatInTimeZone(schedule.startDateTime, 'America/Denver', 'MM/dd/yyyy hh:mm a')
    const pool = await this.poolService.findOne(schedule.poolId)
    const instructor = await this.instructorService.findOne(schedule.instructorId)
    const msg = {
      to: user.email,
      from: 'no-reply@stansburyswim.com',
      subject: 'Lesson Reservation Confirmation',
      html: `<p>Splash!  ${student.name}'s lesson reservation for ${formattedDateTimeMdt} at ${pool.name} with ${instructor.name} is confirmed.  Please arrive at least 5 minutes prior to the lesson.  You may cancel this lesson online up to 24 hours before lesson time with no penalty.</p>											
103 Lakeview: Enter pool area through the gate to the right of the garage. 180 Durfee: Walk down driveway and enter pool area between the two garages. Text or call Sarah with any questions 435-659-6307.											
We are unable to cancel, refund, or reschedule a lesson within 24 hours of lesson time. You are welcome to send a replacement student if the scheduled student is unavailable. 											
											
<p>Policies and Tips:</p>											
<ul>											
<li>Pool addresses:  103 Lakeview, Stansbury Park, 5446 Lanyard Lane, Stansbury Park, and 180 E Durfee St, Grantsville.  When you schedule, be sure to note the location as well as date/time/instructor.</li>											
<li>All lessons are private, with one-on-one instruction customized to the student's goals and skill level.</li>											
<li>Lessons start and end promptly.  We advise arriving at least 5 minutes early to be ready for the lesson.</li>											
<li>Please be considerate when parking.  Do not block driveways or mailboxes.</li>											
<li>All lesson credits MUST be used in the season purchased.  All unused lesson credits will be forfeited with no refund.  Seasons typically end July 31.</li>											
<li>Text "@stansswim1" to 81010 or visit remind.com/join/stansswim1 to receive text updates (including new schedule offerings and cancellations due to weather).</li>											
<li>24-hour cancellation notice is required.  There is no charge to reschedule any lesson, if done more that 24 hours ahead of time.  Within 24 hours of lesson time, there will be a full charge on all lessons.  You are welcome to send a replacement student if the scheduled student is unavailable.  </li>											
<li>Instructors are subject to change without notice.</li>											
<li>We strongly prefer reusable swim diapers over disposable and sunscreen lotion over aerosol.</li>											
<li>Recommended: Ages 3-5 20-40 Lessons, Ages 5+10-20 Lessons + Maintenance Program 1-3 times/week. </li>											
<li>Give your child lots of love and encouragement between lessons.  Recognize his/her bravery and achievements.  Take pictures and video during the lesson.  Children love to watch themselves and gain confidence as they do so.</li>											
</ul>											
<p>See you soon! </br>The Stansbury Swim Team</p>											
</body>											
</html>											
</body>											
</html>											`,
    }
    return this.sendMail(msg)
  }

  public async sendScheduleReminderEmail(
    user: User,
    student: Student,
    schedule: Schedule,
    corrected: boolean = false,
  ): Promise<void> {
    const formattedDateTimeMdt = formatInTimeZone(schedule.startDateTime, 'America/Denver', 'MM/dd/yyyy hh:mm a')
    const pool = await this.poolService.findOne(schedule.poolId)
    const instructor = await this.instructorService.findOne(schedule.instructorId)

    this.logger.log(
      `Sending schedule reminder email to ${user.email} for ${student.name} on ${formattedDateTimeMdt} at ${pool.name} with ${instructor.name}`,
      {
        user: user.email,
        student: student.name,
        schedule: schedule.startDateTime.toISOString(),
        pool: pool.name,
        instructor: instructor.name,
        formattedDateTimeMdt,
        corrected,
      },
    )

    const msg = {
      to: user.email,
      from: 'no-reply@stansburyswim.com',
      subject: corrected ? 'Lesson Reminder (Corrected)' : 'Lesson Reminder',
      html: `<p>Hello ${user.firstName} ${user.lastName},</p>
      ${corrected ? '<p>This is a corrected reminder for your lesson. Previous email contained the wrong time.</p>' : ''}
      <p>This is a reminder that your lesson for ${student.name} is scheduled on ${formattedDateTimeMdt} at ${pool.name} with ${instructor.name}.</p>
      <p>Please arrive at least 5 minutes prior to the lesson.</p>

      <p>Pool Details:</p>
      <ul>
        <li>Pool Address: ${pool.address}</li>
      </ul>
      <p>${pool.details}</p>

      									
      <p>Policies and Tips:</p>											
      <ul>											
      <li>All lessons are private, with one-on-one instruction customized to the student's goals and skill level.</li>											
      <li>Lessons start and end promptly.  We advise arriving at least 5 minutes early to be ready for the lesson.</li>											
      <li>Please be considerate when parking.  Do not block driveways or mailboxes.</li>											
      <li>All lesson credits MUST be used in the season purchased.  All unused lesson credits will be forfeited with no refund.  Seasons typically end July 31.</li>											
      <li>Text "@stansswim1" to 81010 or visit remind.com/join/stansswim1 to receive text updates (including new schedule offerings and cancellations due to weather).</li>											
      <li>24-hour cancellation notice is required.  There is no charge to reschedule any lesson, if done more that 24 hours ahead of time.  Within 24 hours of lesson time, there will be a full charge on all lessons.  You are welcome to send a replacement student if the scheduled student is unavailable.  </li>											
      <li>Instructors are subject to change without notice.</li>											
      <li>We strongly prefer reusable swim diapers over disposable and sunscreen lotion over aerosol.</li>											
      <li>Recommended: Ages 3-5 20-40 Lessons, Ages 5+10-20 Lessons + Maintenance Program 1-3 times/week. </li>											
      <li>Give your child lots of love and encouragement between lessons.  Recognize his/her bravery and achievements.  Take pictures and video during the lesson.  Children love to watch themselves and gain confidence as they do so.</li>											
      </ul>											

      <p>We look forward to seeing you!</p>
      <p>The Stansbury Swim Team</p>
      `,
    }
    return this.sendMail(msg)
  }
}
