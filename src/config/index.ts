import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
     ip_address: process.env.IP_ADDRESS,
     frontend_url: process.env.FONTEND_URL,
     backend_url: process.env.BACKEND_URL,
     reset_pass_expire_time: process.env.RESET_TOKEN_EXPIRE_TIME,
     database_url: process.env.DATABASE_URL,
     node_env: process.env.NODE_ENV,
     port: process.env.PORT,

     bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
     socket_port: process.env.SOCKET_PORT,
     allowed_origins: process.env.ALLOWED_ORIGINS,
     jwt: {
          jwt_secret: process.env.JWT_SECRET,
          jwt_expire_in: process.env.JWT_EXPIRE_IN,
          jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
          jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPIRE_IN,
     },

     email: {
          emailHeader: process.env.EMAIL_HEADER_NAME || 'Rehu App Mailer',
          from: process.env.EMAIL_FROM || '',
          user: process.env.EMAIL_USER || '',

          // Mailgun-specific configuration
          apiKey: process.env.EMAIL_API_KEY || '',
          domain: process.env.EMAIL_DOMAIN || '',
          endpoint: process.env.EMAIL_ENDPOINT || 'https://api.mailgun.net',
     },
     express_sessoin: process.env.EXPRESS_SESSION_SECRET_KEY,
     social: {
          google_client_id: process.env.GOOGLE_CLIENT_ID,
          facebook_client_id: process.env.FACEBOOK_CLIENT_ID,
          google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
          facebook_client_secret: process.env.FACEBOOK_CLIENT_SECRET,
          callback_url: process.env.GOOGLE_CALLBACK_URL,
     },
     twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
     },
     revenuecat_secret_key: process.env.REVENUECAT_SECRET_KYE,
     admin: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
     },
     spaces: {
          SPACES_KEY: process.env.SPACES_KEY,
          SPACES_SECRET: process.env.SPACES_SECRET,
          SPACES_ENDPOINT: process.env.SPACES_ENDPOINT,
          SPACES_BUCKET: process.env.SPACES_BUCKET,
     },
};
