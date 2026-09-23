class EmailTemplateData {
  constructor() {
    this.id = null;
    this.title = null;
    this.to_person = null;
    this.from_person = null;
    this.cc = null;
    this.subject_line = null;
    this.body_text = null;
    this.create_date = null;
    this.is_active = null;
    this.is_deleted = null;
    this.email_type = null;
  }
}

module.exports = EmailTemplateData;
