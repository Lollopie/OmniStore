import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from '../../src/contact/contact.service';
import { ContactEntity } from '../../src/contact/contact.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
describe('ContactService', () => {
  let contactService: ContactService;
  const mockTxRepoProvider = {
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === ContactEntity) {
        return mockContactRepository;
      }
      throw new Error(`Unexpected Entity ${entity}`);
    }),
  };
  const mockContactRepository = {
    create: jest.fn().mockReturnValue({
      id: 'contact-1',
      fName: 'John',
      lName: 'Doe',
      email: 'test@example.org',
      message: 'Hello World',
    }),
    save: jest.fn().mockResolvedValue({
      id: 'contact-1',
      fName: 'John',
      lName: 'Doe',
      email: 'test@example.org',
      message: 'Hello World',
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
      ],
    }).compile();

    contactService = module.get<ContactService>(ContactService);
  });
  it('should be defined', () => {
    expect(contactService).toBeDefined();
  });
  describe('saveContactMessage', () => {
    it('should call create with expected parameters', async () => {
      await contactService.saveContactMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
      expect(mockContactRepository.create).toHaveBeenCalledWith({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
    });
    it('should call save with create return value', async () => {
      await contactService.saveContactMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
      expect(mockContactRepository.save).toHaveBeenCalledWith(
        {
          id: 'contact-1',
          fName: 'John',
          lName: 'Doe',
          email: 'test@example.org',
          message: 'Hello World',
        },
        { reload: false },
      );
    });
    it('should return save return value', async () => {
      const result = await contactService.saveContactMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
      expect(result).toEqual({
        id: 'contact-1',
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
    });
  });
});
