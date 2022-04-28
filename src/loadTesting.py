import os
import json

import sys

TEST_DIRECTORY = os.path.join(os.path.dirname(__file__), "..", 'tests')
INFLUXDB_HOST = 'http://{influx}'.format(influx=os.environ['INFLUXDB_HOST'])


if __name__ == '__main__':
    exitStatus = 0

    for filename in os.listdir(TEST_DIRECTORY):
        f = os.path.join(TEST_DIRECTORY, filename)
        if os.path.isfile(f):
            testSetup = json.load(open(f, ('r')))
            os.environ["TEST_SETUP"] = json.dumps(testSetup)
        status = os.system("k6 run --out influxdb={influx_HOST} src/k6.js".format(
            influx_HOST=INFLUXDB_HOST))
        if status != 0:
            exitStatus = status
    sys.exit(exitStatus)
