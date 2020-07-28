"use strict";

const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
module.exports = {
  /**
   * retrieve invitation made by the user
   *
   */
  async made(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services["group-invitation"].findMadeByUser(
      user.id
    );

    return data.map((groupInvitation) =>
      sanitizeEntity(groupInvitation, {
        model: strapi.models["group-invitation"],
      })
    );
  },

  /**
   * retrieve invitation addressed to the user
   *
   */
  async received(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services["group-invitation"].findAddressedToUser(
      user.id
    );

    return data.map((groupInvitation) =>
      sanitizeEntity(groupInvitation, {
        model: strapi.models["group-invitation"],
      })
    );
  },

  /**
   * Accept invitation to a group
   *
   */
  async accept(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }
    const groupInvitationId = ctx.params.id;

    const groupInvitation = await strapi.services["group-invitation"].findOne({
      id: groupInvitationId,
    });

    // check for authorization
    if (groupInvitation.recipient.id !== user.id) {
      return ctx.badRequest(null, [
        { messages: [{ id: "Only recipient can accept a group-invitation" }] },
      ]);
    }

    // update group invitation
    const groupInvitationUpdated = await strapi.services[
      "group-invitation"
    ].update(
      { id: groupInvitationId },
      {
        isAccepted: true,
        isAnswered: true,
      }
    );

    // retrieve the corresponding group
    const groupToUpdate = await strapi.services.group.findOne(
      { id: groupInvitationUpdated.group.id },
      ["members"]
    );
    if (!groupToUpdate.members.includes[user]) {
      // add the user to the corresponding group
      const groupUpdated = await strapi.services.group.update(
        { id: groupToUpdate.id },
        { members: [...groupToUpdate.members, user] },
        ["members"]
      );
      groupInvitationUpdated.group = groupUpdated;
    }

    return sanitizeEntity(groupInvitationUpdated, {
      model: strapi.models["group-invitation"],
    });
  },

  /**
   *  Decline invitation to a group
   *
   */
  async decline(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const groupInvitationId = ctx.params.id;
    const groupInvitation = await strapi.services["group-invitation"].findOne({
      id: groupInvitationId,
    });

    // check for authorization
    if (groupInvitation.recipient.id !== user.id) {
      return ctx.badRequest(null, [
        { messages: [{ id: "Only recipient can accept a group-invitation" }] },
      ]);
    }

    // update group invitation
    const groupInvitationUpdated = await strapi.services[
        "group-invitation"
      ].update(
        { id: groupInvitationId },
        {
          isAccepted: false,
          isAnswered: true,
        }
      );

      return sanitizeEntity(groupInvitationUpdated, {
        model: strapi.models["group-invitation"],
      });
  },
};
