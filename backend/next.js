const sql = require('mssql');

// Load environment variables
require('dotenv').config();

// Add these debug lines at the top
console.log('Environment variables:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

const config = {
  server: process.env.DB_SERVER || 'THINKPAD\\SQLEXPRESS04',  // Add fallback
  database: process.env.DB_NAME || 'mywebsite',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '12345678',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    driver: 'ODBC Driver 17 for SQL Server'
  }
};

// Database configuration with SQL Server Authentication from environment variables
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    driver: 'ODBC Driver 17 for SQL Server'
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch(err => {
    console.log('Database connection failed:', err);
    console.error('Error details:', err);
  });

module.exports = { sql, poolPromise };