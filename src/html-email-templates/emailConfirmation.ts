import { DOMAIN_NAME } from "../utils";

const getEmailConfirmationHtmlTemplate = (verificationToken: string) => `
  <div>
    <a href="${DOMAIN_NAME}/api/users/verify/${verificationToken}" target="_blank">Follow this link to confirm your email</a>
  </div>
`;

export { getEmailConfirmationHtmlTemplate };
