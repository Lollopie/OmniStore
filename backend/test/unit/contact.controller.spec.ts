import { ContactController } from '../../src/contact/contact.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from '../../src/contact/contact.service';
import { MailService } from '../../src/mail/mail.service';
describe('ContactController', () => {
  let contactController: ContactController;
  const mockContactService = {
    saveContactMessage: jest.fn().mockResolvedValue({
      fName: 'John',
      lName: 'Doe',
      email: 'test@example.org',
      message: 'Hello World',
    }),
  };
  const mockMailService = {
    sendContactEmail: jest.fn().mockResolvedValue(true),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        { provide: ContactService, useValue: mockContactService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    contactController = module.get<ContactController>(ContactController);
  });
  it('should be defined', () => {
    expect(contactController).toBeDefined();
  });
  describe('postMessage', () => {
    it('should call saveContactMessage with expected parameters', async () => {
      await contactController.postMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
      expect(mockContactService.saveContactMessage).toHaveBeenCalledWith({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
    });
    it('should call sendContactEmail', async () => {
      await contactController.postMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
      expect(mockMailService.sendContactEmail).toHaveBeenCalled();
    });
    it('should return saveContactMessage return value', async () => {
      const result = await contactController.postMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
      expect(result).toEqual({
        fName: 'John',
        lName: 'Doe',
        email: 'test@example.org',
        message: 'Hello World',
      });
    });
  });
});
