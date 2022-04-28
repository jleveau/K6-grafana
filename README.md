# Load Testing
Hello, i developped a tool to monitor the load test of HTTP APIs. The present tool is dockerized and uses the k6 lib to perform load testing. K6 is a tool that executes some go code, with a nice javascript interface.
The results of the tests are stored in an influx database and I designed a grafana dashboard for a more enjoyable visualization.

## Execution with docker
Start the containers with Docker

```bash
docker-compose up
```

## Tests results
The results are output in an influx-db service running on port http://localhost:8086, you can visualize them in a local grafana dashboard http://localhost:3000

## Write your tests
The tests are specified in the loadTesting/tests folder. Each file corresponds to a test scenario. 

```json
{
    // The URL by environments
    "url": {
        "recette": "https://a04api.cdweb.biz/logistic-parcel/parcels/v1",
        "preprod": "https://a02api.cdweb.biz/logistic-parcel/parcels/v1"
    },
    "execution": {
        // The number of virtual users (threads), each thread tries to send as many requests as possible. Each test scenario has multiple stages, and each stages as a fixed duration. Here, the test scenario is composed of 3 stages, First stage has 1 Virtual User instanciated, and lasts 20s, Second stage has 2 virtual users for 20s, and the last stage has 4 VUs for 20 sec
        "vuTargets": [
            1,
            2,
            4,
        ],
        "stepDuration": "20s"
    },
    // All the tests in this array will execute in parallel, so be sure to have enough ressources for sending all these requests
    "tests": [
        {
            "route": "/parcels",
            "method": "GET",
            // The requests parameters : http://targetHost?param1=toto:param2=tata
            "params": {
                "pageIndex": 1,
                "pageSize": 10
            },
            "headers": {
                "Content-Type": "application/json"
            },
            // the success criteria, if one of these fails, the k6 service will return a non 0 exit code. max_duration : If at least 10 percent of the requests lasts more than 400 ms, then the test has failed
            "max_duration": 400,
            // If 10% of the requests fail
            "max_rate_req_failed": 0.1,
            // if 10% of the checks fail, the checks are defined in the code, status must be between 200 and 300. response content must not be empty
            "max_rate_check_failed": 0.1
        },
        {
            "route": "/parcels/ship",
            "method": "POST",
            "body": {
                "olpnId": "509123419",
                "orderId": "2103011547MAT42",
                "partnerOrderId": "12384950581023",
                "shippingDate": "2021-01-01T00:00:00.000+00:00",
                "promiseShippingDateMin": "2021-01-01T00:00:00.000+00:00",
                "promiseShippingDateMax": "2021-01-01T00:00:00.000+00:00",
                "promiseDeliveryDateMin": "2021-01-01T00:00:00.000+00:00",
                "promiseDeliveryDateMax": "2021-01-01T00:00:00.000+00:00",
                "normalizedDeliveryMode": "ExpressHomeDelivery",
                "externalReference": "21010620172XU88",
                "recipient": {
                    "email": "pierre.dupont@outlook.com",
                    "companyName": "Blockbuster",
                    "secondaryPhone": "0648653215"
                }
            },
            "headers": {
                "Content-Type": "application/json"
            },
            "max_duration": 400,
            "max_rate_req_failed": 0.1,
            "max_rate_check_failed": 0.1
        }
    ]
}
```