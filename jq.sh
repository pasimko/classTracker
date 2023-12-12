#!/bin/sh

# courses=("CS", "MTH")
course=$1

cd data

# for course in "${courses[@]}"; do
jq '.results' < "$course".data > "$course".json
cp "$course".json "$course"_parsed.json
sed -i '1d;$d' "$course"_parsed.json
# For some reason this is the necessary redirect, idk
sed s/},/}/g "$course"_parsed.json > /tmp/test
jq -s 'unique_by(.code)' < /tmp/test > "$course"_parsed.json
# done
