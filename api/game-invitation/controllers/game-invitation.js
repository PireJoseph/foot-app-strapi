"use strict";

// Public dependencies.
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */
  async create(ctx) {
    // get current user, the game invitation source
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    // get the game
    const gameId = ctx.request.body.game;
    if (!gameId) {
      return ctx.badRequest(null, [{ messages: [{ id: "No game id found" }] }]);
    }
    const game = await strapi.query("game").findOne({ id: gameId });
    if (!game) {
      return ctx.badRequest(null, [
        { messages: [{ id: "There is no game with the id" + gameId }] },
      ]);
    }

    // get the message
    const message = ctx.request.body.message;

    // get the recipients
    const recipients = ctx.request.body.recipients;
    if (!recipients || !recipients.length) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No recipient found" }] },
      ]);
    }
    for (const recipientId of recipients) {
      // check if the recipient exists
      const recipient = await strapi
        .query("user", "users-permissions")
        .findOne({ id: recipientId });
      if (!recipient) {
        return ctx.badRequest(null, [
          { messages: [{ id: "There is no user with the id" + recipientId }] },
        ]);
      }
      const alreadyExistingInvitationData = {
        source: user.id,
        recipients_containss: recipientId,
        game: gameId,
      };
      // check if an invitation has already been sent for this recipient
      const alreadyExistingGameInvitation = await strapi.services[
        "game-invitation"
      ].findOne(alreadyExistingInvitationData);
      if (alreadyExistingGameInvitation) {
        const recipient = await strapi
          .query("user", "users-permissions")
          .findOne({ id: recipientId });
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id:
                  "There is already a game invitation for this game to user: " +
                  recipient.username,
              },
            ],
          },
        ]);
      }
    }
    const data = {
      source: user.id,
      recipients: recipients,
      game: gameId,
    };
    if (message) {
      data["message"] = message;
    }

    // if there is not invitation for this source and this recipitent for this game, create one
    const gameInvitation = await strapi.services["game-invitation"].create(
      data
    );

    return sanitizeEntity(gameInvitation, {
      model: strapi.models["game-invitation"],
    });
  },
};
