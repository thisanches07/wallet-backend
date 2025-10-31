import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { PluggyService } from './pluggy.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PluggyService', () => {
  let service: PluggyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PluggyService],
    }).compile();

    service = module.get<PluggyService>(PluggyService);

    // Reset mocks
    jest.clearAllMocks();

    // Setup environment variables
    process.env.PLUGGY_CLIENT_ID = 'test-client-id';
    process.env.PLUGGY_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return access token on successful authentication', async () => {
      const mockResponse = { data: { access_token: 'test-access-token' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Use reflection to access private method
      const token = await (service as any).getAccessToken();

      expect(token).toBe('test-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://auth.pluggy.ai/oauth/token',
        {
          grant_type: 'client_credentials',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      );
    });

    it('should throw error on authentication failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(
        new Error('Authentication failed'),
      );

      await expect((service as any).getAccessToken()).rejects.toThrow(
        'Failed to authenticate with Pluggy API',
      );
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockTokenResponse = { data: { access_token: 'test-access-token' } };
      const mockUserResponse = { data: { id: 'user-123' } };

      mockedAxios.post
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockUserResponse);

      const userId = await service.createUser();

      expect(userId).toBe('user-123');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        'https://api.pluggy.ai/users',
        {},
        {
          headers: { Authorization: 'Bearer test-access-token' },
        },
      );
    });

    it('should throw error on user creation failure', async () => {
      const mockTokenResponse = { data: { access_token: 'test-access-token' } };

      mockedAxios.post
        .mockResolvedValueOnce(mockTokenResponse)
        .mockRejectedValueOnce(new Error('User creation failed'));

      await expect(service.createUser()).rejects.toThrow(
        'Failed to create user in Pluggy API',
      );
    });
  });

  describe('createConnectToken', () => {
    it('should create connect token successfully', async () => {
      const mockTokenResponse = { data: { access_token: 'test-access-token' } };
      const mockConnectTokenResponse = {
        data: { connectToken: 'connect-token-123' },
      };

      mockedAxios.post
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockConnectTokenResponse);

      const connectToken = await service.createConnectToken('user-123');

      expect(connectToken).toBe('connect-token-123');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        'https://api.pluggy.ai/connect_token',
        { userId: 'user-123' },
        {
          headers: { Authorization: 'Bearer test-access-token' },
        },
      );
    });

    it('should throw error on connect token creation failure', async () => {
      const mockTokenResponse = { data: { access_token: 'test-access-token' } };

      mockedAxios.post
        .mockResolvedValueOnce(mockTokenResponse)
        .mockRejectedValueOnce(new Error('Connect token creation failed'));

      await expect(service.createConnectToken('user-123')).rejects.toThrow(
        'Failed to create connect token in Pluggy API',
      );
    });
  });
});
