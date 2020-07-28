'use strict';

const bcrypt = require('bcryptjs');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
    findForUserId(userId) {

        const params = {
            members: [userId]
        };

        return  strapi.query('group').find(params, ['members']);
    },
    isHashed(password) {
        if (typeof password !== 'string' || !password) {
            return false;
          }
          return password.split('$').length === 4;
    },
    hashPassword(password) {
        return new Promise(resolve => {
            if (!password || this.isHashed(password)) {
              resolve(null);
            } else {
              bcrypt.hash(`${password}`, 10, (err, hash) => {
                resolve(hash);
              });
            }
          });
    },
    validatePassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    },
};
