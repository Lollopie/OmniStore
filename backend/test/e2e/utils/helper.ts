import request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import TestAgent from 'supertest/lib/agent';

export async function login(
  app: NestExpressApplication,
  username: string,
  password: string,
) {
  const agent = request.agent(app.getHttpServer());
  await agent
    .post('/login')
    .send({ username: username, password: password })
    .expect(200);
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
