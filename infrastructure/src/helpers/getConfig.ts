import * as dotenv from "dotenv"
import { IAppConfig } from "./IAppTypes"

export const getConfig = (): IAppConfig => {
  dotenv.config({ path: "../.env" })
  const {
    AWS_ACCOUNT_ID,
    AWS_REGION,
    DOMAIN,
    API_SUBDOMAIN,
    WEB_SUBDOMAIN,
    APPLICATION_NAME,
    HOSTED_ZONE_NAME,
  } = process.env

  if (!AWS_ACCOUNT_ID) {
    throw new Error("AWS_ACCOUNT_ID is not specified")
  }
  if (!AWS_REGION) {
    throw new Error("AWS_REGION is not specified")
  }
  if (!DOMAIN) {
    throw new Error("DOMAIN is not specified")
  }
  // if (!API_SUBDOMAIN) {
  //   throw new Error("API_SUBDOMAIN is not specified");
  // }
  if (!WEB_SUBDOMAIN) {
    throw new Error("WEB_SUBDOMAIN is not specified")
  }
  if (!APPLICATION_NAME) {
    throw new Error("APPLICATION_NAME is not specified")
  }
  if (!HOSTED_ZONE_NAME) {
    throw new Error("HOSTED_ZONE_NAME is not specified")
  }

  return {
    awsAccountId: AWS_ACCOUNT_ID,
    awsRegion: AWS_REGION,
    domain: DOMAIN,
    // apiSubdomain: API_SUBDOMAIN,
    webSubdomain: WEB_SUBDOMAIN,
    applicationName: APPLICATION_NAME,
    hostedZoneName: HOSTED_ZONE_NAME,
  }
}
