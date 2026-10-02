import { ResendTransport } from '../../src/mail/resend.transport';
import MailMessage from 'nodemailer/lib/mailer/mail-message';
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));
describe('ResendTransport', () => {
  let transport: ResendTransport;
  const validData = {
    from: 'from@example.org',
    to: 'to@example.org',
    subject: 'Subject',
    html: '<p>Hello</p>',
  };
  const buildMail = (data: Record<string, unknown>) =>
    ({ data }) as unknown as MailMessage;
  beforeEach(() => {
    jest.clearAllMocks();
    transport = new ResendTransport('re_test');
  });
  it('should be defined', () => {
    expect(transport).toBeDefined();
  });
  it('should send the email via Resend', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null });
    const callback = jest.fn();
    await transport.send(buildMail(validData), callback);
    expect(mockSend).toHaveBeenCalledWith({
      from: 'from@example.org',
      to: ['to@example.org'],
      subject: 'Subject',
      html: '<p>Hello</p>',
    });
  });
  it('should call back with the message info on success', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null });
    const callback = jest.fn();
    await transport.send(buildMail(validData), callback);
    expect(callback).toHaveBeenCalledWith(null, {
      messageId: 'msg-1',
      envelope: {},
      accepted: ['to@example.org'],
      rejected: [],
    });
  });
  it.each(['from', 'to', 'subject', 'html'])(
    'should call back with an error if %s is missing',
    async (field) => {
      const callback = jest.fn();
      await transport.send(
        buildMail({ ...validData, [field]: undefined }),
        callback,
      );
      expect(callback).toHaveBeenCalledWith(
        new Error('Missing required email fields'),
      );
      expect(mockSend).not.toHaveBeenCalled();
    },
  );
  it('should call back with an error if a field is not a string', async () => {
    const callback = jest.fn();
    await transport.send(
      buildMail({ ...validData, to: ['to@example.org'] }),
      callback,
    );
    expect(callback).toHaveBeenCalledWith(
      new Error('Missing required email fields'),
    );
    expect(mockSend).not.toHaveBeenCalled();
  });
  it('should call back with the Resend error message', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid API key' },
    });
    const callback = jest.fn();
    await transport.send(buildMail(validData), callback);
    expect(callback).toHaveBeenCalledWith(new Error('Invalid API key'));
  });
  it('should call back with thrown errors', async () => {
    const error = new Error('Network error');
    mockSend.mockRejectedValueOnce(error);
    const callback = jest.fn();
    await transport.send(buildMail(validData), callback);
    expect(callback).toHaveBeenCalledWith(error);
  });
});
