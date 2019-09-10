exports.up = function(knex, Promise) {
  return knex.schema.createTable("room", table => {
    table.increments();
    table.string("title", 1000).notNullable();
    table.string("description", 1000).notNullable();
    table.string("coordinates", 1000).notNullable();
    table.string("elevation", 1000).notNullable();
    table.string("terrain", 1000).notNullable();
    table.string("players", 1000).notNullable();
    table.string("items", 1000).notNullable();
    table.string("exits", 1000).notNullable();
    table.integer("room_id").notNullable().unique();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("room");
};
