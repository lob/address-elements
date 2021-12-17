# Address Elements lives on our CDN in S3. Each version has its own folder and its file names are
# always the same. Here is an example:
#   https://cdn.lob.com/lob/address-elements/X.X.X/address-elements.min.js
# However in our repo, version numbers are appended to each minified build. This script removes
# any mentions of a version number. It also creates the merged files used which include our
# minified code with project dependencies (jQuery, Algolia)

# Get package version
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

VERSION_MIN_FILE_NAME=address-elements-${PACKAGE_VERSION// /}.min.js
VERSION_MAP_FILE_NAME=address-elements-${PACKAGE_VERSION// /}.min.js.map
AWS_MIN_FILE_NAME=address-elements.min.js
AWS_MAP_FILE_NAME=address-elements.min.js.map

# Copy contents into latest files for S3
cp lib/$VERSION_MIN_FILE_NAME lib/$AWS_MIN_FILE_NAME
cp lib/$VERSION_MAP_FILE_NAME lib/$AWS_MAP_FILE_NAME

# Update contents of S3 files so that they refer to each other's new file name
sed -i '' "s/${VERSION_MAP_FILE_NAME}/${AWS_MAP_FILE_NAME}/g" lib/$AWS_MIN_FILE_NAME
sed -i '' "s/${VERSION_MIN_FILE_NAME}/${AWS_MIN_FILE_NAME}/g" lib/$AWS_MAP_FILE_NAME

# Recreate merged files with new mininified code
rm lib/address-elements.min.merged.js
sed "s/lob address elements [[:digit:]]\+\.[[:digit:]]\+\.[[:digit:]]\+/lob address elements${PACKAGE_VERSION}/g" lib/merged-dependencies.js > lib/address-elements.min.merged.js
cat lib/$AWS_MIN_FILE_NAME >> lib/address-elements.min.merged.js
cp  lib/$AWS_MAP_FILE_NAME lib/address-elements.min.merged.js.map