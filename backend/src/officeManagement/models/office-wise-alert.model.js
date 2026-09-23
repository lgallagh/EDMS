class OfficeWiseAlertData {
    constructor() {
        this.id = null;
        this.office_id = null;
        this.office_name = null;
        this.message = null;
        this.start_time = new Date();
        this.end_time = new Date();
        this.status = null;
        this.modified = null;
        this.created = null;
    }
}

module.exports = OfficeWiseAlertData;