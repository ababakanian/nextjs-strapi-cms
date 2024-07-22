import { Construct } from "constructs"
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib"
import { IpAddresses, Vpc } from "aws-cdk-lib/aws-ec2"
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2"
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery"
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2"

// const POSTGRES_IMAGE = "public.ecr.aws/docker/library/postgres:16"
const POSTGRES_IMAGE = "../db"
const POSTGRES_PORT = 5432
const POSTGRES_HOST = "postgres.myapp.local"
const POSTGRES_USERNAME = "postgres"
const POSTGRES_PASSWORD = "mysecretpassword"

const STRAPI_IMAGE = "../cms"
const STRAPI_DB_NAME = "cms"
const STRAPI_PORT = 1337
const STRAPI_HOST = "strapi.myapp.local"

const NEXTJS_IMAGE = "../frontend"
const NEXTJS_DB_NAME = "dashboard"
const NEXTJS_PORT = 3000

export class NextjsStapiFargateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const vpc = new Vpc(this, `${id}-vpc`, {
      vpcName: `${id}-vpc`,
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      createInternetGateway: true,
      // natGateways: 0,
    })

    const cluster = new ecs.Cluster(this, `${id}-cluster`, {
      clusterName: `${id}-cluster`,
      vpc,
      containerInsights: true,
    })

    const alb = new elbv2.ApplicationLoadBalancer(this, `${id}-alb`, {
      vpc,
      internetFacing: true,
    })

    // Enable Cloud Map namespace for the cluster
    // this is used to assign local DNS hostnames to fargate instances
    const namespace = cluster.addDefaultCloudMapNamespace({
      name: "myapp.local",
    })

    // ==============
    // PostgresSQL
    // ==============
    // do not add it to a load balancer
    // Create a secret for the database password
    // const databaseSecret = new secretsmanager.Secret(this, "PostgresPassword", {
    //   generateSecretString: {
    //     excludePunctuation: true,
    //   },
    // })

    // Create a security group for the postgres service
    const postgresSecurityGroup = new ec2.SecurityGroup(
      this,
      "PostgresSecurityGroup",
      {
        vpc: vpc,
        description: "Security group for Postgres Fargate service",
        allowAllOutbound: true,
      }
    )

    postgresSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(POSTGRES_PORT),
      "Allow Postgres access from within VPC"
    )

    // Create a postgres task definition
    const postgresTaskDef = new ecs.FargateTaskDefinition(
      this,
      "PostgresTaskDef",
      {
        cpu: 512,
        memoryLimitMiB: 1024,
      }
    )

    postgresTaskDef.addContainer("PostgresContainer", {
      image: ecs.ContainerImage.fromAsset(POSTGRES_IMAGE),
      environment: {
        // POSTGRES_DB: POSTGRES_DB_NAME,
        POSTGRES_USER: POSTGRES_USERNAME,
        POSTGRES_PASSWORD: POSTGRES_PASSWORD,
      },
      secrets: {
        // POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret),
        // POSTGRES_PASSWORD: POSTGRES_PASSWORD
      },
      portMappings: [
        {
          containerPort: POSTGRES_PORT,
          hostPort: POSTGRES_PORT,
          // hostPort: POSTGRES_CONTAINER_PORT,
          // containerPort: POSTGRES_PORT,
        },
      ],
      logging: new ecs.AwsLogDriver({ streamPrefix: "postgres" }),
    })

    // Create the Fargate service
    const postgresService = new ecs.FargateService(this, "postgresService", {
      serviceName: `${id}-postgres-service`,
      cluster: cluster,
      taskDefinition: postgresTaskDef,
      securityGroups: [postgresSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      // Add these lines to use SPOT instances
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 1,
        },
      ],
      cloudMapOptions: {
        cloudMapNamespace: namespace,
        name: "postgres",
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
    })

    // Output connection information
    // new CfnOutput(this, "DatabaseConnectionInfo", {
    //   value: `Host:, Port: ${POSTGRES_PORT}, Database: ${POSTGRES_DB_NAME}`,
    //   description: "Database connection information",
    // })

    // ==============
    // Strapi Service
    // ==============

    // security group
    const strapiSecurityGroup = new ec2.SecurityGroup(
      this,
      "strapiSecurityGroup",
      {
        vpc: vpc,
        description: "Security group for Strapi VPC access",
        allowAllOutbound: true,
      }
    )

    strapiSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(STRAPI_PORT),
      "Allow Strapi port access from within VPC"
    )

    // Create a Fargate task definition
    const strapiTaskDef = new ecs.FargateTaskDefinition(this, "strapiTaskDef", {
      cpu: 512,
      memoryLimitMiB: 1024,
    })

    strapiTaskDef.addContainer("StrapiContainer", {
      image: ecs.ContainerImage.fromAsset(STRAPI_IMAGE),
      environment: {
        DATABASE_CLIENT: "postgres",
        // DATABASE_FILENAME: ".tmp/data.db",
        DATABASE_HOST: POSTGRES_HOST,
        DATABASE_PORT: POSTGRES_PORT.toString(),
        DATABASE_NAME: STRAPI_DB_NAME,
        DATABASE_USERNAME: POSTGRES_USERNAME,
        DATABASE_PASSWORD: POSTGRES_PASSWORD,
        HOST: "0.0.0.0",
        PORT: STRAPI_PORT.toString(),
        APP_KEYS:
          "6JpUUCo58AZsymQvDfBXEQ==,3h8HMAN4ecwI+PKXYp9c3g==,PjmwGtPaCxmzxQM6UN98zg==,7i4o1VkbScSG6/A6Qf+jGQ==",
        API_TOKEN_SALT: "pzePr4t59BQnEuNE3ua1kg==",
        ADMIN_JWT_SECRET: "NuINNcRJUsDIZAe8kwKnpQ==",
        TRANSFER_TOKEN_SALT: "i7xTKOHCg29ng5Z5opb0EQ==",
        JWT_SECRET: "/pjWq0eHsZyTLVybtaU4bA==",
      },
      secrets: {
        // POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret),
        // POSTGRES_PASSWORD: POSTGRES_PASSWORD
      },
      portMappings: [
        {
          containerPort: STRAPI_PORT,
          hostPort: STRAPI_PORT,
        },
      ],
      logging: new ecs.AwsLogDriver({ streamPrefix: "strapi" }),
    })

    // Create the Fargate service
    const strapiFargateService = new ecs.FargateService(this, "strapiService", {
      serviceName: `${id}-strapi-service`,
      cluster,
      taskDefinition: strapiTaskDef,
      securityGroups: [strapiSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      // Add these lines to use SPOT instances
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 1,
        },
      ],
      cloudMapOptions: {
        cloudMapNamespace: namespace,
        name: "strapi",
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
    })

    // access postgres database
    strapiFargateService.connections.allowTo(
      postgresSecurityGroup,
      ec2.Port.tcp(POSTGRES_PORT)
    )

    // load balancer target group
    const strapiTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "strapiTargetGroup",
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: "/",
          interval: Duration.seconds(120),
          timeout: Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    )

    strapiTargetGroup.addTarget(strapiFargateService)

    // ==============
    // NextJS Fargate
    // ==============
    const nextjsSecurityGroup = new ec2.SecurityGroup(
      this,
      "nextjsSecurityGroup",
      {
        vpc: vpc,
        description: "NextJs security group for public access",
        allowAllOutbound: true,
      }
    )

    nextjsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(NEXTJS_PORT),
      "Allow nextjs port access from within VPC"
    )

    // Create a Fargate task definition
    const nextjsTaskDef = new ecs.FargateTaskDefinition(this, "nextjsTaskDef", {
      cpu: 512,
      memoryLimitMiB: 1024,
    })

    nextjsTaskDef.addContainer("NextJsContainer", {
      image: ecs.ContainerImage.fromAsset(NEXTJS_IMAGE),
      environment: {
        // POSTGRES_URL: `postgresql://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}/${POSTGRES_DB_NAME}?sslmode=require`,
        STRAPI_HOST: STRAPI_HOST,
        STRAPI_PORT: `${STRAPI_PORT}`,
        DATABASE_HOST: POSTGRES_HOST,
        DATABASE_PORT: POSTGRES_PORT.toString(),
        DATABASE_NAME: NEXTJS_DB_NAME,
        DATABASE_USERNAME: POSTGRES_USERNAME,
        DATABASE_PASSWORD: POSTGRES_PASSWORD,
      },
      secrets: {
        // POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret),
        // POSTGRES_PASSWORD: POSTGRES_PASSWORD
      },
      portMappings: [
        {
          containerPort: NEXTJS_PORT,
          hostPort: NEXTJS_PORT,
        },
      ],
      logging: new ecs.AwsLogDriver({ streamPrefix: "nextjs" }),
    })

    // Create the Fargate service
    const nextjsFargateService = new ecs.FargateService(
      this,
      "nextjsFargateService",
      {
        serviceName: `${id}-nextjsFargateService`,
        cluster,
        taskDefinition: nextjsTaskDef,
        securityGroups: [nextjsSecurityGroup],
        assignPublicIp: false,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        // Add these lines to use SPOT instances
        capacityProviderStrategies: [
          {
            capacityProvider: "FARGATE_SPOT",
            weight: 1,
          },
        ],
      }
    )

    // access postgres database
    nextjsFargateService.connections.allowTo(
      postgresSecurityGroup,
      ec2.Port.tcp(POSTGRES_PORT)
    )

    // access Strapi API
    nextjsFargateService.connections.allowTo(
      strapiSecurityGroup,
      ec2.Port.tcp(STRAPI_PORT)
    )

    // load balancer target group
    const nextjsTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "nextjsTargetGroup",
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: "/",
          interval: Duration.seconds(120),
          timeout: Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    )

    nextjsTargetGroup.addTarget(nextjsFargateService)

    // ==============
    // Load balancers
    // ==============

    // Create listener
    const listener = alb.addListener("alb-listener", {
      port: 80,
      open: true,
    })

    // Add routing rules
    listener.addAction("strapiRoute", {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/admin*"])],
      action: elbv2.ListenerAction.forward([strapiTargetGroup]),
    })

    // Default action
    listener.addAction("Default", {
      action: elbv2.ListenerAction.forward([nextjsTargetGroup]),
    })

    // Output the load balancer URL
    new CfnOutput(this, `${id}-url`, {
      value: `http://${alb.loadBalancerDnsName}`,
    })
  }
}
