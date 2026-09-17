import dotenv from "dotenv";

dotenv.config();

import app from "./app";

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`Shendam Connect backend running on port ${PORT}`);
});
