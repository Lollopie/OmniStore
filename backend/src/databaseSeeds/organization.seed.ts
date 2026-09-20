import { DataSource } from 'typeorm';

export async function seedOrganizations(dataSource: DataSource): Promise<void> {
  const organizationRepository = dataSource.getRepository('OrganizationEntity');

  await organizationRepository.save(
    organizationRepository.create({
      name: 'Organization 1',
    }),
  );
  await organizationRepository.save(
    organizationRepository.create({
      name: 'Organization 2',
    }),
  );
}
