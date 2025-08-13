import { createApp } from "./app.js";

const app = createApp();

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
