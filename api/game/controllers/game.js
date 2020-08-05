"use strict";

// Public dependencies.
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  // retrieve my next games
  async myNext(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services.game.findMyNext(user.id);
    return data.map((game) =>
      sanitizeEntity(game, { model: strapi.models.game })
    );
  },

  // join a team in a game
  async joinTeam(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const gameId = ctx.params.id;

    const { team } = ctx.request.body;
    if (!team || (!team === 'a' && !team === 'b')) {
      return ctx.badRequest(null, [
        { messages: [{ id: "no valid team identification found" }] },
      ]);
    }

    const data = await strapi.services.game.joinTeam(gameId, user, team);

    return sanitizeEntity(data, { model: strapi.models.game });
  },
};
