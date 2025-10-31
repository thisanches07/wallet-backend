#!/bin/bash

# Script de deploy para Google Cloud Run
# Certifique-se de ter o gcloud CLI instalado e configurado

# Configurações
PROJECT_ID="seu-project-id"  # Substitua pelo seu Project ID
SERVICE_NAME="wallet-backend"
REGION="us-central1"  # Ou sua região preferida
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Iniciando deploy do Wallet Backend para Cloud Run..."

# 1. Build da imagem Docker
echo "📦 Fazendo build da imagem Docker..."
docker build -t $IMAGE_NAME .

# 2. Push para Google Container Registry
echo "☁️ Enviando imagem para Google Container Registry..."
docker push $IMAGE_NAME

# 3. Deploy no Cloud Run
echo "🎯 Fazendo deploy no Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300s \
  --concurrency 100 \
  --set-env-vars NODE_ENV=production,PORT=3001

echo "✅ Deploy concluído!"
echo "🌐 Sua aplicação estará disponível em:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'

echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente no Console do Cloud Run"
echo "2. Configure o Secret Manager para dados sensíveis (Firebase keys, DB passwords)"
echo "3. Configure um domínio customizado se necessário"
