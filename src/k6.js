
import { check, fail } from 'k6';

import http from 'k6/http';
import getAuthenticationToken from './authenticate.js';

const testsDataJSON = __ENV.TEST_SETUP;
const testsData = JSON.parse(testsDataJSON);

const authentificationJSON = "./auth.json";
const authConfigurations = JSON.parse(open(authentificationJSON));

const stepDuration = testsData.execution.stepDuration;
const vuTargets = testsData.execution.vuTargets;

let scenarios = {};
let thresholds = {};
for (const test of testsData.tests) {
    const scenarioName = test.method + test.route.replace(/\//g, "_").replace("{", "").replace("}", "");
    scenarios[scenarioName] = {
        tags: { name: scenarioName },
        env: {
            url: testsData.url[__ENV.ENVIRONMENT],
            test: JSON.stringify(test),
        },
        executor: "ramping-vus",
        stages: vuTargets.map(targetValue => ({duration: stepDuration, target: targetValue})),
        gracefulRampDown: '0s',
    };
    thresholds[`http_req_duration{name:${scenarioName}}`] = [`p(90) < ${test.max_duration}`];
    thresholds[`max_rate_req_failed{name:${scenarioName}}`] = [`rate < ${test.max_rate_req_failed}`];
    thresholds[`max_rate_check_failed{name:${scenarioName}}`] = [`rate < ${test.max_rate_check_failed}`];
}

export const options = {
    scenarios: scenarios,
    thresholds: thresholds
};

export function setup () {
    const auth = authConfigurations[__ENV.ENVIRONMENT];
    const bearerToken = getAuthenticationToken(auth);
    return { bearerToken };
}

export default function (data) {
    const bearerToken = data.bearerToken;
    const test = JSON.parse(__ENV.test);
    const url = __ENV.url;
    switch(test.method) {
        case "GET":
            get(url, test, bearerToken);
            break;
        case "POST":
            post(url, test, bearerToken);
            break;
        default:
            throw new Error(`Unsupported method ${test.method}`);
    }
}

function get(url, test, bearerToken) {
    const headers = test.headers;
    headers.Authorization = `Bearer ${bearerToken}`;

    const requestURL = getRequestUrl(url, test);
    const response = http.get(requestURL, { headers },  { tags: { name: "GET" + test.route } });

    const result = check(response, { 
        "status success": (r => checkStatusSuccess(r)),
        "content is not empty": (r => checkContentNotEmpty(r)),
    }, {
        status: response.status,
        status_success: response.status >= 200 && response.status < 300,
        name: "GET" + test.route,
        url: requestURL,
        failure_reason: response.error,
    });
    if (!result){
        fail(`API route GET ${test.route} Failed, Status code is ${response.status}, message: ${response.body}`);
    }
}

function post(url, test, bearerToken) {
    const headers = test.headers;
    headers.Authorization = `Bearer ${bearerToken}`;
    const body = test.body;
    const requestURL = getRequestUrl(url, test);
    const response = http.post(requestURL, JSON.stringify(body), { headers });
    const result = check(response, {
        "status success": (r => checkStatusSuccess(r)),
        "content is not empty": (r => checkContentNotEmpty(r)),
    }, {
        status: response.status,
        status_success: checkStatusSuccess(response),
        name: "POST" + test.route,
        url: requestURL,
        failure_reason: response.error,
    });

    if (!result) {
        fail(`API route POST ${test.route} Failed, Status code is ${response.status}, message: ${response.body}`);
    }
}

function getRequestUrl(url,test) {
    let paramsString = "";
    if (test.params) {
        const params = [];
        for (const [key, value] of Object.entries(test.params)) {
            params.push(`${key}=${value}`);
        }
        paramsString = "?" + params.join("&");
    }
    let route = test.route;
    if (test.query) {

        for (const [key, value] of Object.entries(test.query)) {

            route = route.replace(`{${key}}`, value);
        }
    }
    return `${url}${route}${paramsString}`;

}

function checkStatusSuccess(response) {
    if (response.status >= 200 && response.status < 300) {
        return true;
    }
    return false;
}

function checkContentNotEmpty(response) {
    if (response.body === undefined) {
        return false;
    }
    if (response.body.length > 0) {
        return true;
    }
    return false;
}