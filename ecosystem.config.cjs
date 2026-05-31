// PM2 process config for the VPS (CloudPanel Node.js Site).
// Start with:  pm2 start ecosystem.config.cjs
//
// Adjust `cwd` to the actual app directory created by CloudPanel, e.g.
//   /home/<site-user>/htdocs/nl.orbitsmartcodes.com
module.exports = {
  apps: [
    {
      name: "orbitsmartcodes-nl",
      cwd: "/home/nl-orbitsmartcodes/htdocs/nl.orbitsmartcodes.com",
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3006,
      },
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
    },
  ],
};
