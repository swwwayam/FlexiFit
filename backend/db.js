// This file sets up and exports the connection pool for PostgreSQL
const { Pool } = require('pg');

// IMPORTANT: Replace these placeholders with your actual PostgreSQL credentials
const pool = new Pool({
    user: 'postgres', // <-- EDIT THIS
    host: 'localhost',
    database: 'gymanagement', // <-- EDIT THIS
    password: 'root', // <-- EDIT THIS
    port: 5432, // Default PostgreSQL port
});

// Test the connection when the module loads
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.message);
        console.error('Please check your credentials and ensure PostgreSQL is running.');
    } else {
        console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};