import { config } from 'dotenv';

// Same lookup order as the app, so the seed hits the database the backend uses.
// Variables already set in the environment (e.g. in CI) take precedence.
config({
  path: [`.env.${process.env.NODE_ENV || 'dev'}`, '.env'],
  quiet: true,
});
