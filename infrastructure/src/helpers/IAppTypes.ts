export type IAppConfig = {
  awsAccountId: string
  awsRegion: string
  domain: string
  webSubdomain: string
  apiSubdomain?: string
  applicationName: string
  hostedZoneName: string
}
