import request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import TestAgent from 'supertest/lib/agent';

export async function registerAndLogin(
  app: NestExpressApplication,
  mockMailService: {
    sendVerificationEmail: jest.Mock<any, any, any>;
  },
  email: string,
  username: string,
  password: string,
  organizationName?: string,
  createWarehouse?: boolean,
) {
  const agent = request.agent(app.getHttpServer());
  await agent.post('/register').send({ email }).expect(201);
  organizationName = organizationName ? organizationName : 'Test Organization';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const verificationToken: string =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mockMailService.sendVerificationEmail.mock.calls[
      mockMailService.sendVerificationEmail.mock.calls.length - 1
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ][1].verificationUrl.split(
      'token=',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    )[1];
  await agent
    .post('/organizations/register?token=' + verificationToken)
    .send({
      ownerEmail: email,
      ownerUsername: username,
      ownerPassword: password,
      name: organizationName,
    })
    .expect(201);
  await agent.post('/login').send({ username, password }).expect(200);

  if (createWarehouse) {
    await agent
      .post('/warehouses')
      .send({ warehouseName: 'Test Warehouse' })
      .expect(201);
  }
  return agent;
}

export async function inviteAndAccept(
  app: NestExpressApplication,
  mockMailService: {
    sendInviteEmail: jest.Mock<any, any, any>;
  },
  agent: TestAgent,
  email: string,
  role: string,
) {
  await agent.post('/warehouses/invites').send({ email, role }).expect(201);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const inviteToken: string =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mockMailService.sendInviteEmail.mock.calls[
      mockMailService.sendInviteEmail.mock.calls.length - 1
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ][1].verificationUrl.split(
      'token=',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    )[1];
  const agent2 = request.agent(app.getHttpServer());
  await agent2
    .post('/invites/accept?token=' + inviteToken)
    .send({ username: email.split('@')[0], password: 'password1' })
    .expect(201);
  await agent2
    .post('/login')
    .send({ username: email.split('@')[0], password: 'password1' })
    .expect(200);
  return agent2;
}
