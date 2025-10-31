# Script de deploy para Google Cloud Run (PowerShell)
# Certifique-se de ter o gcloud CLI instalado e configurado

# Configurações
$PROJECT_ID = "seu-project-id"  # Substitua pelo seu Project ID
$SERVICE_NAME = "wallet-backend"
$REGION = "us-central1"  # Ou sua região preferida
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Iniciando deploy do Wallet Backend para Cloud Run..." -ForegroundColor Green

# 1. Build da imagem Docker
Write-Host "📦 Fazendo build da imagem Docker..." -ForegroundColor Blue
docker build -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build da imagem" -ForegroundColor Red
    exit 1
}

# 2. Push para Google Container Registry
Write-Host "☁️ Enviando imagem para Google Container Registry..." -ForegroundColor Blue
docker push $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no push da imagem" -ForegroundColor Red
    exit 1
}

# 3. Deploy no Cloud Run
Write-Host "🎯 Fazendo deploy no Cloud Run..." -ForegroundColor Blue
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 3001 `
    --memory 512Mi `
    --cpu 1 `
    --max-instances 10 `
    --min-instances 0 `
    --timeout 300s `
    --concurrency 100 `
    --set-env-vars "NODE_ENV=production,PORT=3001"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy concluído!" -ForegroundColor Green
    Write-Host "🌐 Sua aplicação estará disponível em:" -ForegroundColor Yellow
    $url = gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
    Write-Host $url -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Configure as variáveis de ambiente no Console do Cloud Run"
    Write-Host "2. Configure o Secret Manager para dados sensíveis (Firebase keys, DB passwords)"
    Write-Host "3. Configure um domínio customizado se necessário"
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    exit 1
}
