

export const apiRoutes = {
    suggestions: '/cigar/suggestions',
    search: '/cigar/search',
    filters: '/cigar/filters',
    getCigarById: '/cigar',
}

export const environment = process.env.NODE_ENV === 'production' ?
    {
        apiBaseUrl: '/api',
        fileServerUrl: '/files'
    }
    :
    {
        apiBaseUrl: 'http://localhost:5000/api',
        fileServerUrl: 'http://localhost:5000'
    }

export const filtersValues = {
    cigarLength: ['2-2.9', '3-3.9', '4-4.9', '5-5.9', '6-6.9', '7-7.9', '8-8.9', '9-10'],
    rings: ['10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-80'],
    strengths: [
        "Mild",
        "Mellow",
        "Mellow - Medium",
        "Medium",
        "Medium - Full",
        "Full",
    ],
}

export const capitalize = (str) => {
    if (str.toLowerCase() === 'usa') {
        return str.toUpperCase();
    }
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export const generateShareUrl = (baseURL, source) => {
    const utmParams = new URLSearchParams({
        utm_source: source,
        utm_medium: 'social',
        utm_campaign: 'cigar_deal_sharing'
    });

    return encodeURI(`${baseURL}?${utmParams.toString()}`);
};