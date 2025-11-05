const knex = require('knex');
const config = require('../../knexfile')

const db = knex(config.development)

db.raw('SELECT 1')
    .then(()=> console.log('Postgresql connected via knex'))
    .catch(err => console.error('Database connection failed', err))

module.exports = db;