import axios from 'axios';

export class ApiTokenUtil {
  static async generatePluggyApiKey(): Promise<string> {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing Pluggy Client ID or Secret in environment variables.',
      );
    }

    try {
      const response = await axios.post('https://api.pluggy.ai/auth', {
        clientId,
        clientSecret,
      });

      return response.data.apiKey;
    } catch (error) {
      console.error('Erro ao gerar token da Pluggy:', error);
      throw new Error('Não foi possível gerar o token da Pluggy.');
    }
  }
}
