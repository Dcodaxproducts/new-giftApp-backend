module.exports = {
  apps: [
    {
      name: 'gift-app-backend',
      script: 'dist/main.js',
      cwd: '/srv/new-giftApp-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
