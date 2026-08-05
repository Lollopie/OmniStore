import request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';

export async function registerAndLogin(
  app: NestExpressApplication,
  username: string,
  password: string,
  createWarehouse?: boolean,
) {
  const agent = request.agent(app.getHttpServer());
  await agent.post('/register').send({ username, password }).expect(201);
  await agent.post('/login').send({ username, password }).expect(200);

  if (createWarehouse) {
    await agent
      .post('/warehouses')
      .send({ warehouseName: 'Test Warehouse' })
      .expect(201);
  }
  return agent;
}
