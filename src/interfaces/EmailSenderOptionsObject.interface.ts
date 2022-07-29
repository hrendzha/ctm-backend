interface IEmailSenderData {
  from?: string;
  recipientsEmail: string;
  subject: string;
  html: string;
}

export { IEmailSenderData };
