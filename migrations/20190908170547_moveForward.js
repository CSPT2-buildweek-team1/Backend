exports.up = function(knex, Promise) {
  return knex.schema.createTable("moveForward", table => {
    table.increments();
    table.string("moveForward").notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("moveForward");
};
