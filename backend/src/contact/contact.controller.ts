import { Body, Controller, Post } from '@nestjs/common';
import { ContactDto } from '@shared/dto/contact.dto';
import { ContactService } from './contact.service';
import { MailService } from '../mail/mail.service';
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly mailService: MailService,
  ) {}
  @Post()
  async postMessage(@Body() contactDto: ContactDto) {
    const contact = await this.contactService.saveContactMessage(contactDto);
    await this.mailService.sendContactEmail();
    return contact;
  }
}
