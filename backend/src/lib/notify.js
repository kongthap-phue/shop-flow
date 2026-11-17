const impl = process.env.TOPIC_ARN ? await import('./notify-aws.js') : await import('./notify-local.js');

export const { listNotifications, publish } = impl;
