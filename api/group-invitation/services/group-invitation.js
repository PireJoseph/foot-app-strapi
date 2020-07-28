'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
    //retrouve user invitation made by the user
    findMadeByUser(userId) {

        const params = {
            source: userId
        };
    
        return strapi.query('group-invitation').find(params);
    },
    findAddressedToUser(userId) {

        const params = {
            recipient: userId,
            isAnswered: false
        };
    
        return strapi.query('group-invitation').find(params);
    },
};
