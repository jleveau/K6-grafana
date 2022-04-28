import os
import json

TEST_DIRECTORY = os.path.join(os.path.dirname(__file__), "..", 'tests')
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", 'data.json')

INFLUXDB_HOST = 'http://{influx}'.format(influx=os.environ['INFLUXDB_HOST'])
if __name__ == '__main__':

    for filename in os.listdir(TEST_DIRECTORY):
        f = os.path.join(TEST_DIRECTORY, filename)
        if os.path.isfile(f):
            testSetup = json.load(open(f, ('r')))
            os.environ["TEST_SETUP"] = json.dumps(testSetup)

        os.system("k6 run --out influxdb={influx_HOST} src/k6.js".format(
            influx_HOST=INFLUXDB_HOST))
