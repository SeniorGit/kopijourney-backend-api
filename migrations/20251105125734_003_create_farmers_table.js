exports.up = function(knex) {
    return knex.schema.createTable('farmers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.string('farm_name', 255).notNullable();
        table.text('farm_description');
        
        // Location
        table.string('country', 100).notNullable();
        table.string('region', 100);
        table.string('city', 100);
        table.text('address');
        table.decimal('latitude', 10, 8);
        table.decimal('longitude', 11, 8); 
        
        // Farm details
        table.integer('elevation'); 
        table.decimal('farm_size', 10, 2); 
        table.integer('established_year');
        table.jsonb('certifications'); 
        table.string('coffee_varieties', 500); 
        table.string('processing_methods', 500); 
        
        // Contact
        table.string('website_url', 500);
        table.jsonb('social_media');
        
        // Verification
        table.boolean('is_verified').defaultTo(false);
        table.jsonb('verification_documents');
        table.timestamp('verified_at');
        
        // Timestamps
        table.timestamps(true, true);
        
        // Indexes
        table.index('user_id');
        table.index(['country', 'region']); 
        table.index('is_verified');
        table.index('created_at');
    });
};
exports.down = function(knex) {
    return knex.schema.dropTable('farmers');
};
