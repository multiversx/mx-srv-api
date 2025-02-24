#!/bin/sh
# ENV VARIABLES 
  # MVX_ENV=devnet
  # DAPP_CONFIG=devnet
  # REDIS_IP=127.0.0.1
  # ELASTICSEARCH_URL=https://devnet-index.multiversx.com
  # GATEWAY_URL=https://devnet-gateway.multiversx.com
  # RABBITMQ_URL=amqp://127.0.0.1:5672
  # PROVIDERS_URL=https://devnet-delegation-api.multiversx.com/providers
  # DELEGATION_URL=https://devnet-delegation-api.multiversx.com
  # SOCKET_URL=devnet-socket-api.multiversx.com
  # NODESFETCH_URL= https://devnet-api.multiversx.com
  # TOKENSFETCH_URL= https://devnet-api.multiversx.com
  # PROVIDERSFETCH_URL= https://devnet-api.multiversx.com
  # DATAAPI_URL=https://devnet-data-api.multiversx.com
  # EXCHANGE_URL=https://devnet-graph.xexchange.com/graphql
  # MARKETPLACE_URL=https://devnet-nfts-graph.multiversx.com/graphql
  # ASSETSFETCH_URL=https://tools.multiversx.com/assets-cdn
  # PLACEHOLDER_DAPP_id=devnet
  # PLACEHOLDER_DAPP_name=Devnet
  # PLACEHOLDER_DAPP_egldLabel=xEGLD
  # PLACEHOLDER_DAPP_walletAddress=https://devnet-wallet.multiversx.com
  # PLACEHOLDER_DAPP_apiAddress=https://devnet-api.multiversx.com
  # PLACEHOLDER_DAPP_explorerAddress=http://devnet-explorer.multiversx.com
  # PLACEHOLDER_DAPP_chainId=D

env_vars_with_defaults="MVX_ENV=devnet DAPP_CONFIG=devnet REDIS_IP=127.0.0.1 ELASTICSEARCH_URL=https://devnet-index.multiversx.com GATEWAY_URL=https://devnet-gateway.multiversx.com RABBITMQ_URL=amqp://127.0.0.1:5672 PROVIDERS_URL=https://devnet-delegation-api.multiversx.com/providers   DATAAPI_URL=https://devnet-data-api.multiversx.com EXCHANGE_URL=https://devnet-graph.xexchange.com/graphql MARKETPLACE_URL=https://devnet-nfts-graph.multiversx.com/graphql ASSETSFETCH_URL=https://tools.multiversx.com/assets-cdn DELEGATION_URL=https://devnet-delegation-api.multiversx.com SOCKET_URL=devnet-socket-api.multiversx.com NODESFETCH_URL=https://devnet-api.multiversx.com TOKENSFETCH_URL=https://devnet-api.multiversx.com PROVIDERSFETCH_URL=https://devnet-api.multiversx.com PLACEHOLDER_DAPP_id=devnet PLACEHOLDER_DAPP_name=Devnet PLACEHOLDER_DAPP_egldLabel=xEGLD PLACEHOLDER_DAPP_walletAddress=https://devnet-wallet.multiversx.com PLACEHOLDER_DAPP_apiAddress=https://devnet-api.multiversx.com PLACEHOLDER_DAPP_explorerAddress=http://devnet-explorer.multiversx.com PLACEHOLDER_DAPP_chainId=D"

replace_placeholder() {
  local var_name=$1
  local var_value=$2

  case $var_name in
    PLACEHOLDER_DAPP*) 
      echo "Var ${var_name} defined, replacing ${var_value} in /app/config/dapp.config.placeholder.json"
      sed -i "s|${var_name}|${var_value}|g" /app/config/dapp.config.placeholder.json      
      ;;
    *)
      echo "Var ${var_name} defined, replacing ${var_value} in /app/dist/config/config.yaml"
      sed -i "s|${var_name}|${var_value}|g" /app/dist/config/config.yaml      
      ;;
  esac

}

# Loop through each environment variable
for entry in $env_vars_with_defaults; do
  # Split the entry into name and value
  var_name=$(echo $entry | cut -d= -f1)
  default_value=$(echo $entry | cut -d= -f2)

  # Use the environment variable value if defined; otherwise, use the default
  eval "value=\${$var_name:-$default_value}"

  cp ./config/config.placeholder.yaml /app/dist/config/config.yaml
  if [ $? -eq 0 ]; then
    echo "Config file copied successfully from config/config.placeholder.yaml /app/dist/config/config.yaml"
  fi  

  # Execute the function with the variable name and value
  replace_placeholder "$var_name" "$value"  
  
done

exec /usr/local/bin/node dist/src/main.js
