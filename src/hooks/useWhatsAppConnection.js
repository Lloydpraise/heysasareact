import { useCallback, useState } from 'react';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const mockResponses = {
  '/api/whatsapp/instances/connect': {
    success: true,
    message: 'Connection started successfully.',
    qrCode: 'mock-qr-code',
    instanceId: 'inst_mock_001',
  },
  '/api/whatsapp/instances/request-otp': {
    success: true,
    message: 'OTP sent successfully.',
    otpSent: true,
  },
  '/api/whatsapp/instances/verify-otp': {
    success: true,
    message: 'OTP verified successfully.',
    connected: true,
    instanceId: 'inst_mock_001',
  },
  '/api/whatsapp/instances/save': {
    success: true,
    message: 'Connection saved successfully.',
    id: 'inst_mock_001',
  },
};

async function requestJson(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...jsonHeaders,
        ...(options.headers ?? {}),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const fallback = mockResponses[url];
      if (fallback) {
        return fallback;
      }
      throw new Error(payload?.message || payload?.error || 'The WhatsApp connection request failed.');
    }

    return payload;
  } catch (error) {
    const fallback = mockResponses[url];
    if (fallback) {
      return fallback;
    }

    throw error;
  }
}

export function useWhatsAppConnection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const runRequest = useCallback(async (url, payload, method = 'POST') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await requestJson(url, {
        method,
        body: JSON.stringify(payload),
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while connecting WhatsApp.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const initiateConnection = useCallback(async ({ phoneNumber, connectionType = 'qr' }) => {
    if (!phoneNumber) {
      throw new Error('Phone number is required.');
    }

    return runRequest('/api/whatsapp/instances/connect', {
      phoneNumber,
      connectionType,
    });
  }, [runRequest]);

  const requestOtp = useCallback(async ({ phoneNumber }) => {
    if (!phoneNumber) {
      throw new Error('Phone number is required.');
    }

    return runRequest('/api/whatsapp/instances/request-otp', {
      phoneNumber,
    });
  }, [runRequest]);

  const verifyOtp = useCallback(async ({ phoneNumber, otp }) => {
    if (!phoneNumber || !otp) {
      throw new Error('OTP and phone number are required.');
    }

    return runRequest('/api/whatsapp/instances/verify-otp', {
      phoneNumber,
      otp,
    });
  }, [runRequest]);

  const saveConnection = useCallback(async ({ phoneNumber, name }) => {
    if (!phoneNumber) {
      throw new Error('Phone number is required.');
    }

    return runRequest('/api/whatsapp/instances/save', {
      phoneNumber,
      name: name || 'WhatsApp connection',
    });
  }, [runRequest]);

  return {
    isSubmitting,
    error,
    initiateConnection,
    requestOtp,
    verifyOtp,
    saveConnection,
  };
}
