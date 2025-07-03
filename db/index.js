const { Pool } = require("pg");
require("dotenv").config();

// Database connection configuration
const getDatabaseConfig = () => {
  // For Railway, Heroku, etc. - use DATABASE_URL
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  // For local development
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'autom8_school_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };
};

const pool = new Pool(getDatabaseConfig());

module.exports = pool;
