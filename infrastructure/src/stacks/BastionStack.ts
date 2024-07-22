import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import { Stack, StackProps } from "aws-cdk-lib"
import { Vpc } from "aws-cdk-lib/aws-ec2"

import * as ec2 from "aws-cdk-lib/aws-ec2"

export interface BastionHostProps extends StackProps {
  vpc: Vpc
  securityGroup: ec2.SecurityGroup
}

export class BastionHost extends Stack {
  constructor(scope: Construct, id: string, props: BastionHostProps) {
    super(scope, id, props)

    // Bastion Host
    // ------------
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      "BastionSecurityGroup",
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        description: "Security group for bastion host",
        securityGroupName: "BastionSecurityGroup",
      }
    )

    // Allow ssh access to bastion host
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "SSH access"
    )

    const bastionHostLinux = new ec2.BastionHostLinux(
      this,
      "BastionHostLinux",
      {
        vpc: props.vpc,
        securityGroup: bastionSecurityGroup,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.NANO
        ),
        subnetSelection: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    )

    // allow the bastion to access the ec2 instance that is hosting the psql
    bastionHostLinux.connections.allowTo(
      props.securityGroup,
      ec2.Port.tcp(5432)
    )

    const createSshKeyCommand = "ssh-keygen -t rsa -f my_rsa_key"
    const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${cdk.Aws.REGION} --instance-id ${bastionHostLinux.instanceId} --availability-zone ${bastionHostLinux.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://my_rsa_key.pub`
    const sshCommand = `ssh -i my_rsa_key ec2-user@${bastionHostLinux.instancePublicDnsName}`
    const sshTunnelCommand = `ssh -i my_rsa_key -N -L 5432:postgres.myapp.local:5432  ec2-user@${bastionHostLinux.instancePublicDnsName} -v`

    new cdk.CfnOutput(this, "CreateSshKeyCommand", {
      value: createSshKeyCommand,
    })
    new cdk.CfnOutput(this, "PushSshKeyCommand", { value: pushSshKeyCommand })
    new cdk.CfnOutput(this, "SSHTunnelCommand", { value: sshTunnelCommand })
    new cdk.CfnOutput(this, "SshCommand", { value: sshCommand })
  }
}
