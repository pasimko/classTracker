#!/bin/sh

# All CS classes
curl 'https://classes.oregonstate.edu/api/?page=fose&route=search&subject=CS' -X POST --data-raw '%7B%22other%22%3A%7B%22srcdb%22%3A%22999999%22%7D%2C%22criteria%22%3A%5B%7B%22field%22%3A%22subject%22%2C%22value%22%3A%22CS%22%7D%5D%7D' --output data/CS.data
./jq.sh

# All MTH classes
