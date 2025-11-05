exports.up = function(knex) {
  return knex.schema
    .alterTable('farmers', (table) => {
      table.unique('user_id'); 
    })
    
    .alterTable('roasters', (table) => {
      table.unique('user_id');  
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('farmers', (table) => {
      table.dropUnique('user_id');
    })
    .alterTable('roasters', (table) => {
      table.dropUnique('user_id');
    });
};