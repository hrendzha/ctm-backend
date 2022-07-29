const DOMAIN_NAME =
  process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_DOMAIN_NAME
    : process.env.DEV_DOMAIN_NAME;

export { DOMAIN_NAME };
