import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { EmailOutboxService } from '../services/email-outbox.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('admin/mail')
// @UseGuards(AdminGuard) // Should be guarded by admin privileges
export class MailAdminController {
  constructor(
    private readonly outboxService: EmailOutboxService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('failed')
  async getFailedEmails() {
    return this.prisma.emailOutbox.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get(':id')
  async getEmailDetail(@Param('id') id: string) {
    return this.prisma.emailOutbox.findUnique({
      where: { id },
    });
  }

  /**
   * L8 Audit-Safe Override: Creates a new Outbox record linked to the original.
   * Preserves the original failure context while allowing delivery correction.
   */
  @Post(':id/retry-override')
  async retryEmailWithOverride(@Param('id') id: string, @Body() body: { context: any }) {
    const original = await this.prisma.emailOutbox.findUnique({ where: { id } });
    if (!original) throw new Error('Original email not found');

    return this.prisma.emailOutbox.create({
      data: {
        eventType: original.eventType,
        recipient: original.recipient,
        subject: original.subject,
        templateName: original.templateName,
        templateVersion: original.templateVersion,
        context: body.context, // Overridden context
        status: 'PENDING',
        idempotencyKey: `${original.idempotencyKey}_override_${Date.now()}`,
        parentOutboxId: original.id,
      },
    });
  }

  @Post(':id/retry')
  async retryEmail(@Param('id') id: string) {
    return this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: 'PENDING',
        attempts: 0,
        processedAt: null,
      },
    });
  }
}
