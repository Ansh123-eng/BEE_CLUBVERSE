import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES Module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = 8080;

import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import logger from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { protect } from './middlewares/auth.js';
import connectDB from './db.js';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "default-src": ["'self'", "*"],
    "img-src": ["'self'", "https:", "data:"],
    "script-src": ["'self'", "*", "'unsafe-inline'"],
    "script-src-attr": ["'self'", "*", "'unsafe-inline'"]
  }
}));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  headers: true
});
app.use('/api', limiter);

app.use(logger);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

import apiRoutes from './api/apiRoutes.js';
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  const { error, success } = req.query;
  res.render('login', { error, success });
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.get('/api/dashboard', protect, (req, res) => {
  const instaImages = [
    'food.jpg', 'drink.jpg', 'pizza.jpg', 'beerr.avif',
    'hand.png', 'taco.png',
    'drum.png', 'wine.png'
  ];
  res.render('dashboard', {
    instaImages,
    user: req.user
  });
});

const chdBars = [
  { name: "BREWESTATE", image: "/images/brewestate.png", link: "/api/brewestate" },
  { name: "BOULEVARD", image: "/images/boul.png", link: "/api/boulevard" },
  { name: "KALA-GHODA", image: "/images/kalaghoda.jpg", link: "/api/kalaghoda" },
  { name: "MOBE", image: "/images/mobe.png", link: "/api/mobe" }
];

const ldhBars = [
  { name: "PAARA - NIGHT CLUB", image: "/images/paara2.jpg", link: "/api/paara" },
  { name: "ROMEO LANE", image: "/images/romeolane.jpg", link: "/api/romeo-ldh" },
  { name: "LUNA - NIGHT CLUB", image: "/images/luna2.avif", link: "/api/luna-ldh" },
  { name: "BAKLAVI - BAR & KITCHEN", image: "/images/baklavi.jpg", link: "/api/baklavi-ldh" }
];

app.get('/api/bar', protect, (req, res) => {
  res.render('bars', {
    chdBars,
    ldhBars,
    user: req.user
  });
});

app.get('/api/reserve-table', protect, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reservation.html'));
});

app.get('/api/team', protect, (req, res) => {
  const team = [
    { name: "Ansh Vohra", role: "Back-End Web Developer", image: "/images/ansh.jpg" },
    { name: "Akhil Handa", role: "Back-End Web Developer", image: "/images/akhil.jpg" },
    { name: "Anmol Singh", role: "Back-End Web Developer", image: "/images/anmol11.jpg" }
  ];
  res.render('team', { team, user: req.user });
});

const barPages = ['brewestate', 'boulevard', 'kalaghoda', 'mobe', 'paara', 'romeo-ldh', 'luna-ldh', 'baklavi-ldh'];
barPages.forEach(page => {
  app.get(`/api/${page}`, protect, (req, res) => {
    res.render(page, { user: req.user });
  });
});

const staticPages = ['faq', 'ourservices', 'contactus'];
staticPages.forEach(page => {
  app.get(`/api/${page}`, (req, res) => {
    res.render(page);
  });
});

app.use(errorHandler);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
