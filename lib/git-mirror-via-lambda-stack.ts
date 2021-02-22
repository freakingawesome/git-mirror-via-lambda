import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';

interface AppLambdas {
    webhookHandler: lambda.Function,
    mirrorHandler: lambda.Function,
    apiHandler: lambda.Function,
}

export class GitMirrorViaLambdaStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'Vpc', {
          maxAzs: 1,
        });

        const fileSystem = this.createFileSystem(vpc);

        const lambdas = this.createLambdas(vpc, fileSystem);
        this.createApiGateway(lambdas);
        const table = this.createDynamoDB();

        table.grantReadWriteData(lambdas.webhookHandler);
        table.grantReadWriteData(lambdas.apiHandler);

        lambdas.webhookHandler.addEnvironment('TABLE_NAME', table.tableName);
        lambdas.apiHandler.addEnvironment('TABLE_NAME', table.tableName);
    }

    createFileSystem(vpc: ec2.IVpc): efs.AccessPoint {
        const fs = new efs.FileSystem(this, 'FileSystem', {
            vpc,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encrypted: true
        });

        return fs.addAccessPoint('GitMirrorLocalRepoCache', {
            createAcl: {
                ownerGid: '1001',
                ownerUid: '1001',
                permissions: '750'
            },
            path: '/export/lambda',
            posixUser: {
                gid: '1001',
                uid: '1001'
            }
        });
    }

    createLambdas(vpc: ec2.IVpc, fileSystem: efs.IAccessPoint): AppLambdas {
        const webhookHandler = new lambda.Function(this, "gitMirrorViaLambdaWebhookFunction", {
            code: new lambda.AssetCode(path.join(__dirname, "../src")),
            handler: 'webhook/handler.run',
            runtime: lambda.Runtime.NODEJS_14_X,
        });

        // TODO: Protect with IAM Role
        const apiHandler = new lambda.Function(this, "gitMirrorViaLambdaApiFunction", {
            code: new lambda.AssetCode(path.join(__dirname, "../src")),
            handler: 'api/handler.router',
            runtime: lambda.Runtime.NODEJS_14_X,
        });

        const dockerfile = path.join(__dirname, "../src/mirror");
        const mirrorHandler = new lambda.DockerImageFunction(this, "gitMirrorViaLambdaMirrorFunction", {
            code: lambda.DockerImageCode.fromImageAsset(dockerfile),
            vpc: vpc,
            filesystem: lambda.FileSystem.fromEfsAccessPoint(fileSystem, '/mnt/repos')
        });

        return { webhookHandler, mirrorHandler, apiHandler };
    }

    createApiGateway(lambdas: AppLambdas) {
        const gateway = new apigateway.RestApi(this, 'gitMirrorViaLambdaWebhook', {
            restApiName: 'Git Mirror via Lambda Webhook',
        });

        const webhook = gateway.root.addResource('webhook');
        const api = gateway.root.addResource('api');

        webhook.addMethod('POST', new apigateway.LambdaIntegration(lambdas.webhookHandler));
        api.addResource('mirror').addMethod('POST', new apigateway.LambdaIntegration(lambdas.apiHandler), {
            authorizationType: apigateway.AuthorizationType.IAM,
        });
    }

    createDynamoDB(): dynamodb.Table {
        const table = new dynamodb.Table(this, 'GitMirrorViaLambda', {
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: "expires"
        });

        table.addGlobalSecondaryIndex({
            indexName: 'GSI-1',
            partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI-1-SK', type: dynamodb.AttributeType.STRING }
        });

        return table;
    }
}
