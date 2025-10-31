require('dotenv/config');
require('tsconfig-paths/register');

module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/db/migrations/*.ts'],
  synchronize: false,
  logging: true,
  cli: {
    migrationsDir: 'src/db/migrations',
  },
};
