import express, { response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
//pour la verification des données clients
import { query } from 'express-validator';
//pour limiter le nombre de requetes par la même adresse IP
import rateLimit from 'express-rate-limit';
//pour gérer le cache afin d'éviter un appel vers l'api si la réponse est la même
import NodeCache from 'node-cache';

const app = express();
const port = 4000;
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
dotenv.config();


const meteoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limite à 100 requêtes par IP dans la fenêtre définie
    handler: (req, res, next, options) =>
        res.status(options.statusCode).send({ message: 'trop de requêtes, veuillez essayer plus tard' }),
});


const validateCity = query('city').notEmpty().escape(); 

const getWeather =  async (req, res) => {
    const { city } = req.params
    const cacheData = apiCache.get(city);
    if (cacheData) {
        console.log('depuis le cache !');
        res.status(200).send(cacheData)
    } else {
        try {
            const options = {
                method: 'GET',
                url: 'https://weatherapi-com.p.rapidapi.com/current.json',
                params: { q: city },
                headers: {
                    'X-RapidAPI-Key': process.env.API_KEY,
                    'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
                }
            };
            const response = await axios.request(options);
            const apiDataToSend = { temperature: response.data.current.temp_c, description: response.data.current.condition.text }
            apiCache.set(city, apiDataToSend, 300);
            res.status(200).send(apiDataToSend);
        } catch (error) {
            if (error.response.data.error.code === 2007) {
                res.status(403).send({ message: 'limitation de requetes atteinte' });
            }
            if (error.response.data.error.code === 1006) {
                res.status(400).send({ message: 'pas de méteo à cette ville non reconnue' });
            } else {
                res.status(500).send({ message: 'un probleme est survenu' });
            }
        }
    }
};

app.use('/meteo/:city', meteoLimiter, validateCity, getWeather);


app.listen(port, () => {
    return console.log(`listen to port ${port}`)
});

export default app;