#!/bin/sh

cd data
jq '.results' < CS.data > CS.json
cp CS.json CS_parsed.json
sed -i '1d;$d' CS_parsed.json
# For some reason this is the necessary redirect, idk
sed s/},/}/g CS_parsed.json > /tmp/test
jq -s 'unique_by(.code)' < /tmp/test > CS_parsed.json
