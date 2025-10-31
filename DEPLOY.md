# Deploy no Google Cloud Run

Este guia explica como fazer o deploy da aplicação Wallet Backend no Google Cloud Run.

## Pré-requisitos

1. **Google Cloud CLI instalado**
   ```bash
   # Windows (usando Chocolatey)
   choco install gcloudsdk
   
   # macOS (usando Homebrew)
   brew install --cask google-cloud-sdk
   
   # Linux
   # Siga as instruções em: https://cloud.google.com/sdk/docs/install
   ```

2. **Docker instalado**
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

3. **Configurar o Google Cloud CLI**
   ```bash
   gcloud auth login
   gcloud config set project SEU-PROJECT-ID
   gcloud auth configure-docker
   ```

## Opções de Deploy

### Opção 1: Deploy Automático (Recomendado)

1. **Para Linux/macOS:**
   ```bash
   chmod +x deploy-cloud-run.sh
   ./deploy-cloud-run.sh
   ```

2. **Para Windows:**
   ```powershell
   .\deploy-cloud-run.ps1
   ```

### Opção 2: Deploy Manual

1. **Build da imagem Docker:**
   ```bash
   docker build -t gcr.io/SEU-PROJECT-ID/wallet-backend .
   ```

2. **Push para Google Container Registry:**
   ```bash
   docker push gcr.io/SEU-PROJECT-ID/wallet-backend
   ```

3. **Deploy no Cloud Run:**
   ```bash
   gcloud run deploy wallet-backend \
     --image gcr.io/SEU-PROJECT-ID/wallet-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3001 \
     --memory 512Mi \
     --cpu 1 \
     --max-instances 10 \
     --min-instances 0 \
     --timeout 300s \
     --concurrency 100
   ```

## Configuração de Variáveis de Ambiente

Após o deploy, você precisará configurar as variáveis de ambiente no Console do Cloud Run:

### Variáveis Básicas
- `NODE_ENV=production`
- `PORT=3001`

### Variáveis do Banco de Dados
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DATABASE_URL`

### Variáveis do Firebase
- `FIREBASE_TYPE`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_AUTH_URI`
- `FIREBASE_TOKEN_URI`
- `FIREBASE_AUTH_PROVIDER_X509_CERT_URL`
- `FIREBASE_CLIENT_X509_CERT_URL`
- `FIREBASE_UNIVERSE_DOMAIN`

### Variáveis do Pluggy
- `PLUGGY_CLIENT_ID`
- `PLUGGY_CLIENT_SECRET`
- `PLUGGY_API_KEY`

## Usando Google Secret Manager (Recomendado para Produção)

Para dados sensíveis, use o Secret Manager:

1. **Criar secrets:**
   ```bash
   echo "sua-senha-db" | gcloud secrets create db-password --data-file=-
   echo "sua-chave-firebase" | gcloud secrets create firebase-private-key --data-file=-
   ```

2. **Configurar no Cloud Run:**
   ```bash
   gcloud run services update wallet-backend \
     --update-secrets DB_PASSWORD=db-password:latest \
     --update-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest \
     --region us-central1
   ```

## Configurações de Rede

### CORS
A aplicação já está configurada para aceitar requisições de diferentes origens. Configure a variável `FRONTEND_URL` com a URL do seu frontend.

### Domínio Customizado
Para usar um domínio customizado:

1. **Mapear domínio:**
   ```bash
   gcloud run domain-mappings create \
     --service wallet-backend \
     --domain api.seudominio.com \
     --region us-central1
   ```

2. **Configurar DNS:**
   - Adicione os registros DNS fornecidos pelo Cloud Run

## Monitoramento e Logs

### Visualizar logs:
```bash
gcloud run logs tail wallet-backend --region us-central1
```

### Métricas no Console:
- Acesse o Console do Cloud Run
- Selecione seu serviço
- Vá para a aba "Métricas"

## Comandos Úteis

### Ver serviços:
```bash
gcloud run services list
```

### Descrever serviço:
```bash
gcloud run services describe wallet-backend --region us-central1
```

### Atualizar configurações:
```bash
gcloud run services update wallet-backend \
  --memory 1Gi \
  --cpu 2 \
  --region us-central1
```

### Deletar serviço:
```bash
gcloud run services delete wallet-backend --region us-central1
```

## Troubleshooting

### Erro de Memória
Aumente a memória alocada:
```bash
gcloud run services update wallet-backend --memory 1Gi --region us-central1
```

### Timeout
Aumente o timeout:
```bash
gcloud run services update wallet-backend --timeout 600s --region us-central1
```

### Problemas de Conexão com DB
- Verifique se o banco permite conexões externas
- Configure IP permitidos se necessário
- Use Cloud SQL Proxy se estiver usando Cloud SQL

## Custos

O Cloud Run cobra por:
- Tempo de CPU usado
- Memória alocada
- Número de requisições
- Tráfego de rede

Com `min-instances=0`, não há cobrança quando não há tráfego.

## Próximos Passos

1. Configure CI/CD com GitHub Actions ou Cloud Build
2. Implemente health checks
3. Configure alertas de monitoramento
4. Otimize a imagem Docker para reduzir tempo de cold start
