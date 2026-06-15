import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file relative to this file
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
