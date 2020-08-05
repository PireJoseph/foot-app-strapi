"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  findMyNext(userId) {
    const now = new Date().toISOString();
    const params = {
      players: [userId],
      startAt_gt: now,
    };

    return strapi
      .query("game")
      .find(params, ["players", "teamAMembers", "teamBMembers"]);
  },
  async joinTeam(gameId, user, team) {
    const params = {
      id: gameId,
    };
    const game = await strapi
      .query("game")
      .findOne(params, ["players", "teamAMembers", "teamBMembers"]);
    // filter out user from any group
    let teamAMembers = game.teamAMembers.filter(
      (member) => member.id !== user.id
    );
    let teamBMembers = game.teamBMembers.filter(
      (member) => member.id !== user.id
    );
    // assign user to the correct group
    if (team === "a") {
      teamAMembers = [...teamAMembers, user];
    } else if (team === "b") {
      teamBMembers = [...teamBMembers, user];
    }

    const updatedGame = await strapi
      .query("game")
      .update(
        { id: game.id },
        { teamAMembers: teamAMembers, teamBMembers: teamBMembers }
      );
    return updatedGame;
  },
};
