const environments = {
    staging: {
        httpPort: 3000,
        httpsPort: 3001,
        envName: 'staging',
        hashingSecret: 'thisIsASecret',
        maxChecks: 5,
        twilio: {
            accountSid: 'AC2acf9c0f7520137150de2f2909a1ece7',
            authToken: 'b732a7ea3242a453b8a8a36f002479df',
            fromPhone: '+18649203871'
        }
    },
    production: {
        httpPort: 5000,
        httpsPort: 5001,
        envName: 'production',
        hashingSecret: 'thisIsAlsoASecret',
        maxChecks: 5,
        twilio: {
            accountSid: '',
            authToken: '',
            fromPhone: ''
        }
    }
};

const currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
const envToExport = typeof(environments[currentEnv]) === 'object' ? environments[currentEnv] : environments.staging;

module.exports = envToExport;