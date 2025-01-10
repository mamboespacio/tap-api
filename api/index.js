import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const app = express();

app.use(express.static('public'));
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    next();
  });

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

app.listen(3000, () => console.log('Server ready on port 3000.'));