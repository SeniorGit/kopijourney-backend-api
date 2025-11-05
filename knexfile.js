require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql', 
    connection: process.env.DATABASE_URL,
    useNullAsDefault: true, 
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds:{
      directory: './seeds'
    }
  }
};