"use strict";

// Public dependencies.
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  // retrieve my groups
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services.group.findForUserId(user.id);
    return data.map(group => sanitizeEntity(group, { model: strapi.models.group }));
  },

  // create a new group
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }
    let createGroupData = ctx.request.body;

    createGroupData.members = [user.id];
    if (createGroupData.password) {
      createGroupData.password = await strapi.services.group.hashPassword(
        createGroupData.password
      );
    }
    const data = await strapi.services.group.create(createGroupData);
    return sanitizeEntity(data, { model: strapi.models.group });
  },

  // leave a group
  async leave(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const groupId = ctx.params.id;
    let data = await strapi.services.group.findOne({ id: groupId });
    if (!data) {
      return ctx.badRequest(null, [
        { messages: [{ id: "Unable to retrieve the group with this id" }] },
      ]);
    }

    data.members = data.members.filter((e) => {
      return e.id !== user.id;
    });
    const updatedData = await strapi.services.group.update(
      { id: groupId },
      data
    );

    return sanitizeEntity(updatedData, { model: strapi.models.group });

  },

  // join a group
  async join(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const { name, password } = ctx.request.body;

    if (!name) return ctx.badRequest("missing.name");
    if (!password) return ctx.badRequest("missing.password");

    let data = await strapi.services.group.findOne({ name: name });
    if (!data) {
      return ctx.badRequest(null, [
        { messages: [{ id: "Unable to retrieve the group with this id" }] },
      ]);
    }

    let validPassword = false;
    const isPasswordHashed = strapi.services.group.isHashed(data.password)
    if(isPasswordHashed) {
      validPassword = strapi.services.group.validatePassword(
        password,
        data.password
      );
    } else {
      validPassword = data.password === password
    }

    if (!validPassword) {
      return ctx.badRequest('name or password invalid.')
    }

    data.members = [...data.members, user]
    const updatedData = await strapi.services.group.update(
      { id: data.id },
      data
    );

    return sanitizeEntity(updatedData, { model: strapi.models.group });
  },
};
