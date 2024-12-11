// Environment-specific settings
const ENV = import.meta.env.MODE;

interface Settings {
    apiUrl: string;
    appName: string;
    // Add other settings here as needed
}

const productionSettings: Settings = {
    apiUrl: 'https://cognify-api.ironcliff.ai',
    appName: 'Research Agent'
};

const developmentSettings: Settings = {
    apiUrl: 'http://localhost:8000',
    appName: 'Research Agent (Dev)'
};

// Select settings based on environment
const settings: Settings = ENV === 'production' ? productionSettings : developmentSettings;

export default settings; 