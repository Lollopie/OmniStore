import { Injectable } from '@nestjs/common';
import { TxRepoProvider } from '../rls/txrepo.service';
import { ContactDto } from '@shared/dto/contact.dto';
import { ContactEntity } from './contact.entity';
@Injectable()
export class ContactService {
  constructor(private readonly txRepoProvider: TxRepoProvider) {}
  async saveContactMessage(contactDto: ContactDto): Promise<ContactEntity> {
    const contactRepo = this.txRepoProvider.getRepo(ContactEntity);
    const contact = contactRepo.create(contactDto);
    return await contactRepo.save(contact, { reload: false });
  }
}
