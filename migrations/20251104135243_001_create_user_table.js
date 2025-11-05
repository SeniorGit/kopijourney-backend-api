exports.up = function(knex) {
    return knex.schema.createTable('users', (table)=>{
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        // auth
        table.string('email', 255).unique().notNullable();
        table.string('password', 255).notNullable();
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.enu('role',['customer', 'farmer', 'roaster', 'admin']).notNullable();

        // email verification
        table.boolean('is_verified').defaultTo(false);
        table.string('verification_token').nullable();
        table.timestamp('verification_token_expires').nullable()

        // password reset
        table.string('reset_token').nullable();
        table.timestamp('reset_token_expires').nullable();

        // profile
        table.string('phone', 20).nullable();
        table.string('avatar_url', 500).nullable();

        // scurity
        table.integer('login_attempts').defaultTo(0);
        table.timestamp('locked_untill').nullable();
        table.timestamp('last_login').nullable()

        // timestamp
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // preverense
        table.json('taste_preferences').nullable();
        table.string('preferred_roast_level').nullable();
        table.boolean('newsletter_subscribed').defaultTo(true)

        // index
        table.index('email');
        table.index('role');
        
        table.index('is_verified');
        table.index(['role', 'created_at']);
        table.index('reset_token');
        table.index('verification_token');

    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
