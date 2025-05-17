import fs from 'fs';
import axios from 'axios';
import path from 'path';
import cron from 'node-cron';

const fetchAuthToken = async (): Promise<void> => {
    try {
        const response = await axios.post(`${process.env.API_URL_V2}/Create-Token`, {
            email: process.env.ZETEXA_USERNAME,
            password: process.env.ZETEXA_PASSWORD
        },
        {
            headers: {
                AccessToken: process.env.API_ACCESS_TOKEN
            },
        });

        const token = response.data.session_token;
        const envPath = path.resolve(__dirname, '../../.env');

        const envFile = fs.readFileSync(envPath, 'utf-8');

        const newEnvFile = envFile.replace(/API_AUTH_TOKEN=.*/, `API_AUTH_TOKEN=${token}`);

        fs.writeFileSync(envPath, newEnvFile);

        console.log('Auth token updated successfully!');
    } catch (error) {
        console.error('Error fetching auth token:', error);
    }
};

cron.schedule('0 0 */8 * *', fetchAuthToken);
fetchAuthToken();

export default fetchAuthToken;
