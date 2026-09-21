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

export async function getLatestEmailFor(email: string, retries = 10) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(
      `http://localhost:8025/api/v1/search?query=to:${email}`,
      {
        method: 'GET',
      },
    );
    const data = await res.json();
    if (data['messages'] && data['messages'].length > 0) {
      const messageId = data['messages'][0].ID;
      const full = await fetch(
        `http://localhost:8025/api/v1/message/${messageId}`,
        {
          method: 'GET',
        },
      );
      return await full.json();
    }
    await new Promise((r) => setTimeout(r, 500));
  }
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
