const postgres = require("postgres");
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

let sql = postgres({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  database: DB_NAME,
  password: DB_PASS,
  transform: {
    ...postgres.camel,
    undefined: null,
  },
  ssl: false,
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0,
});

module.exports = { sql };
