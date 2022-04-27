import http from 'k6/http';

export default function getAuthenticationToken(auth) {
    const requestBody = {
        client_id: auth.client_id,
        client_secret: auth.client_secret,
        grant_type: auth.grant_type
    };
    const response = http.post(auth.url, requestBody);
    const data = response.json();
    return data.access_token;
}