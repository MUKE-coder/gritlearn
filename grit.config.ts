// Grit Framework Configuration
export default {
  name: "gritlearn",
  style: "default",
  api: {
    port: 8080,
    prefix: "/api",
  },
  web: {
    port: 3000,
  },
  admin: {
    port: 3001,
  },
  desktop: {
    framework: "wails",
    port: 5174,
  },
};
