#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GitMirrorViaLambdaStack } from '../lib/git-mirror-via-lambda-stack';

const app = new cdk.App();
new GitMirrorViaLambdaStack(app, 'GitMirrorViaLambdaStack');
