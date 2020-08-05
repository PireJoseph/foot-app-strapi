"use strict";

const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */
  async create(ctx) {
    // get current user, the group invitation source
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    // get the group
    const groupId = ctx.request.body.group;
    if (!groupId) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No group id found" }] },
      ]);
    }
    const group = await strapi.query("group").findOne({ id: groupId });
    if (!group) {
      return ctx.badRequest(null, [
        { messages: [{ id: "There is no group with the id" + groupId }] },
      ]);
    }

    // get the message
    const message = ctx.request.body.message;

    // get the recipients
    const recipientId = ctx.request.body.recipient;
    if (!recipientId) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No recipient found" }] },
      ]);
    }
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
      recipient: recipientId,
      group: groupId,
    };
    // check if an invitation has already been sent for this recipient
    const alreadyExistingGroupInvitation = await strapi.services[
      "group-invitation"
    ].findOne(alreadyExistingInvitationData);
    if (alreadyExistingGroupInvitation) {
      const recipient = await strapi
        .query("user", "users-permissions")
        .findOne({ id: recipientId });
      return ctx.badRequest(null, [
        {
          messages: [
            {
              id:
                "There is already a group invitation for this group to user" +
                recipient.username,
            },
          ],
        },
      ]);
    }

    const data = {
      source: user.id,
      recipient: recipientId,
      group: groupId,
    };
    if (message) {
      data["message"] = message;
    }

    // if there is not invitation for this source and this recipitent for this group, create one
    const groupInvitation = await strapi.services["group-invitation"].create(
      data
    );

    return sanitizeEntity(groupInvitation, {
      model: strapi.models["group-invitation"],
    });
  },
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
