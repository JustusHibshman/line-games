#!/bin/bash

# Pass email address and domain to be validated

sudo certbot certonly --manual --preferred-challenges dns --email $1 --domains $2
