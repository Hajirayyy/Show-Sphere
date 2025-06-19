const sql = require('mssql/msnodesqlv8');

console.log('Using Windows Authentication');
console.log('DB_SERVER:', 'THINKPAD\\SQLEXPRESS04');
console.log('DB_NAME:', 'MyShowSphere');

const config = {
  connectionString: 'Driver={SQL Server Native Client 11.0};Server=THINKPAD\\SQLEXPRESS04;Database=MyShowSphere;Trusted_Connection=Yes;',
  options: {
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL using Windows Authentication');
    return pool;
  })
  .catch(err => {
    console.log('Database connection failed:', err);
    console.error('Error details:', err);
  });

module.exports = { sql, poolPromise };
