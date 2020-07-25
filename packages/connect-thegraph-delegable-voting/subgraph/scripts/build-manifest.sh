#!/bin/bash

NETWORK=$1

if [ "$STAGING" ]
then
  FILE=$NETWORK'-staging.json'
else
  FILE=$NETWORK'.json'
fi

DATA=manifest/data/$FILE

echo 'Generating manifest from data file: '$DATA
cat $DATA

mustache \
  -p manifest/templates/sources/OrganizationTemplates.yaml \
  -p manifest/templates/sources/TokenFactories.yaml \
  -p manifest/templates/sources/Tokens.yaml \
  -p manifest/templates/contracts/DAOTemplate.template.yaml \
  -p manifest/templates/contracts/Kernel.template.yaml \
  -p manifest/templates/contracts/DelegableVoting.template.yaml \
  -p manifest/templates/contracts/DelegableMiniMeToken.template.yaml \
  -p manifest/templates/contracts/DelegableMiniMeTokenFactory.template.yaml \
  $DATA \
  subgraph.template.yaml > subgraph.yaml
