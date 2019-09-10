exports.up = function(knex, Promise) {
  return knex.schema.createTable("traversalStack", table => {
    table.increments();
    table.string("direction").notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("traversalStack");
};
