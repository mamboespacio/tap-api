import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/create_preference', async (req, res) => {
  try {
    const body = {
      items: [
        {
          title: req.body.title,
          unit_price: req.body.price,
          quantity: req.body.quantity,
          currency_id: 'ARS',
        }
      ]
    }
    const preference = new Preference(client);
    const response = await preference.create({ body });
    res.json(response);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});