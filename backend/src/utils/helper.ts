import { Repository, ObjectLiteral, DeepPartial } from 'typeorm';

export function mapRow<T extends ObjectLiteral>(
  repo: Repository<T>,
  row: Record<string, any>,
): T {
  const entityData = Object.fromEntries(
    repo.metadata.columns.map((col) => [
      col.propertyName,
      row[col.databaseName],
    ]),
  ) as DeepPartial<T>;

  return repo.create(entityData);
}
