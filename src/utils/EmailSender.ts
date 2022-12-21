import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { IEmailSenderData } from "../interfaces";

const { SENDGRID_API_KEY } = process.env;
sgMail.setApiKey(SENDGRID_API_KEY as string);

class EmailSender {
  private FROM = "pashahrendzha@meta.ua";
  private emailData: IEmailSenderData;

  constructor(emailData: IEmailSenderData) {
    this.emailData = emailData;
  }

  async send() {
    try {
      if (!this.emailData.from) {
        this.emailData.from = this.FROM;
      }

      await sgMail.send(this.emailData as MailDataRequired);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export { EmailSender };
