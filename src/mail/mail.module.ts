import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
    const secure =
      (this.config.get<string>('SMTP_SECURE') ?? String(port === 465)).toLowerCase() ===
      'true';
    const user = this.config.getOrThrow<string>('SMTP_USER');
    const pass = this.config.getOrThrow<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // Helps with some Hostinger TLS setups on port 587
      requireTLS: !secure,
      tls: {
        minVersion: 'TLSv1.2',
      },
    });

    this.logger.log(
      `SMTP configured: ${user} @ ${host}:${port} (secure=${secure})`,
    );

    return this.transporter;
  }

  async verifyConnection(): Promise<void> {
    await this.getTransporter().verify();
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM') ??
      this.config.getOrThrow<string>('SMTP_USER');

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject: 'Reset your password',
        text: [
          'You requested a password reset.',
          '',
          'Open this link to set a new password (expires in 1 hour):',
          resetUrl,
          '',
          'If you did not request this, you can ignore this email.',
        ].join('\n'),
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
            <h2>Reset your password</h2>
            <p>You requested a password reset.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#3d9a7a;color:#fff;text-decoration:none;border-radius:8px;">
                Reset password
              </a>
            </p>
            <p style="color:#555;font-size:14px;">
              Or copy this link:<br />
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color:#555;font-size:14px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Failed to send password reset email to ${to}: ${message}`,
      );
      throw error;
    }
  }

  async sendEmailVerificationEmail(
    to: string,
    verifyUrl: string,
  ): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM') ??
      this.config.getOrThrow<string>('SMTP_USER');

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject: 'Verify your email',
        text: [
          'Thanks for signing up.',
          '',
          'Open this link to verify your email (expires in 24 hours):',
          verifyUrl,
          '',
          'If you did not create an account, you can ignore this email.',
        ].join('\n'),
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
            <h2>Verify your email</h2>
            <p>Thanks for signing up. Please confirm your email address.</p>
            <p>
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#3d9a7a;color:#fff;text-decoration:none;border-radius:8px;">
                Verify email
              </a>
            </p>
            <p style="color:#555;font-size:14px;">
              Or copy this link:<br />
              <a href="${verifyUrl}">${verifyUrl}</a>
            </p>
            <p style="color:#555;font-size:14px;">This link expires in 24 hours.</p>
          </div>
        `,
      });

      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Failed to send verification email to ${to}: ${message}`,
      );
      throw error;
    }
  }
}

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
