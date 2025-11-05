exports.up = function(knex) {
    return knex.schema.createTable('roasters', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.string('company_name', 255).notNullable();
        table.text('description');

        // Facility detail
        table.text('facility_address');
        table.string('facility_country', 100);
        table.string('facility_region', 100);
        table.string('facility_city', 100);
        table.decimal('facility_latitude', 10, 8); 
        table.decimal('facility_longitude', 11, 8); 

        // Capacity & roasting info
        table.integer('roasting_capacity_kg_per_month'); 
        table.jsonb('roasting_machines'); 
        table.specificType('roasting_style', 'text[]'); 
        table.jsonb('coffee_origins'); 
        
        // Business info
        table.integer('year_established');
        table.jsonb('certifications'); 
        table.jsonb('shipping_policies'); 
        table.string('business_license', 100); 

        // Contact
        table.string('contact_email', 255);
        table.string('contact_phone', 20);
        table.string('website_url', 500);
        table.jsonb('social_media'); 

        // Verification
        table.boolean('is_verified').defaultTo(false);
        table.timestamp('verified_at');
        
        // Timestamps
        table.timestamps(true, true);
        
        // Indexes
        table.index('user_id');
        table.index('facility_country');
        table.index('facility_city');
        table.index('is_verified');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('roasters');
};