const { Expose } = require('class-transformer');

class EDMSUser {
  constructor() {
    this.id = null;
    this.username = null;
    this.password = null;
    this.section = null;
    this.status = null;
    this.privilege = null;
    this.created = null;
    this.modified = null;
  }
}

// Apply field renaming using class-transformer annotations
Expose({ name: 'id' })(EDMSUser.prototype, 'id');
Expose({ name: 'username' })(EDMSUser.prototype, 'username');
Expose({ name: 'password' })(EDMSUser.prototype, 'password');
Expose({ name: 'section' })(EDMSUser.prototype, 'section');
Expose({ name: 'status' })(EDMSUser.prototype, 'status');
Expose({ name: 'privilege' })(EDMSUser.prototype, 'privilege');
Expose({ name: 'created' })(EDMSUser.prototype, 'created');
Expose({ name: 'modified' })(EDMSUser.prototype, 'modified');

module.exports = { EDMSUser };
