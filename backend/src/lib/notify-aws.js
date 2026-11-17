import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const sns = new SNSClient({});

export const listNotifications = async () => [];

export async function publish(subject, message) {
  await sns.send(new PublishCommand({ TopicArn: process.env.TOPIC_ARN, Subject: 'Shop Flow', Message: `${subject}\n\n${message}` }));
  return { subject, message, sentAt: new Date().toISOString() };
}
