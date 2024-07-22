#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { getConfig } from "./helpers"
import { NextjsStapiFargateStack } from "./stacks/NextjsStapiFargateStack"

const config = getConfig()

const app = new cdk.App()
new NextjsStapiFargateStack(app, "NextjsStapiFargateStack", {
  stackName: "NextjsStapiFargateStack",
  env: {
    account: config.awsAccountId,
    region: config.awsRegion,
  },
})
