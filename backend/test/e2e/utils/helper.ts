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
  await agent.post('/register').send({ email });
  organizationName = organizationName ? organizationName : 'Test Organization';
  const verificationToken: string =
    mockMailService.sendVerificationEmail.mock.calls[
      mockMailService.sendVerificationEmail.mock.calls.length - 1
    ][1].verificationUrl.split('token=')[1];
  await agent.post('/organizations/register?token=' + verificationToken).send({
    ownerEmail: email,
    ownerUsername: username,
    ownerPassword: password,
    name: organizationName,
  });
  await agent.post('/login').send({ username, password });

  if (createWarehouse) {
    await agent.post('/warehouses').send({ warehouseName: 'Test Warehouse' });
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

  const inviteToken: string =
    mockMailService.sendInviteEmail.mock.calls[
      mockMailService.sendInviteEmail.mock.calls.length - 1
    ][1].verificationUrl.split('token=')[1];
  const agent2 = request.agent(app.getHttpServer());
  await agent2
    .post('/invites/accept?token=' + inviteToken)
    .send({ username: email.split('@')[0], password: 'password1' });
  await agent2
    .post('/login')
    .send({ username: email.split('@')[0], password: 'password1' });
  return agent2;
}
