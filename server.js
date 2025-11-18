// server.js
import express from "express";
const app = express();
const PORT = 3000;

// для тесту:
app.get("/mono/create-payment-url", (req, res) => {
  const { shop_name, orderId } = req.query;
  console.log("🔹 Запит отримано:", req.query);

  // Тут можна робити логіку створення URL оплати
  res.json({
    ok: true,
    message: `Payment URL created for ${shop_name}, order ${orderId}`,
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
