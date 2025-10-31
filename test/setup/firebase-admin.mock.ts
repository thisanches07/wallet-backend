jest.mock('firebase-admin', () => {
  return {
    __esModule: true,
    default: {
      initializeApp: jest.fn().mockReturnValue({
        auth: () => ({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'fake-uid',
            email: 'user@example.com',
            name: 'Test User',
          }),
        }),
      }),
      credential: {
        cert: jest.fn().mockReturnValue({}),
      },
    },
  };
});
